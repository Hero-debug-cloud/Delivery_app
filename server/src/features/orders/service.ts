import { db } from "../../db/index.ts";
import { 
  orders, 
  orderItems, 
  orderEvents, 
  products, 
  users, 
  deliveryPartners, 
  customerAddresses, 
  stores 
} from "../../db/schema.ts";
import { eq, and, desc, or, like, count } from "drizzle-orm";
import { redis, redisKeys } from "../../redis/index.ts";
import type { CreateOrderInput, OrderQueryFilters } from "./types.ts";
import crypto from "crypto";
import { getPresignedUrl } from "../upload/s3.ts";

export async function createOrder(customerId: string, input: CreateOrderInput) {
  // 1. Idempotency Check
  const [existingOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.externalOrderId, input.externalOrderId))
    .limit(1);

  if (existingOrder) {
    console.log(`[createOrder] Idempotent hit: returning existing order ${existingOrder.id}`);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, existingOrder.id));
    const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, existingOrder.id)).orderBy(desc(orderEvents.createdAt));
    return { ...existingOrder, items, events };
  }

  // 2. Fetch Customer and Address Info
  const [user] = await db.select().from(users).where(eq(users.id, customerId)).limit(1);
  if (!user) throw new Error("CUSTOMER_NOT_FOUND");

  const [address] = await db
    .select()
    .from(customerAddresses)
    .where(and(eq(customerAddresses.id, input.addressId), eq(customerAddresses.customerId, customerId)))
    .limit(1);
  if (!address) throw new Error("ADDRESS_NOT_FOUND");

  // 3. Fetch Store Info
  const [store] = await db.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
  if (!store) throw new Error("STORE_NOT_FOUND");

  // 4. Resolve Product Prices & Check Stock
  const dbProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.storeId, input.storeId), eq(products.inStock, true))); // only in-stock products at this store

  const productMap = new Map(dbProducts.map(p => [p.id, p]));

  let itemTotal = 0;
  const itemsToInsert: any[] = [];

  for (const item of input.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw new Error(`PRODUCT_NOT_AVAILABLE: Product ${item.productId} is not available at this store`);
    }
    const lineTotal = product.price * item.quantity;
    itemTotal += lineTotal;
    itemsToInsert.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal,
    });
  }

  // 5. Calculate Taxes & Fees (Free delivery above ₹199, handling fee ₹15)
  // Prices in database are stored in Paise (Cents). ₹199 = 19900 Paise, ₹49 = 4900 Paise, ₹15 = 1500 Paise.
  const deliveryFee = itemTotal >= 19900 ? 0 : 4900;
  const handlingCharge = 1500;
  const grandTotal = itemTotal + deliveryFee + handlingCharge;

  // 6. Generate secure tokens
  const trackingToken = crypto.randomUUID();
  const proofPin = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code

  // 7. Transaction Write
  return await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        externalOrderId: input.externalOrderId,
        storeId: input.storeId,
        customerId,
        customerName: address.recipientName || user.name,
        customerPhone: address.recipientPhone || user.phone!,
        addressId: input.addressId,
        deliveryAddress: address.address,
        deliveryLatitude: address.latitude,
        deliveryLongitude: address.longitude,
        paymentType: input.paymentType,
        status: "created",
        trackingToken,
        proofPin,
        itemTotal,
        deliveryFee,
        handlingCharge,
        grandTotal,
      })
      .returning();

    // Insert order items
    const insertedItems = await tx
      .insert(orderItems)
      .values(itemsToInsert.map(item => ({ ...item, orderId: order.id })))
      .returning();

    // Log created event
    const [event] = await tx
      .insert(orderEvents)
      .values({
        orderId: order.id,
        eventType: "created",
        actorUserId: customerId,
      })
      .returning();

    return {
      ...order,
      items: insertedItems,
      events: [event],
    };
  });
}

export async function getCustomerOrders(customerId: string, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const list = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, customerId))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalCountQuery] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.customerId, customerId));

  return {
    list,
    totalItems: totalCountQuery ? totalCountQuery.count : 0,
  };
}

export async function getCustomerOrderById(customerId: string, orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.customerId, customerId)))
    .limit(1);

  if (!order) return null;

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, orderId)).orderBy(desc(orderEvents.createdAt));

  return { ...order, items, events };
}

