import type { Context } from "hono";
import * as orderService from "./service.ts";
import { createOrderSchema } from "./types.ts";
import { db } from "../../db/index.ts";
import { deliveryPartners } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

function formatValidationError(parsed: { error: any }) {
  const errors: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed.error.flatten().fieldErrors)) {
    if (value && Array.isArray(value) && value.length > 0) {
      errors[key] = value[0];
    }
  }
  return {
    success: false,
    message: "Validation Failed",
    errors,
  };
}

// Resolve driverPartnerId from user context (which contains users table columns)
async function getDriverPartner(userId: string) {
  const [partner] = await db
    .select()
    .from(deliveryPartners)
    .where(eq(deliveryPartners.userId, userId))
    .limit(1);
  return partner;
}

export async function createOrder(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }

    const order = await orderService.createOrder(user.id, parsed.data);
    return c.json({
      success: true,
      message: "Order placed successfully",
      data: order,
    }, 201);
  } catch (err: any) {
    console.error("[createOrder] controller error:", err);
    const msg = err.message || "";
    if (msg.includes("PRODUCT_NOT_AVAILABLE") || msg.includes("ADDRESS_NOT_FOUND")) {
      return c.json({ success: false, message: msg }, 400);
    }
    return c.json({
      success: false,
      message: "Failed to place order",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function getCustomerOrders(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "10", 10);

    const { list, totalItems } = await orderService.getCustomerOrders(user.id, page, limit);
    const totalPages = Math.ceil(totalItems / limit);

    return c.json({
      success: true,
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    }, 200);
  } catch (err) {
    console.error("[getCustomerOrders] controller error:", err);
    return c.json({ success: false, message: "Failed to fetch orders" }, 500);
  }
}

export async function getCustomerOrderById(c: Context) {
  try {
    const user = c.get("user");
    const id = c.req.param("id")!;
    if (!user) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const order = await orderService.getCustomerOrderById(user.id, id);
    if (!order) {
      return c.json({ success: false, message: "Order not found" }, 404);
    }

    return c.json({ success: true, data: order }, 200);
  } catch (err) {
    console.error("[getCustomerOrderById] controller error:", err);
    return c.json({ success: false, message: "Failed to fetch order detail" }, 500);
  }
}

export async function getOrders(c: Context) {
  try {
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "10", 10);
    const status = c.req.query("status");
    const storeId = c.req.query("storeId");
    const search = c.req.query("search");

    const { list, totalItems } = await orderService.getOrders({
      page,
      limit,
      status,
      storeId,
      search,
    });
    const totalPages = Math.ceil(totalItems / limit);

    return c.json({
      success: true,
      data: list,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    }, 200);
  } catch (err) {
    console.error("[getOrders] controller error:", err);
    return c.json({ success: false, message: "Failed to fetch orders queue" }, 500);
  }
}

export async function assignDriver(c: Context) {
  try {
    const user = c.get("user");
    const orderId = c.req.param("id")!;
    const { driverId } = await c.req.json();

    if (!driverId) {
      return c.json({ success: false, message: "driverId is required" }, 400);
    }

    const order = await orderService.assignDriver(orderId, driverId, user?.id);
    return c.json({
      success: true,
      message: "Driver assigned successfully",
      data: order,
    }, 200);
  } catch (err: any) {
    console.error("[assignDriver] controller error:", err);
    if (err.message === "ORDER_NOT_FOUND" || err.message === "DRIVER_NOT_FOUND") {
      return c.json({ success: false, message: err.message }, 404);
    }
    return c.json({ success: false, message: "Failed to assign driver" }, 500);
  }
}

export async function getBroadcastsForDriver(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ success: false, message: "Unauthorized" }, 401);
    }

    const partner = await getDriverPartner(user.id);
    if (!partner) {
      return c.json({ success: false, message: "Driver profile not found" }, 404);
    }

    const broadcasts = await orderService.getBroadcastsForDriver(partner.id);
    return c.json({ success: true, data: broadcasts }, 200);
  } catch (err) {
    console.error("[getBroadcastsForDriver] controller error:", err);
    return c.json({ success: false, message: "Failed to retrieve broadcasts" }, 500);
  }
}

