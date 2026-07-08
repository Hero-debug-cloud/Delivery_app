import { db } from "../../db/index.ts";
import { stores, orders, deliveryPartners } from "../../db/schema.ts";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import type {
  CreateStoreInput,
  UpdateStoreInput,
  GetStoresFilters,
} from "./types.ts";

export async function getStores(filters?: GetStoresFilters) {
  const conditions = [];

  if (filters?.isActive !== undefined) {
    conditions.push(eq(stores.isActive, filters.isActive));
  }

  if (filters?.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(stores.name, searchPattern),
        ilike(stores.address, searchPattern),
        ilike(stores.phone, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total matching stores
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stores)
    .where(whereClause);

  const totalItems = countResult[0]?.count ?? 0;

  // Build query
  const query = db
    .select()
    .from(stores)
    .where(whereClause);

  // Sorting
  let order;
  if (filters?.sortBy === "createdAt") {
    order = filters.sortOrder === "desc" ? sql`${stores.createdAt} DESC` : sql`${stores.createdAt} ASC`;
  } else if (filters?.sortBy === "isActive") {
    order = filters.sortOrder === "desc" ? sql`${stores.isActive} DESC` : sql`${stores.isActive} ASC`;
  } else {
    // Default sort by name ascending
    order = filters?.sortOrder === "desc" ? sql`${stores.name} DESC` : sql`${stores.name} ASC`;
  }
  query.orderBy(order);

  // Pagination
  if (filters?.limit) {
    const page = filters.page ?? 1;
    const offset = (page - 1) * filters.limit;
    query.limit(filters.limit).offset(offset);
  }

  const list = await query;

  return { list, totalItems };
}

export async function getStoreById(id: string) {
  const [store] = await db
    .select()
    .from(stores)
    .where(eq(stores.id, id))
    .limit(1);

  return store || null;
}

export async function createStore(input: CreateStoreInput) {
  const [store] = await db
    .insert(stores)
    .values({
      name: input.name,
      address: input.address,
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone,
      isActive: input.isActive ?? true,
      openingTime: input.openingTime,
      closingTime: input.closingTime,
      catchmentPolygon: input.catchmentPolygon || null,
    })
    .returning();

  return store;
}

export async function updateStore(id: string, input: UpdateStoreInput) {
  const [store] = await db
    .update(stores)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(stores.id, id))
    .returning();

  return store || null;
}

export async function deleteStore(id: string) {
  // Check if any active orders exist for this store
  const [linkedOrder] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.storeId, id))
    .limit(1);

  if (linkedOrder) {
    throw new Error("STORE_HAS_ORDERS");
  }

  // Check if any delivery partners are linked
  const [linkedPartner] = await db
    .select({ id: deliveryPartners.id })
    .from(deliveryPartners)
    .where(eq(deliveryPartners.storeId, id))
    .limit(1);

  if (linkedPartner) {
    throw new Error("STORE_HAS_DRIVERS");
  }

  await db.delete(stores).where(eq(stores.id, id));
}

export async function checkServiceability(latitude: number, longitude: number) {
  const result = await db.execute(sql`
    SELECT id, name FROM ${stores}
    WHERE is_active = true 
      AND catchment_polygon IS NOT NULL
      AND ST_Contains(
        catchment_polygon,
        ST_SetSRID(ST_Point(${longitude}, ${latitude}), 4326)
      )
    LIMIT 1;
  `);

  if (result.length > 0) {
    const row = result[0];
    return {
      serviceable: true,
      storeId: row.id as string,
      storeName: row.name as string,
    };
  }

  return {
    serviceable: false,
  };
}

