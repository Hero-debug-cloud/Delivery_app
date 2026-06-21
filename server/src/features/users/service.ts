import { db } from "../../db/index.ts";
import { users, orders, deliveryPartners } from "../../db/schema.ts";
import { eq, and, or, ilike, sql } from "drizzle-orm";
import type {
  CreateUserInput,
  UpdateUserInput,
  GetUsersFilters,
} from "./types.ts";

export async function getUsers(filters?: GetUsersFilters) {
  const conditions = [];

  if (filters?.isActive !== undefined) {
    conditions.push(eq(users.isActive, filters.isActive));
  }

  if (filters?.role) {
    conditions.push(eq(users.role, filters.role as any));
  } else if (filters?.type === "staff") {
    conditions.push(
      or(
        eq(users.role, "super_admin"),
        eq(users.role, "store_manager"),
        eq(users.role, "dispatcher")
      )
    );
  } else if (filters?.type === "customer") {
    conditions.push(eq(users.role, "customer"));
  } else if (filters?.type === "driver") {
    conditions.push(eq(users.role, "delivery_partner"));
  }

  if (filters?.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(users.name, searchPattern),
        ilike(users.email, searchPattern),
        ilike(users.phone, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count total matching users
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(whereClause);

  const totalItems = countResult[0]?.count ?? 0;

  // Build query
  const query = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(whereClause);

  // Sorting
  let order;
  if (filters?.sortBy === "createdAt") {
    order = filters.sortOrder === "desc" ? sql`${users.createdAt} DESC` : sql`${users.createdAt} ASC`;
  } else if (filters?.sortBy === "role") {
    order = filters.sortOrder === "desc" ? sql`${users.role} DESC` : sql`${users.role} ASC`;
  } else if (filters?.sortBy === "isActive") {
    order = filters.sortOrder === "desc" ? sql`${users.isActive} DESC` : sql`${users.isActive} ASC`;
  } else {
    // Default sort by name ascending
    order = filters?.sortOrder === "desc" ? sql`${users.name} DESC` : sql`${users.name} ASC`;
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

export async function getUserById(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}

export async function createUser(input: CreateUserInput) {
  const passwordHash = input.password
    ? await Bun.password.hash(input.password, { algorithm: "bcrypt", cost: 10 })
    : null;

  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      passwordHash,
      role: input.role,
      isActive: input.isActive ?? true,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const updatePayload: any = {
    ...input,
    updatedAt: new Date(),
  };

  if (input.password) {
    updatePayload.passwordHash = await Bun.password.hash(input.password, { algorithm: "bcrypt", cost: 10 });
  }
  delete updatePayload.password;

  const [user] = await db
    .update(users)
    .set(updatePayload)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });

  return user || null;
}

export async function deleteUser(id: string) {
  // Check if user is linked to any order records
  const [linkedOrder] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.customerId, id))
    .limit(1);

  if (linkedOrder) {
    throw new Error("USER_HAS_ORDERS");
  }

  // Check if they are a driver/partner profile
  const [linkedPartner] = await db
    .select({ id: deliveryPartners.id })
    .from(deliveryPartners)
    .where(eq(deliveryPartners.userId, id))
    .limit(1);

  if (linkedPartner) {
    throw new Error("USER_HAS_DRIVER_PROFILE");
  }

  await db.delete(users).where(eq(users.id, id));
}
