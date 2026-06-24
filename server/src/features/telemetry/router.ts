import { Hono, type Context } from "hono";
import { z } from "zod";
import { requireAuth } from "../auth/middleware.ts";
import { redis, redisKeys } from "../../redis/index.ts";
import { db } from "../../db/index.ts";
import { deliveryPartners, locationPings, users, driverSessions } from "../../db/schema.ts";
import { eq, desc, and, or, like, lte, gte, isNull } from "drizzle-orm";
import { trackingWsRoute, broadcastTelemetry } from "./websocket.ts";

export const telemetryRouter = new Hono();

// Zod validation schema for location ping payloads
const telemetryPingSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().nonnegative(),
  battery: z.number().min(0).max(100),
});

// GET /locations/ws - Upgrade to WebSocket for live admin dashboard streams
telemetryRouter.get("/ws", trackingWsRoute);

// POST /locations/ping - Periodic REST telemetry ping from online mobile drivers
telemetryRouter.post("/ping", requireAuth(["delivery_partner"]), async (c) => {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "UNAUTHORIZED", message: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const parsed = telemetryPingSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "VALIDATION_ERROR", message: "Invalid coordinate or telemetry values", details: parsed.error.format() }, 400);
    }

    const { latitude, longitude, speed, battery } = parsed.data;

    // Resolve deliveryPartner id from user_id
    const [driver] = await db
      .select({ id: deliveryPartners.id })
      .from(deliveryPartners)
      .where(eq(deliveryPartners.userId, user.id))
      .limit(1);

    if (!driver) {
      return c.json({ error: "NOT_FOUND", message: "Driver profile not found" }, 404);
    }

    const driverId = driver.id;

    // 1. Update location in Redis GEO index (Redis expects longitude first, then latitude)
    await redis.geoadd(redisKeys.driverLocations, longitude, latitude, driverId);

    // 2. Save active driver telemetry details in Redis Hash
    const detailsKey = redisKeys.driverDetails(driverId);
    await redis.hset(detailsKey, {
      id: driverId,
      name: user.name,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      speed: `${speed.toFixed(1)} km/h`,
      battery: battery.toString(),
      timestamp: Date.now().toString(),
      status: "online",
      activeOrder: "None", // default for MVP
    });
    // Expire detail records after 24 hours of inactivity
    await redis.expire(detailsKey, 86400);

    // 3. Broadcast real-time update to all connected WebSocket clients (FIRST PRIORITY)
    const telemetryData = {
      id: driverId,
      name: user.name,
      lat: latitude,
      lng: longitude,
      speed: `${speed.toFixed(1)} km/h`,
      battery,
      status: "online",
      activeOrder: "None",
    };
    broadcastTelemetry(driverId, telemetryData);

    // 4. Save location ping to DB asynchronously (SECOND PRIORITY - non-blocking)
    db.insert(locationPings)
      .values({
        deliveryPartnerId: driverId,
        latitude,
        longitude,
        speed,
        battery,
        recordedAt: new Date(),
      })
      .catch((err) => {
        console.error("[locations/ping] Async DB insert failed:", err);
      });

    return c.json({ success: true, message: "Telemetry recorded successfully", data: telemetryData }, 200);
  } catch (err: any) {
    console.error("[locations/ping] error:", err);
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to record location update" }, 500);
  }
});