export async function acceptOrder(c: Context) {
  try {
    const user = c.get("user");
    const orderId = c.req.param("id")!;

    const partner = await getDriverPartner(user.id);
    if (!partner) {
      return c.json({ success: false, message: "Driver profile not found" }, 404);
    }

    const order = await orderService.acceptOrder(orderId, partner.id);
    return c.json({
      success: true,
      message: "Order job accepted successfully",
      data: order,
    }, 200);
  } catch (err: any) {
    console.error("[acceptOrder] controller error:", err);
    if (err.message === "ORDER_ALREADY_ACCEPTED") {
      return c.json({ success: false, error: "ORDER_ALREADY_ACCEPTED", message: "Job already accepted by another driver" }, 400);
    }
    if (err.message === "ORDER_NOT_FOUND" || err.message === "DRIVER_NOT_FOUND") {
      return c.json({ success: false, message: err.message }, 404);
    }
    return c.json({ success: false, message: "Failed to accept order" }, 500);
  }
}

export async function ignoreOrder(c: Context) {
  try {
    const user = c.get("user");
    const orderId = c.req.param("id")!;

    const partner = await getDriverPartner(user.id);
    if (!partner) {
      return c.json({ success: false, message: "Driver profile not found" }, 404);
    }

    await orderService.ignoreOrder(orderId, partner.id);
    return c.json({ success: true, message: "Order broadcast ignored successfully" }, 200);
  } catch (err: any) {
    console.error("[ignoreOrder] controller error:", err);
    if (err.message === "ORDER_NOT_FOUND") {
      return c.json({ success: false, message: err.message }, 404);
    }
    return c.json({ success: false, message: "Failed to ignore order" }, 500);
  }
}

export async function reachedStore(c: Context) {
  try {
    const user = c.get("user");
    const orderId = c.req.param("id")!;
    const body = await c.req.json().catch(() => ({}));
    const { latitude, longitude } = body;

    if (latitude === undefined || longitude === undefined) {
      return c.json({ success: false, error: "COORDINATES_REQUIRED", message: "Coordinates (latitude, longitude) are required for verification." }, 400);
    }

    const partner = await getDriverPartner(user.id);
    if (!partner) return c.json({ success: false, message: "Driver profile not found" }, 404);

    const order = await orderService.logOrderEvent(orderId, partner.id, "reached_store", undefined, latitude, longitude);
    return c.json({ success: true, message: "Status updated: Reached Store", data: order }, 200);
  } catch (err: any) {
    console.error("[reachedStore] error:", err);
    const msg = err.message || "";
    if (msg === "DRIVER_NOT_NEARBY") {
      return c.json({ success: false, error: "DRIVER_NOT_NEARBY", message: "You must be within 100 meters of the store." }, 400);
    }
    return c.json({ success: false, message: err.message || "Failed to update status" }, 400);
  }
}

export async function pickedUp(c: Context) {
  try {
    const user = c.get("user");
    const orderId = c.req.param("id")!;

    const partner = await getDriverPartner(user.id);
    if (!partner) return c.json({ success: false, message: "Driver profile not found" }, 404);

    const order = await orderService.logOrderEvent(orderId, partner.id, "picked_up", "picked_up");
    return c.json({ success: true, message: "Status updated: Picked Up", data: order }, 200);
  } catch (err: any) {
    console.error("[pickedUp] error:", err);
    return c.json({ success: false, message: err.message || "Failed to update status" }, 400);
  }
}

export async function outForDelivery(c: Context) {
  try {
    const user = c.get("user");
    const orderId = c.req.param("id")!;

    const partner = await getDriverPartner(user.id);
    if (!partner) return c.json({ success: false, message: "Driver profile not found" }, 404);

    const order = await orderService.logOrderEvent(orderId, partner.id, "out_for_delivery", "in_transit");
    return c.json({ success: true, message: "Status updated: Out for Delivery", data: order }, 200);
  } catch (err: any) {
    console.error("[outForDelivery] error:", err);
    return c.json({ success: false, message: err.message || "Failed to update status" }, 400);
  }
}

