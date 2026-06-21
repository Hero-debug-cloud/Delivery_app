import { eq, and, or, like, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { users, deliveryPartners } from "../../db/schema.ts";
import { getPresignedUrl } from "../upload/s3.ts";
import type { OnboardDriverInput, GetDriversFilters, CreateDriverInput } from "./types.ts";

export async function onboardDriver(userId: string, input: OnboardDriverInput): Promise<void> {
  // Check if driver profile exists
  const [driver] = await db
    .select()
    .from(deliveryPartners)
    .where(eq(deliveryPartners.userId, userId))
    .limit(1);

  if (!driver) {
    throw new Error("DRIVER_NOT_FOUND");
  }

  // Update user name and driver details in a transaction
  await db.transaction(async (tx) => {
    // 1. Update name on user table
    await tx
      .update(users)
      .set({ name: input.name, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // 2. Update delivery partner details
    await tx
      .update(deliveryPartners)
      .set({
        vehicleType: input.vehicleType,
        vehicleNumber: input.vehicleNumber,
        licenseNumber: input.licenseNumber,
        licenseExpiry: input.licenseExpiry,
        licenseFrontUrl: input.licenseFrontUrl,
        licenseBackUrl: input.licenseBackUrl,
        vehiclePlateImage: input.vehiclePlateImage,
        identityProofType: input.identityProofType,
        identityProofNumber: input.identityProofNumber,
        identityProofImage: input.identityProofImage,
        profilePictureUrl: input.profilePictureUrl,
        onboardingStatus: "submitted",
        rejectionReason: null, // Clear past rejection reason on resubmit
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartners.userId, userId));
  });
}

export async function getDrivers(filters: GetDriversFilters) {
  const page = filters.page ? Math.max(1, filters.page) : 1;
  const limit = filters.limit ? Math.max(1, filters.limit) : 10;
  const offset = (page - 1) * limit;

  // Build where clause
  const conditions = [];

  if (filters.onboardingStatus) {
    conditions.push(eq(deliveryPartners.onboardingStatus, filters.onboardingStatus as any));
  }

  if (filters.search) {
    const searchPattern = `%${filters.search}%`;
    conditions.push(
      or(
        like(users.name, searchPattern),
        like(users.phone, searchPattern),
        like(users.email, searchPattern),
        like(deliveryPartners.licenseNumber, searchPattern),
        like(deliveryPartners.vehicleNumber, searchPattern)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Total count query
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(deliveryPartners)
    .innerJoin(users, eq(deliveryPartners.userId, users.id))
    .where(whereClause);

  const totalItems = countResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalItems / limit);

  // Paginated list query
  const rawList = await db
    .select({
      id: deliveryPartners.id,
      userId: deliveryPartners.userId,
      storeId: deliveryPartners.storeId,
      vehicleType: deliveryPartners.vehicleType,
      vehicleNumber: deliveryPartners.vehicleNumber,
      status: deliveryPartners.status,
      onboardingStatus: deliveryPartners.onboardingStatus,
      rejectionReason: deliveryPartners.rejectionReason,
      licenseNumber: deliveryPartners.licenseNumber,
      licenseExpiry: deliveryPartners.licenseExpiry,
      licenseFrontUrl: deliveryPartners.licenseFrontUrl,
      licenseBackUrl: deliveryPartners.licenseBackUrl,
      vehiclePlateImage: deliveryPartners.vehiclePlateImage,
      identityProofType: deliveryPartners.identityProofType,
      identityProofNumber: deliveryPartners.identityProofNumber,
      identityProofImage: deliveryPartners.identityProofImage,
      profilePictureUrl: deliveryPartners.profilePictureUrl,
      isActive: deliveryPartners.isActive,
      createdAt: deliveryPartners.createdAt,
      name: users.name,
      phone: users.phone,
      email: users.email,
    })
    .from(deliveryPartners)
    .innerJoin(users, eq(deliveryPartners.userId, users.id))
    .where(whereClause)
    .orderBy(desc(deliveryPartners.createdAt))
    .limit(limit)
    .offset(offset);

  // Resolve presigned URLs for all media fields
  const list = await Promise.all(
    rawList.map(async (driver) => {
      return {
        ...driver,
        licenseFrontUrl: driver.licenseFrontUrl ? await getPresignedUrl(driver.licenseFrontUrl) : null,
        licenseBackUrl: driver.licenseBackUrl ? await getPresignedUrl(driver.licenseBackUrl) : null,
        vehiclePlateImage: driver.vehiclePlateImage ? await getPresignedUrl(driver.vehiclePlateImage) : null,
        identityProofImage: driver.identityProofImage ? await getPresignedUrl(driver.identityProofImage) : null,
        profilePictureUrl: driver.profilePictureUrl ? await getPresignedUrl(driver.profilePictureUrl) : null,
      };
    })
  );

  return {
    list,
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

export async function approveDriver(driverId: string): Promise<void> {
  const [driver] = await db
    .select()
    .from(deliveryPartners)
    .where(eq(deliveryPartners.id, driverId))
    .limit(1);

  if (!driver) {
    throw new Error("DRIVER_NOT_FOUND");
  }

  await db
    .update(deliveryPartners)
      .set({
        onboardingStatus: "approved",
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(deliveryPartners.id, driverId));
}

export async function rejectDriver(driverId: string, reason: string): Promise<void> {
  const [driver] = await db
    .select()
    .from(deliveryPartners)
    .where(eq(deliveryPartners.id, driverId))
    .limit(1);

  if (!driver) {
    throw new Error("DRIVER_NOT_FOUND");
  }

  await db
    .update(deliveryPartners)
    .set({
      onboardingStatus: "rejected",
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(deliveryPartners.id, driverId));
}

export async function createDriver(input: CreateDriverInput): Promise<string> {
  // Check phone duplicate
  const [existingPhone] = await db
    .select()
    .from(users)
    .where(eq(users.phone, input.phone))
    .limit(1);
    
  if (existingPhone) {
    throw new Error("PHONE_EXISTS");
  }

  // Check email duplicate
  if (input.email) {
    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
      
    if (existingEmail) {
      throw new Error("EMAIL_EXISTS");
    }
  }

  // Insert user and driver in a transaction
  const result = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        role: "delivery_partner",
        isActive: true,
      })
      .returning();

    const [newDriver] = await tx
      .insert(deliveryPartners)
      .values({
        userId: newUser.id,
        storeId: input.storeId ?? null,
        vehicleType: input.vehicleType ?? "motorcycle",
        vehicleNumber: input.vehicleNumber ?? null,
        status: "offline",
        onboardingStatus: "pending",
      })
      .returning();

    return newDriver;
  });

  return result.id;
}
