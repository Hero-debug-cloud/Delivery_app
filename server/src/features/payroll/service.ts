import { db } from "../../db/index.ts";
import { 
  payrollConfigurations, 
  payrollLedgers, 
  orders, 
  locationPings, 
  deliveryPartners, 
  users, 
  stores 
} from "../../db/schema.ts";
import { eq, and, gte, lte, sql, desc, isNotNull, ilike, or } from "drizzle-orm";
import type { 
  UpsertPayrollConfigInput, 
  GeneratePayrollInput, 
  UpdatePayrollLedgerInput, 
  GetLedgersFilters,
  GetConfigurationsFilters
} from "./types.ts";

// Helper function to calculate Haversine distance in meters
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// 1. Get all payroll configurations (Paginated for store overrides)
export async function getPayrollConfigurations(filters: GetConfigurationsFilters = {}) {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  // We filter configurations to store overrides only (storeId is not null)
  let whereClause = isNotNull(payrollConfigurations.storeId);

  if (filters.search) {
    whereClause = and(
      whereClause,
      ilike(stores.name, `%${filters.search}%`)
    ) as any;
  }

  // Count query
  const countRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payrollConfigurations)
    .leftJoin(stores, eq(payrollConfigurations.storeId, stores.id))
    .where(whereClause);
  const totalItems = countRes[0]?.count ?? 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Data query
  const data = await db
    .select({
      id: payrollConfigurations.id,
      storeId: payrollConfigurations.storeId,
      storeName: stores.name,
      perOrderRate: payrollConfigurations.perOrderRate,
      perKmRate: payrollConfigurations.perKmRate,
      nightSurgeRate: payrollConfigurations.nightSurgeRate,
      weatherSurgeRate: payrollConfigurations.weatherSurgeRate,
      latePenalty: payrollConfigurations.latePenalty,
      createdAt: payrollConfigurations.createdAt,
      updatedAt: payrollConfigurations.updatedAt,
    })
    .from(payrollConfigurations)
    .leftJoin(stores, eq(payrollConfigurations.storeId, stores.id))
    .where(whereClause)
    .orderBy(desc(payrollConfigurations.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  };
}