export async function getOrders(filters: OrderQueryFilters) {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.status) {
    conditions.push(eq(orders.status, filters.status as any));
  }
  if (filters.storeId) {
    conditions.push(eq(orders.storeId, filters.storeId));
  }
  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(orders.id, searchPattern),
        like(orders.customerName, searchPattern),
        like(orders.customerPhone, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const list = await db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalCountQuery] = await db
    .select({ count: count() })
    .from(orders)
    .where(whereClause);

  // Resolve additional metadata like store names and assigned driver names
  const enrichedList = [];
  for (const order of list) {
    const [store] = await db.select({ name: stores.name }).from(stores).where(eq(stores.id, order.storeId)).limit(1);
    
    let driverName = null;
    if (order.assignedDriverId) {
      const [driver] = await db
        .select({ name: users.name })
        .from(deliveryPartners)
        .innerJoin(users, eq(deliveryPartners.userId, users.id))
        .where(eq(deliveryPartners.id, order.assignedDriverId))
        .limit(1);
      driverName = driver?.name || null;
    }

    // Check if ignored by all online drivers (only relevant for 'created' orders)
    let ignoredByAll = false;
    if (order.status === "created") {
      const onlineDrivers = await db
        .select({ id: deliveryPartners.id })
        .from(deliveryPartners)
        .where(and(eq(deliveryPartners.storeId, order.storeId), eq(deliveryPartners.status, "online")));

      if (onlineDrivers.length > 0) {
        let ignoreCount = 0;
        for (const driver of onlineDrivers) {
          const isIgnored = await redis.sismember(`order:ignored:${order.id}`, driver.id);
          if (isIgnored) ignoreCount++;
        }
        if (ignoreCount === onlineDrivers.length) {
          ignoredByAll = true;
        }
      } else {
        // No drivers online at all
        ignoredByAll = true;
      }
    }

    enrichedList.push({
      ...order,
      storeName: store?.name || "Unknown Store",
      driverName,
      ignoredByAll,
    });
  }

  return {
    list: enrichedList,
    totalItems: totalCountQuery ? totalCountQuery.count : 0,
  };
}

export async function assignDriver(orderId: string, driverId: string, actorUserId?: string) {
  // Update order status to assigned, set assignedDriverId, clear Redis ignores
  return await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    const [driver] = await tx.select().from(deliveryPartners).where(eq(deliveryPartners.id, driverId)).limit(1);
    if (!driver) throw new Error("DRIVER_NOT_FOUND");

    await tx
      .update(orders)
      .set({
        status: "assigned",
        assignedDriverId: driverId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await tx
      .update(deliveryPartners)
      .set({
        status: "busy",
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartners.id, driverId));

    await tx
      .insert(orderEvents)
      .values({
        orderId,
        eventType: "driver_assigned",
        actorUserId: actorUserId || null,
        metadataJson: { driverId, manual: true },
      });

    // Redis details update
    await redis.hset(redisKeys.driverDetails(driverId), {
      status: "busy",
      activeOrder: orderId,
    });

    // Clear ignored list
    await redis.del(`order:ignored:${orderId}`);

    return order;
  });
}

export async function getBroadcastsForDriver(driverId: string) {
  // Find the driver's active store
  const [driver] = await db.select().from(deliveryPartners).where(eq(deliveryPartners.id, driverId)).limit(1);
  if (!driver || driver.status !== "online" || !driver.storeId) {
    return [];
  }

  // Get all created status orders at this store
  const activeCreatedOrders = await db
    .select()
    .from(orders)
    .where(and(eq(orders.storeId, driver.storeId), eq(orders.status, "created")))
    .orderBy(desc(orders.createdAt));

  const filtered = [];
  for (const order of activeCreatedOrders) {
    // Check Redis ignore list
    const isIgnored = await redis.sismember(`order:ignored:${order.id}`, driverId);
    if (!isIgnored) {
      const [store] = await db.select({ name: stores.name, address: stores.address }).from(stores).where(eq(stores.id, order.storeId)).limit(1);
      filtered.push({
        ...order,
        storeName: store?.name || "Unknown Hub",
        storeAddress: store?.address || "",
      });
    }
  }

  return filtered;
}

export async function ignoreOrder(orderId: string, driverId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) throw new Error("ORDER_NOT_FOUND");

  // Add driver to Redis ignored set with a 15-minute TTL (900 seconds)
  const key = `order:ignored:${orderId}`;
  await redis.sadd(key, driverId);
  await redis.expire(key, 900);

  return true;
}