// Shared handler for fetching online fleet
const getLiveFleetHandler = async (c: Context) => {
  try {
    const pageQuery = c.req.query("page");
    const page = pageQuery ? parseInt(pageQuery, 10) : 1;
    
    const limitQuery = c.req.query("limit");
    const limit = limitQuery ? parseInt(limitQuery, 10) : 10;
    
    const searchQuery = c.req.query("search") || "";

    // 1. Get all drivers marked 'online' in the database (Source of Truth for Online Status)
    const dbOnlineDrivers = await db
      .select({
        id: deliveryPartners.id,
        name: users.name,
        status: deliveryPartners.status,
      })
      .from(deliveryPartners)
      .innerJoin(users, eq(deliveryPartners.userId, users.id))
      .where(eq(deliveryPartners.status, "online"));

    const onlineDrivers = [];
    const now = Date.now();

    for (const driver of dbOnlineDrivers) {
      const driverId = driver.id;
      const detailsKey = redisKeys.driverDetails(driverId);
      const details = await redis.hgetall(detailsKey);

      // Check if we have fresh Redis telemetry details (less than 60s old)
      let hasRedisTelemetry = false;
      if (Object.keys(details).length > 0) {
        const lastPingTime = parseInt(details.timestamp, 10);
        if (now - lastPingTime <= 60000) {
          hasRedisTelemetry = true;
        }
      }

      if (hasRedisTelemetry) {
        onlineDrivers.push({
          id: details.id,
          name: details.name,
          lat: parseFloat(details.latitude),
          lng: parseFloat(details.longitude),
          speed: details.speed,
          battery: parseInt(details.battery, 10),
          status: details.status,
          activeOrder: details.activeOrder || "None",
        });
      } else {
        // Fallback: Driver is online in DB but has no active Redis telemetry.
        // Retrieve their latest recorded ping from PostgreSQL.
        const [latestPing] = await db
          .select()
          .from(locationPings)
          .where(eq(locationPings.deliveryPartnerId, driverId))
          .orderBy(desc(locationPings.recordedAt))
          .limit(1);

        onlineDrivers.push({
          id: driverId,
          name: driver.name,
          lat: latestPing ? latestPing.latitude : 12.9716, // Fallback to Bangalore default center
          lng: latestPing ? latestPing.longitude : 77.5946,
          speed: latestPing ? `${latestPing.speed?.toFixed(1)} km/h` : "0.0 km/h",
          battery: latestPing ? (latestPing.battery ?? 100) : 100,
          status: "online",
          activeOrder: "None",
        });
      }
    }

    // Filter by search query if present
    const filteredDrivers = searchQuery
      ? onlineDrivers.filter(
          (d) =>
            d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.id.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : onlineDrivers;

    const total = filteredDrivers.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedDrivers = filteredDrivers.slice(startIndex, startIndex + limit);

    return c.json({
      success: true,
      count: paginatedDrivers.length,
      data: paginatedDrivers,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
      }
    }, 200);
  } catch (err: any) {
    console.error("[locations/live] error:", err);
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to fetch online fleet" }, 500);
  }
};

// GET /locations/live - Fetch currently online drivers for dashboard startup
telemetryRouter.get("/live", requireAuth(["super_admin", "store_manager", "dispatcher"]), getLiveFleetHandler);

// GET /locations/online - Compatibility fallback alias
telemetryRouter.get("/online", requireAuth(["super_admin", "store_manager", "dispatcher"]), getLiveFleetHandler);

// GET /locations/drivers/:driverId/latest - Fetch latest location for a specific driver
telemetryRouter.get("/drivers/:driverId/latest", requireAuth(["super_admin", "store_manager", "dispatcher"]), async (c) => {
  try {
    const driverId = c.req.param("driverId");
    const details = await redis.hgetall(redisKeys.driverDetails(driverId));

    if (Object.keys(details).length === 0) {
      return c.json({ error: "NOT_FOUND", message: "No active telemetry found for driver" }, 404);
    }

    return c.json({
      id: details.id,
      name: details.name,
      lat: parseFloat(details.latitude),
      lng: parseFloat(details.longitude),
      speed: details.speed,
      battery: parseInt(details.battery, 10),
      status: details.status,
    }, 200);
  } catch (err: any) {
    console.error("[locations/driver/latest] error:", err);
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve driver location" }, 500);
  }
});

// GET /locations/orders/:orderId/latest - Stub for order tracking
telemetryRouter.get("/orders/:orderId/latest", (c) => {
  return c.json({ orderId: c.req.param("orderId"), lat: 12.9716, lng: 77.5946 });
});

