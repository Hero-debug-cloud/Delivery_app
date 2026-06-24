import type { Context } from "hono";
import * as service from "./service.ts";
import { onboardDriverSchema, rejectDriverSchema, createDriverSchema } from "./types.ts";
import { redis, redisKeys } from "../../redis/index.ts";
import { broadcastStatusChange } from "../telemetry/websocket.ts";
import { db } from "../../db/index.ts";
import { deliveryPartners } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

export async function onboardMe(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "UNAUTHORIZED", message: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const parsed = onboardDriverSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    await service.onboardDriver(user.id, parsed.data);
    return c.json({ success: true, message: "Onboarding details submitted successfully" }, 200);
  } catch (err: any) {
    console.error("[onboardMe] error:", err);
    if (err.message === "DRIVER_NOT_FOUND") {
      return c.json({ error: "NOT_FOUND", message: "Driver profile not found" }, 404);
    }
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to submit onboarding details" }, 500);
  }
}

export async function getDrivers(c: Context) {
  try {
    const onboardingStatus = c.req.query("onboardingStatus");
    const search = c.req.query("search");
    
    const pageQuery = c.req.query("page");
    const page = pageQuery ? parseInt(pageQuery) : 1;

    const limitQuery = c.req.query("limit");
    const limit = limitQuery ? parseInt(limitQuery) : 10;

    const result = await service.getDrivers({
      onboardingStatus,
      search,
      page,
      limit,
    });

    return c.json({
      success: true,
      message: "Delivery partners fetched successfully",
      data: result.list,
      pagination: result.pagination,
    }, 200);
  } catch (err: any) {
    console.error("[getDrivers] error:", err);
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to fetch delivery partners" }, 500);
  }
}

export async function approveDriver(c: Context) {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "VALIDATION_ERROR", message: "Driver ID is required" }, 400);
    }
    await service.approveDriver(id);
    return c.json({ success: true, message: "Driver approved successfully" }, 200);
  } catch (err: any) {
    console.error("[approveDriver] error:", err);
    if (err.message === "DRIVER_NOT_FOUND") {
      return c.json({ error: "NOT_FOUND", message: "Driver not found" }, 404);
    }
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to approve driver" }, 500);
  }
}

export async function rejectDriver(c: Context) {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ error: "VALIDATION_ERROR", message: "Driver ID is required" }, 400);
    }
    const body = await c.req.json();
    const parsed = rejectDriverSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    await service.rejectDriver(id, parsed.data.reason);
    return c.json({ success: true, message: "Driver application rejected" }, 200);
  } catch (err: any) {
    console.error("[rejectDriver] error:", err);
    if (err.message === "DRIVER_NOT_FOUND") {
      return c.json({ error: "NOT_FOUND", message: "Driver not found" }, 404);
    }
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to reject driver" }, 500);
  }
}

export async function createDriver(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = createDriverSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const id = await service.createDriver(parsed.data);
    return c.json({ success: true, message: "Driver created successfully", id }, 201);
  } catch (err: any) {
    console.error("[createDriver] error:", err);
    if (err.message === "PHONE_EXISTS") {
      return c.json({ error: "CONFLICT", message: "A driver with this phone number already exists" }, 409);
    }
    if (err.message === "EMAIL_EXISTS") {
      return c.json({ error: "CONFLICT", message: "A driver with this email address already exists" }, 409);
    }
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to manually create driver" }, 500);
  }
}

export async function updateStatus(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "UNAUTHORIZED", message: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const { status, storeId } = body;

    if (status !== "online" && status !== "offline") {
      return c.json({ error: "VALIDATION_ERROR", message: "Status must be 'online' or 'offline'" }, 400);
    }

    await service.updateDriverStatus(user.id, status, storeId || null);

    // Resolve driver ID to clean up location telemetry
    const [driver] = await db
      .select({ id: deliveryPartners.id })
      .from(deliveryPartners)
      .where(eq(deliveryPartners.userId, user.id))
      .limit(1);

    if (driver) {
      const driverId = driver.id;
      if (status === "offline") {
        // Clean up locations and details in Redis
        await redis.zrem(redisKeys.driverLocations, driverId);
        await redis.del(redisKeys.driverDetails(driverId));
      }
      
      // Broadcast status change event to all connected admin panels
      broadcastStatusChange(driverId, status, user.name);
    }

    return c.json({ success: true, message: `Driver status updated to ${status}` }, 200);
  } catch (err: any) {
    console.error("[updateStatus] error:", err);
    if (err.message === "DRIVER_NOT_FOUND") {
      return c.json({ error: "NOT_FOUND", message: "Driver profile not found" }, 404);
    }
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to update driver status" }, 500);
  }
}

export async function getProfile(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "UNAUTHORIZED", message: "Not authenticated" }, 401);
    }

    const profile = await service.getDriverProfile(user.id);
    return c.json({ success: true, profile }, 200);
  } catch (err: any) {
    console.error("[getProfile] error:", err);
    if (err.message === "DRIVER_NOT_FOUND") {
      return c.json({ error: "NOT_FOUND", message: "Driver profile not found" }, 404);
    }
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve profile" }, 500);
  }
}

export async function updateProfile(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "UNAUTHORIZED", message: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const { name, email, profilePictureUrl } = body;

    const profile = await service.updateDriverProfile(user.id, { name, email, profilePictureUrl });
    return c.json({ success: true, message: "Profile updated successfully", profile }, 200);
  } catch (err: any) {
    console.error("[updateProfile] error:", err);
    if (err.message === "DUPLICATE_EMAIL") {
      return c.json({ error: "CONFLICT", message: "An account with this email address already exists" }, 409);
    }
    if (err.message === "DRIVER_NOT_FOUND") {
      return c.json({ error: "NOT_FOUND", message: "Driver profile not found" }, 404);
    }
    return c.json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to update profile" }, 500);
  }
}