// 2. Get configuration by storeId (falls back to global)
export async function getPayrollConfigurationByStoreId(storeId: string | null) {
  if (storeId) {
    const [config] = await db
      .select()
      .from(payrollConfigurations)
      .where(eq(payrollConfigurations.storeId, storeId))
      .limit(1);
    if (config) return config;
  }

  // Fallback to Global Default (storeId IS NULL)
  const [globalConfig] = await db
    .select()
    .from(payrollConfigurations)
    .where(sql`${payrollConfigurations.storeId} IS NULL`)
    .limit(1);

  if (globalConfig) return globalConfig;

  // Final hardcoded safety fallback
  return {
    id: "default-fallback",
    storeId: null,
    perOrderRate: 2000, // ₹20.00
    perKmRate: 500, // ₹5.00
    nightSurgeRate: 1000, // ₹10.00
    weatherSurgeRate: 1500, // ₹15.00
    latePenalty: 500, // ₹5.00
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// 3. Create or update configuration
export async function upsertPayrollConfiguration(input: UpsertPayrollConfigInput) {
  const storeIdValue = input.storeId || null;

  // Check if config already exists for this storeId (either UUID or null)
  let existing;
  if (storeIdValue) {
    [existing] = await db
      .select()
      .from(payrollConfigurations)
      .where(eq(payrollConfigurations.storeId, storeIdValue))
      .limit(1);
  } else {
    [existing] = await db
      .select()
      .from(payrollConfigurations)
      .where(sql`${payrollConfigurations.storeId} IS NULL`)
      .limit(1);
  }

  if (existing) {
    const [updated] = await db
      .update(payrollConfigurations)
      .set({
        perOrderRate: input.perOrderRate,
        perKmRate: input.perKmRate,
        nightSurgeRate: input.nightSurgeRate,
        weatherSurgeRate: input.weatherSurgeRate,
        latePenalty: input.latePenalty,
        updatedAt: new Date(),
      })
      .where(eq(payrollConfigurations.id, existing.id))
      .returning();
    return updated;
  } else {
    const [inserted] = await db
      .insert(payrollConfigurations)
      .values({
        storeId: storeIdValue,
        perOrderRate: input.perOrderRate,
        perKmRate: input.perKmRate,
        nightSurgeRate: input.nightSurgeRate,
        weatherSurgeRate: input.weatherSurgeRate,
        latePenalty: input.latePenalty,
      })
      .returning();
    return inserted;
  }
}

// 4. Generate Payroll ledgers per store and period
export async function generatePayroll(input: GeneratePayrollInput) {
  const { storeId, startDate, endDate } = input;

  // A. Fetch store layout to get store latitude/longitude coordinates
  const [store] = await db
    .select({
      id: stores.id,
      name: stores.name,
      latitude: stores.latitude,
      longitude: stores.longitude,
    })
    .from(stores)
    .where(eq(stores.id, storeId))
    .limit(1);

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  // B. Get payout configuration for the store (falls back to global)
  const config = await getPayrollConfigurationByStoreId(storeId);

  // C. Fetch completed orders for the store within the date range
  // We use timezone-safe database to_char comparison to avoid UTC boundary drops
  const activeOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.storeId, storeId),
        eq(orders.status, "delivered"),
        sql`to_char(${orders.deliveredAt}, 'YYYY-MM-DD') >= ${startDate}`,
        sql`to_char(${orders.deliveredAt}, 'YYYY-MM-DD') <= ${endDate}`
      )
    );

  if (activeOrders.length === 0) {
    return { generatedCount: 0, ledgers: [] };
  }

  // Group orders by assigned driver ID
  const driverOrdersMap: Record<string, typeof activeOrders> = {};
  for (const order of activeOrders) {
    if (order.assignedDriverId) {
      if (!driverOrdersMap[order.assignedDriverId]) {
        driverOrdersMap[order.assignedDriverId] = [];
      }
      driverOrdersMap[order.assignedDriverId].push(order);
    }
  }

  const generatedLedgers: (typeof payrollLedgers.$inferSelect)[] = [];

  // D. Process each driver's payroll details in a database transaction
  await db.transaction(async (tx) => {
    // Make generation idempotent: Delete existing ledgers for this store and date range first
    await tx
      .delete(payrollLedgers)
      .where(
        and(
          eq(payrollLedgers.storeId, storeId),
          eq(payrollLedgers.startDate, startDate),
          eq(payrollLedgers.endDate, endDate)
        )
      );

    for (const [driverId, driverOrders] of Object.entries(driverOrdersMap)) {
      let totalDistanceMeters = 0;
      let baseOrderEarnings = 0;
      let distanceEarnings = 0;
      let bonusEarnings = 0;
      let penaltyDeductions = 0;

      for (const order of driverOrders) {
        // 1. Calculate Base Order Earnings
        baseOrderEarnings += config.perOrderRate;

        // 2. Calculate Distance Covered
        // Fetch location pings for the order to measure actual distance traveled
        const pings = await tx
          .select({
            latitude: locationPings.latitude,
            longitude: locationPings.longitude,
          })
          .from(locationPings)
          .where(eq(locationPings.orderId, order.id))
          .orderBy(locationPings.recordedAt);

        let orderDistance = 0;
        if (pings.length >= 2) {
          // Sum Haversine distances between pings
          for (let i = 0; i < pings.length - 1; i++) {
            orderDistance += calculateHaversineDistance(
              pings[i].latitude,
              pings[i].longitude,
              pings[i + 1].latitude,
              pings[i + 1].longitude
            );
          }
        } else {
          // Fallback: Haversine distance between store coordinates and customer delivery coordinates
          orderDistance = calculateHaversineDistance(
            store.latitude,
            store.longitude,
            order.deliveryLatitude,
            order.deliveryLongitude
          );
        }

        totalDistanceMeters += orderDistance;
        // Distance earnings: perKmRate applied to km covered
        const orderDistanceKm = orderDistance / 1000;
        distanceEarnings += Math.round(orderDistanceKm * config.perKmRate);

        // 3. Bonuses: Night Surge (10 PM to 6 AM)
        const deliveryHour = order.deliveredAt ? new Date(order.deliveredAt).getHours() : 12;
        if (deliveryHour >= 22 || deliveryHour < 6) {
          bonusEarnings += config.nightSurgeRate;
        }

        // 4. Penalties: SLA breach (delivery took >30 mins from order creation)
        if (order.deliveredAt && order.createdAt) {
          const durationMinutes = (new Date(order.deliveredAt).getTime() - new Date(order.createdAt).getTime()) / (1000 * 60);
          if (durationMinutes > 30) {
            penaltyDeductions += config.latePenalty;
          }
        }
      }

      // Net Payout Calculation
      const netPayout = Math.max(0, baseOrderEarnings + distanceEarnings + bonusEarnings - penaltyDeductions);

      // Insert ledger record
      const [ledger] = await tx
        .insert(payrollLedgers)
        .values({
          driverId,
          storeId,
          startDate,
          endDate,
          totalDeliveries: driverOrders.length,
          totalDistanceMeters: Math.round(totalDistanceMeters),
          baseOrderEarnings,
          distanceEarnings,
          bonusEarnings,
          penaltyDeductions,
          netPayout,
          status: "draft",
        })
        .returning();

      generatedLedgers.push(ledger);
    }
  });

  return {
    generatedCount: generatedLedgers.length,
    ledgers: generatedLedgers,
  };
}