export async function reachedLocation(c: Context) {
  try {
    const user = c.get("user");
    const orderId = c.req.param("id")!;
    const body = await c.req.json().catch(() => ({}));
    const { latitude, longitude } = body;

    if (latitude === undefined || longitude === undefined) {
      return c.json({ success: false, error: "COORDINATES_REQUIRED", message: "Coordinates (latitude, longitude) are required for verification." }, 400);
    }

    const partner = await getDriverPartner(user.id);
    if (!partner) return c.json({ success: false, message: "Driver profile not found" }, 404);

    const order = await orderService.logOrderEvent(orderId, partner.id, "reached_location", undefined, latitude, longitude);
    return c.json({ success: true, message: "Status updated: Reached Location", data: order }, 200);
  } catch (err: any) {
    console.error("[reachedLocation] error:", err);
    const msg = err.message || "";
    if (msg === "DRIVER_NOT_NEARBY") {
      return c.json({ success: false, error: "DRIVER_NOT_NEARBY", message: "You must be within 100 meters of the delivery location." }, 400);
    }
    return c.json({ success: false, message: err.message || "Failed to update status" }, 400);
  }
}

export async function completeOrder(c: Context) {
  try {
    const user = c.get("user");
    const orderId = c.req.param("id")!;
    const { pin, deliveryProofImageKey } = await c.req.json();

    if (!pin) {
      return c.json({ success: false, message: "PIN code is required" }, 400);
    }

    const partner = await getDriverPartner(user.id);
    if (!partner) return c.json({ success: false, message: "Driver profile not found" }, 404);

    const order = await orderService.completeOrder(orderId, partner.id, pin, deliveryProofImageKey);
    return c.json({ success: true, message: "Order delivered successfully", data: order }, 200);
  } catch (err: any) {
    console.error("[completeOrder] error:", err);
    if (err.message === "INVALID_PIN") {
      return c.json({ success: false, error: "INVALID_PIN", message: "Verification failed: Incorrect 4-digit PIN" }, 400);
    }
    return c.json({ success: false, message: err.message || "Failed to complete order" }, 500);
  }
}

export async function cancelOrder(c: Context) {
  try {
    const user = c.get("user");
    const orderId = c.req.param("id")!;

    let actorId = user.id;

    if (user.role === "delivery_partner") {
      const partner = await getDriverPartner(user.id);
      if (!partner) return c.json({ success: false, message: "Driver profile not found" }, 404);
    }

    const order = await orderService.cancelOrder(orderId, actorId);
    return c.json({ success: true, message: "Order cancelled successfully", data: order }, 200);
  } catch (err: any) {
    console.error("[cancelOrder] error:", err);
    return c.json({ success: false, message: err.message || "Failed to cancel order" }, 500);
  }
}

export async function getTrackDetails(c: Context) {
  try {
    const trackingToken = c.req.param("trackingToken")!;
    const details = await orderService.getTrackDetails(trackingToken);
    if (!details) {
      return c.json({ success: false, message: "Invalid or expired tracking token" }, 404);
    }
    return c.json({ success: true, data: details }, 200);
  } catch (err) {
    console.error("[getTrackDetails] error:", err);
    return c.json({ success: false, message: "Failed to load tracking details" }, 500);
  }
}

export async function getTrackLocation(c: Context) {
  try {
    const trackingToken = c.req.param("trackingToken")!;
    const details = await orderService.getTrackDetails(trackingToken);
    if (!details || !details.driver) {
      return c.json({ success: false, message: "Driver location not active or order not assigned" }, 404);
    }
    return c.json({
      success: true,
      data: {
        latitude: details.driver.latitude,
        longitude: details.driver.longitude,
        speed: details.driver.speed,
        battery: details.driver.battery,
        lastPingAt: details.driver.lastPingAt,
      }
    }, 200);
  } catch (err) {
    console.error("[getTrackLocation] error:", err);
    return c.json({ success: false, message: "Failed to load driver location" }, 500);
  }
}

export async function getDashboardStats(c: Context) {
  try {
    const stats = await orderService.getDashboardStats();
    return c.json({ success: true, data: stats }, 200);
  } catch (err) {
    console.error("[getDashboardStats] error:", err);
    return c.json({ success: false, message: "Failed to load dashboard metrics" }, 500);
  }
}

export async function getActiveOrderForDriver(c: Context) {
  try {
    const user = c.get("user");
    if (!user) return c.json({ success: false, message: "Unauthorized" }, 401);

    const partner = await getDriverPartner(user.id);
    if (!partner) return c.json({ success: false, message: "Driver profile not found" }, 404);

    const activeOrder = await orderService.getActiveOrderForDriver(partner.id);
    return c.json({ success: true, data: activeOrder }, 200);
  } catch (err) {
    console.error("[getActiveOrderForDriver] error:", err);
    return c.json({ success: false, message: "Failed to retrieve active order" }, 500);
  }
}