export async function acceptOrder(orderId: string, driverId: string) {
  return await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (order.status !== "created") {
      throw new Error("ORDER_ALREADY_ACCEPTED");
    }

    const [driver] = await tx.select().from(deliveryPartners).where(eq(deliveryPartners.id, driverId)).limit(1);
    if (!driver) throw new Error("DRIVER_NOT_FOUND");

    await tx
      .update(orders)
      .set({
        status: "accepted",
        assignedDriverId: driverId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await tx
      .update(deliveryPartners)
      .set({
        status: "busy",
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartners.id, driverId));

    await tx
      .insert(orderEvents)
      .values({
        orderId,
        eventType: "driver_accepted",
        actorUserId: driver.userId,
      });

    // Update Redis driver details status
    await redis.hset(redisKeys.driverDetails(driverId), {
      status: "busy",
      activeOrder: orderId,
    });

    // Clear ignored set
    await redis.del(`order:ignored:${orderId}`);

    return order;
  });
}

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function logOrderEvent(
  orderId: string,
  driverId: string,
  eventType: string,
  newStatus?: any,
  latitude?: number,
  longitude?: number
) {
  return await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (order.assignedDriverId !== driverId) {
      throw new Error("UNAUTHORIZED_DRIVER: Order is not assigned to this driver");
    }

    const [driver] = await tx.select().from(deliveryPartners).where(eq(deliveryPartners.id, driverId)).limit(1);
    if (!driver) throw new Error("DRIVER_NOT_FOUND");

    // Geofencing Check
    if (eventType === "reached_store") {
      if (latitude === undefined || longitude === undefined) {
        throw new Error("COORDINATES_REQUIRED");
      }
      const [store] = await tx.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
      if (!store) throw new Error("STORE_NOT_FOUND");

      const distance = getDistanceInMeters(latitude, longitude, store.latitude, store.longitude);
      if (distance > 100) {
        throw new Error("DRIVER_NOT_NEARBY");
      }
    } else if (eventType === "reached_location") {
      if (latitude === undefined || longitude === undefined) {
        throw new Error("COORDINATES_REQUIRED");
      }
      const distance = getDistanceInMeters(latitude, longitude, order.deliveryLatitude, order.deliveryLongitude);
      if (distance > 100) {
        throw new Error("DRIVER_NOT_NEARBY");
      }
    }

    // Optionally update order status
    if (newStatus) {
      await tx
        .update(orders)
        .set({
          status: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId));
    }

    await tx
      .insert(orderEvents)
      .values({
        orderId,
        eventType,
        actorUserId: driver.userId,
      });

    return { ...order, status: newStatus || order.status };
  });
}


export async function completeOrder(orderId: string, driverId: string, pin: string, deliveryProofImageKey?: string) {
  return await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    if (order.assignedDriverId !== driverId) {
      throw new Error("UNAUTHORIZED_DRIVER");
    }

    if (order.proofPin !== pin) {
      throw new Error("INVALID_PIN");
    }

    const [driver] = await tx.select().from(deliveryPartners).where(eq(deliveryPartners.id, driverId)).limit(1);
    if (!driver) throw new Error("DRIVER_NOT_FOUND");

    // Complete order
    await tx
      .update(orders)
      .set({
        status: "delivered",
        deliveredAt: new Date(),
        updatedAt: new Date(),
        deliveryProofImageKey: deliveryProofImageKey || null,
      })
      .where(eq(orders.id, orderId));

    // Release driver back online
    await tx
      .update(deliveryPartners)
      .set({
        status: "online",
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartners.id, driverId));

    await tx
      .insert(orderEvents)
      .values({
        orderId,
        eventType: "delivered",
        actorUserId: driver.userId,
      });

    // Update Redis status
    await redis.hset(redisKeys.driverDetails(driverId), {
      status: "online",
      activeOrder: "None",
    });

    // Clean up Redis ignores
    await redis.del(`order:ignored:${orderId}`);

    return { ...order, status: "delivered" };
  });
}