// GET /locations/orders/:orderId/history - Stub for order route replay history
telemetryRouter.get("/locations/orders/:orderId/history", (c) => {
  return c.json({ orderId: c.req.param("orderId"), pings: [] });
});

// GET /locations/replay/drivers - Retrieve drivers who had online shifts on a specific date
telemetryRouter.get("/replay/drivers", requireAuth(["super_admin", "store_manager", "dispatcher"]), async (c) => {
  try {
    const dateStr = c.req.query("date") || new Date().toISOString().split("T")[0];
    const search = c.req.query("search") || "";
    const page = c.req.query("page") ? parseInt(c.req.query("page")!, 10) : 1;
    const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!, 10) : 10;
    const offset = (page - 1) * limit;

    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    // A session overlaps with [dayStart, dayEnd] if startedAt <= dayEnd AND (endedAt >= dayStart OR endedAt IS NULL)
    const conditions = [
      lte(driverSessions.startedAt, dayEnd),
      or(
        gte(driverSessions.endedAt, dayStart),
        isNull(driverSessions.endedAt)
      )
    ];

    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(like(users.name, searchPattern));
    }

    const whereClause = and(...conditions);

    // Fetch unique drivers that have sessions matching
    const driversList = await db
      .select({
        id: deliveryPartners.id,
        name: users.name,
        phone: users.phone,
        vehicleType: deliveryPartners.vehicleType,
        vehicleNumber: deliveryPartners.vehicleNumber,
      })
      .from(driverSessions)
      .innerJoin(deliveryPartners, eq(driverSessions.deliveryPartnerId, deliveryPartners.id))
      .innerJoin(users, eq(deliveryPartners.userId, users.id))
      .where(whereClause)
      .groupBy(
        deliveryPartners.id,
        users.name,
        users.phone,
        deliveryPartners.vehicleType,
        deliveryPartners.vehicleNumber
      )
      .orderBy(users.name)
      .limit(limit)
      .offset(offset);

    // Get total unique drivers matching the filter
    const totalCountQuery = await db
      .select({
        id: deliveryPartners.id,
      })
      .from(driverSessions)
      .innerJoin(deliveryPartners, eq(driverSessions.deliveryPartnerId, deliveryPartners.id))
      .innerJoin(users, eq(deliveryPartners.userId, users.id))
      .where(whereClause)
      .groupBy(deliveryPartners.id);

    const total = totalCountQuery.length;
    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      data: driversList,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      }
    }, 200);
  } catch (err: any) {
    console.error("[locations/replay/drivers] error:", err);
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve active drivers for date" }, 500);
  }
});

// GET /locations/replay/pings - Retrieve full track of coordinates for a driver on a specific date
telemetryRouter.get("/replay/pings", requireAuth(["super_admin", "store_manager", "dispatcher"]), async (c) => {
  try {
    const driverId = c.req.query("driverId");
    const dateStr = c.req.query("date") || new Date().toISOString().split("T")[0];

    if (!driverId) {
      return c.json({ error: "VALIDATION_ERROR", message: "driverId is required" }, 400);
    }

    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

    const pings = await db
      .select({
        latitude: locationPings.latitude,
        longitude: locationPings.longitude,
        recordedAt: locationPings.recordedAt,
        speed: locationPings.speed,
        battery: locationPings.battery,
      })
      .from(locationPings)
      .where(
        and(
          eq(locationPings.deliveryPartnerId, driverId),
          gte(locationPings.recordedAt, dayStart),
          lte(locationPings.recordedAt, dayEnd)
        )
      )
      .orderBy(locationPings.recordedAt);

    // Optimized response structure: flat array of [latitude, longitude, timestampSeconds, speed, battery]
    const flatPings = pings.map(p => [
      p.latitude,
      p.longitude,
      Math.floor(p.recordedAt.getTime() / 1000),
      p.speed || 0,
      p.battery || 0
    ]);

    return c.json({
      success: true,
      pings: flatPings,
    }, 200);
  } catch (err: any) {
    console.error("[locations/replay/pings] error:", err);
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve coordinates for replay" }, 500);
  }
});