// 5. Get payroll ledgers list with pagination and filters
export async function getPayrollLedgers(filters: GetLedgersFilters) {
  const conditions = [];

  if (filters.storeId) {
    conditions.push(eq(payrollLedgers.storeId, filters.storeId));
  }
  if (filters.driverId) {
    conditions.push(eq(payrollLedgers.driverId, filters.driverId));
  }
  if (filters.status) {
    conditions.push(eq(payrollLedgers.status, filters.status));
  }
  if (filters.startDate) {
    conditions.push(gte(payrollLedgers.startDate, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(payrollLedgers.endDate, filters.endDate));
  }
  if (filters.search) {
    conditions.push(
      or(
        ilike(users.name, `%${filters.search}%`),
        ilike(users.phone, `%${filters.search}%`),
        ilike(payrollLedgers.id, `%${filters.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Pagination defaults
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  // Count total matches
  const countRes = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payrollLedgers)
    .innerJoin(deliveryPartners, eq(payrollLedgers.driverId, deliveryPartners.id))
    .innerJoin(users, eq(deliveryPartners.userId, users.id))
    .innerJoin(stores, eq(payrollLedgers.storeId, stores.id))
    .where(whereClause);
  const totalItems = countRes[0]?.count ?? 0;

  // Fetch paginated results
  const list = await db
    .select({
      id: payrollLedgers.id,
      driverId: payrollLedgers.driverId,
      driverName: users.name,
      driverPhone: users.phone,
      storeId: payrollLedgers.storeId,
      storeName: stores.name,
      startDate: payrollLedgers.startDate,
      endDate: payrollLedgers.endDate,
      totalDeliveries: payrollLedgers.totalDeliveries,
      totalDistanceMeters: payrollLedgers.totalDistanceMeters,
      baseOrderEarnings: payrollLedgers.baseOrderEarnings,
      distanceEarnings: payrollLedgers.distanceEarnings,
      bonusEarnings: payrollLedgers.bonusEarnings,
      penaltyDeductions: payrollLedgers.penaltyDeductions,
      netPayout: payrollLedgers.netPayout,
      status: payrollLedgers.status,
      paymentReference: payrollLedgers.paymentReference,
      createdAt: payrollLedgers.createdAt,
    })
    .from(payrollLedgers)
    .innerJoin(deliveryPartners, eq(payrollLedgers.driverId, deliveryPartners.id))
    .innerJoin(users, eq(deliveryPartners.userId, users.id))
    .innerJoin(stores, eq(payrollLedgers.storeId, stores.id))
    .where(whereClause)
    .orderBy(desc(payrollLedgers.createdAt))
    .limit(limit)
    .offset(offset);

  return { list, totalItems, page, limit };
}

// 6. Update ledger details
export async function updatePayrollLedger(id: string, input: UpdatePayrollLedgerInput) {
  const [updated] = await db
    .update(payrollLedgers)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(payrollLedgers.id, id))
    .returning();

  return updated || null;
}

// 7. Get driver's earnings history
export async function getDriverEarnings(driverId: string) {
  return await db
    .select({
      id: payrollLedgers.id,
      startDate: payrollLedgers.startDate,
      endDate: payrollLedgers.endDate,
      totalDeliveries: payrollLedgers.totalDeliveries,
      totalDistanceMeters: payrollLedgers.totalDistanceMeters,
      netPayout: payrollLedgers.netPayout,
      status: payrollLedgers.status,
      createdAt: payrollLedgers.createdAt,
    })
    .from(payrollLedgers)
    .where(eq(payrollLedgers.driverId, driverId))
    .orderBy(desc(payrollLedgers.startDate));
}

// 8. Delete a configuration override
export async function deletePayrollConfiguration(id: string) {
  const [deleted] = await db
    .delete(payrollConfigurations)
    .where(eq(payrollConfigurations.id, id))
    .returning();
  return deleted || null;
}