export async function cancelOrder(orderId: string, actorUserId: string) {
  return await db.transaction(async (tx) => {
    const [order] = await tx.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) throw new Error("ORDER_NOT_FOUND");

    // Cancel order
    await tx
      .update(orders)
      .set({
        status: "failed",
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await tx
      .insert(orderEvents)
      .values({
        orderId,
        eventType: "cancelled",
        actorUserId,
      });

    // Release assigned driver if any
    if (order.assignedDriverId) {
      await tx
        .update(deliveryPartners)
        .set({
          status: "online",
          updatedAt: new Date(),
        })
        .where(eq(deliveryPartners.id, order.assignedDriverId));

      await redis.hset(redisKeys.driverDetails(order.assignedDriverId), {
        status: "online",
        activeOrder: "None",
      });
    }

    // Clean up Redis ignores
    await redis.del(`order:ignored:${orderId}`);

    return { ...order, status: "failed" };
  });
}

export async function getTrackDetails(trackingToken: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.trackingToken, trackingToken))
    .limit(1);

  if (!order) return null;

  const [store] = await db.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(desc(orderEvents.createdAt));

  // Get driver details and telemetry if active
  let driverInfo = null;
  if (order.assignedDriverId) {
    const [driverUser] = await db
      .select({ name: users.name, phone: users.phone })
      .from(deliveryPartners)
      .innerJoin(users, eq(deliveryPartners.userId, users.id))
      .where(eq(deliveryPartners.id, order.assignedDriverId))
      .limit(1);

    const telemetry = await redis.hgetall(redisKeys.driverDetails(order.assignedDriverId));

    driverInfo = {
      name: driverUser?.name || "Delivery Partner",
      phone: driverUser?.phone || "",
      latitude: telemetry.latitude ? parseFloat(telemetry.latitude) : null,
      longitude: telemetry.longitude ? parseFloat(telemetry.longitude) : null,
      speed: telemetry.speed || null,
      battery: telemetry.battery ? parseInt(telemetry.battery) : null,
      lastPingAt: telemetry.timestamp ? new Date(parseInt(telemetry.timestamp)) : null,
    };
  }

  const deliveryProofImageUrl = order.deliveryProofImageKey ? await getPresignedUrl(order.deliveryProofImageKey) : null;

  return {
    orderId: order.id,
    status: order.status,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    deliveryLatitude: order.deliveryLatitude,
    deliveryLongitude: order.deliveryLongitude,
    paymentType: order.paymentType,
    grandTotal: order.grandTotal,
    deliveryProofImageKey: order.deliveryProofImageKey,
    deliveryProofImageUrl,
    store: store ? {
      name: store.name,
      address: store.address,
      latitude: store.latitude,
      longitude: store.longitude,
    } : null,
    driver: driverInfo,
    items,
    events,
  };
}

export async function getDashboardStats() {
  const [totalActiveQuery] = await db
    .select({ count: count() })
    .from(orders)
    .where(or(
      eq(orders.status, "created"),
      eq(orders.status, "assigned"),
      eq(orders.status, "accepted"),
      eq(orders.status, "picked_up"),
      eq(orders.status, "in_transit")
    ));

  const [onlineDriversQuery] = await db
    .select({ count: count() })
    .from(deliveryPartners)
    .where(eq(deliveryPartners.status, "online"));

  const [busyDriversQuery] = await db
    .select({ count: count() })
    .from(deliveryPartners)
    .where(eq(deliveryPartners.status, "busy"));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [deliveredTodayQuery] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(eq(orders.status, "delivered"), desc(orders.deliveredAt))); // delivered today since midnight

  const [failedTodayQuery] = await db
    .select({ count: count() })
    .from(orders)
    .where(and(eq(orders.status, "failed"), desc(orders.updatedAt))); // failed today

  return {
    activeOrders: totalActiveQuery ? totalActiveQuery.count : 0,
    onlineDrivers: {
      active: (onlineDriversQuery?.count || 0) + (busyDriversQuery?.count || 0),
      busy: busyDriversQuery?.count || 0,
      idle: onlineDriversQuery?.count || 0,
    },
    deliveredToday: deliveredTodayQuery ? deliveredTodayQuery.count : 0,
    failedToday: failedTodayQuery ? failedTodayQuery.count : 0,
  };
}

export async function getActiveOrderForDriver(driverId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.assignedDriverId, driverId),
        or(
          eq(orders.status, "assigned"),
          eq(orders.status, "accepted"),
          eq(orders.status, "picked_up"),
          eq(orders.status, "in_transit")
        )
      )
    )
    .limit(1);

  if (!order) return null;

  const [store] = await db.select().from(stores).where(eq(stores.id, order.storeId)).limit(1);
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  const events = await db.select().from(orderEvents).where(eq(orderEvents.orderId, order.id)).orderBy(desc(orderEvents.createdAt));

  return { 
    ...order, 
    storeName: store?.name || "Unknown Store",
    storeAddress: store?.address || "",
    items, 
    events 
  };
}
