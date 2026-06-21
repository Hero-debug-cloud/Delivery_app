import { eq, or, and, ne } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { users, sessions, deliveryPartners } from "../../db/schema.ts";
import { redis } from "../../redis/index.ts";
import { getPresignedUrl } from "../upload/s3.ts";
import type { AdminLoginInput, AdminSignupInput, AuthResult, UpdateProfileInput } from "./types.ts";

const SESSION_DURATION_DEFAULT = 60 * 60 * 24 * 7; // 7 days in seconds
const SESSION_DURATION_REMEMBER = 60 * 60 * 24 * 30; // 30 days
const OTP_TTL = 60 * 5; // 5 minutes

function generateSessionToken(): string {
  return crypto.randomUUID() + "-" + Date.now().toString(36);
}

function otpKey(phone: string) {
  return `otp:${phone}`;
}

export async function adminLogin(
  input: AdminLoginInput,
  meta: { userAgent?: string; ipAddress?: string }
): Promise<AuthResult> {
  const identifier = input.identifier.trim();

  // Find user by email OR phone
  const [user] = await db
    .select()
    .from(users)
    .where(
      or(
        eq(users.email, identifier),
        eq(users.phone, identifier)
      )
    )
    .limit(1);

  if (!user) {
    throw new Error("INVALID_CREDENTIALS");
  }

  if (!user.isActive) {
    throw new Error("ACCOUNT_INACTIVE");
  }

  // Only admin roles allowed on web panel
  if (!(["super_admin", "store_manager", "dispatcher"] as string[]).includes(user.role)) {
    throw new Error("UNAUTHORIZED_ROLE");
  }

  if (!user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const valid = await Bun.password.verify(input.password, user.passwordHash);
  if (!valid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const sessionId = generateSessionToken();
  const durationSec = input.rememberMe ? SESSION_DURATION_REMEMBER : SESSION_DURATION_DEFAULT;
  const expiresAt = new Date(Date.now() + durationSec * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
  });

  return {
    sessionId,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    },
  };
}

export async function adminSignup(
  input: AdminSignupInput,
  meta: { userAgent?: string; ipAddress?: string }
): Promise<AuthResult> {
  // Check duplicate
  if (input.email) {
    const [existing] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
    if (existing) throw new Error("DUPLICATE_EMAIL");
  }
  if (input.phone) {
    const [existing] = await db.select().from(users).where(eq(users.phone, input.phone)).limit(1);
    if (existing) throw new Error("DUPLICATE_PHONE");
  }

  const passwordHash = await Bun.password.hash(input.password, { algorithm: "bcrypt", cost: 10 });

  const [user] = await db
    .insert(users)
    .values({
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      passwordHash,
      role: input.role ?? "dispatcher",
      isActive: true,
    })
    .returning();

  const sessionId = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DEFAULT * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
  });

  return {
    sessionId,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    },
  };
}

export async function requestOtp(phone: string): Promise<void> {
  const otp = "123456"; // Fixed OTP to 1-6 for ease of development
  await redis.set(otpKey(phone), otp, "EX", OTP_TTL);
  console.log(`[DEV OTP] phone: ${phone} code: ${otp}`);
}

export async function verifyOtp(
  phone: string,
  otp: string,
  meta: { userAgent?: string; ipAddress?: string; role?: "delivery_partner" | "customer" }
): Promise<AuthResult> {
  const stored = await redis.get(otpKey(phone));

  if (!stored) throw new Error("OTP_EXPIRED");
  if (stored !== otp) throw new Error("OTP_INVALID");

  // Delete OTP after use
  await redis.del(otpKey(phone));

  // Find delivery partner/customer by phone
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.phone, phone))
    .limit(1);

  if (!user) {
    const targetRole = meta.role ?? "delivery_partner";
    const phoneSuffix = phone.substring(phone.length - 4);
    if (targetRole === "customer") {
      const customerName = `Customer ${phoneSuffix}`;
      user = await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            name: customerName,
            phone,
            role: "customer",
            isActive: true,
          })
          .returning();
        return newUser;
      });
    } else {
      // Auto-register new driver user and partner record
      const driverName = `Driver ${phoneSuffix}`;
      user = await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(users)
          .values({
            name: driverName,
            phone,
            role: "delivery_partner",
            isActive: true,
          })
          .returning();

        await tx
          .insert(deliveryPartners)
          .values({
            userId: newUser.id,
            status: "offline",
            onboardingStatus: "pending",
          });

        return newUser;
      });
    }
  }

  if (!user.isActive) throw new Error("ACCOUNT_INACTIVE");

  const sessionId = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DEFAULT * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
  });

  // Resolve driver profile if user is a delivery partner
  let driverProfile = null;
  if (user.role === "delivery_partner") {
    const [driver] = await db
      .select()
      .from(deliveryPartners)
      .where(eq(deliveryPartners.userId, user.id))
      .limit(1);

    if (driver) {
      driverProfile = {
        ...driver,
        licenseFrontUrl: driver.licenseFrontUrl ? await getPresignedUrl(driver.licenseFrontUrl) : null,
        licenseBackUrl: driver.licenseBackUrl ? await getPresignedUrl(driver.licenseBackUrl) : null,
        vehiclePlateImage: driver.vehiclePlateImage ? await getPresignedUrl(driver.vehiclePlateImage) : null,
        identityProofImage: driver.identityProofImage ? await getPresignedUrl(driver.identityProofImage) : null,
        profilePictureUrl: driver.profilePictureUrl ? await getPresignedUrl(driver.profilePictureUrl) : null,
      };
    }
  }

  return {
    sessionId,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      driverProfile,
    },
  };
}

export async function getMe(sessionId: string): Promise<AuthResult["user"] | null> {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return null;

  // Resolve driver profile if user is a delivery partner
  let driverProfile = null;
  if (user.role === "delivery_partner") {
    const [driver] = await db
      .select()
      .from(deliveryPartners)
      .where(eq(deliveryPartners.userId, user.id))
      .limit(1);

    if (driver) {
      driverProfile = {
        ...driver,
        licenseFrontUrl: driver.licenseFrontUrl ? await getPresignedUrl(driver.licenseFrontUrl) : null,
        licenseBackUrl: driver.licenseBackUrl ? await getPresignedUrl(driver.licenseBackUrl) : null,
        vehiclePlateImage: driver.vehiclePlateImage ? await getPresignedUrl(driver.vehiclePlateImage) : null,
        identityProofImage: driver.identityProofImage ? await getPresignedUrl(driver.identityProofImage) : null,
        profilePictureUrl: driver.profilePictureUrl ? await getPresignedUrl(driver.profilePictureUrl) : null,
      };
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    driverProfile,
  };
}

export async function logout(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<AuthResult["user"]> {
  if (input.email) {
    const emailLower = input.email.trim().toLowerCase();
    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, emailLower), ne(users.id, userId)))
      .limit(1);

    if (existing) {
      throw new Error("DUPLICATE_EMAIL");
    }
  }

  if (input.phone) {
    const phoneTrimmed = input.phone.trim();
    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.phone, phoneTrimmed), ne(users.id, userId)))
      .limit(1);

    if (existing) {
      throw new Error("DUPLICATE_PHONE");
    }
  }

  const updateData: { name?: string; email?: string | null; phone?: string | null; passwordHash?: string } = {};
  if (input.name !== undefined) {
    updateData.name = input.name ? input.name.trim() : "";
  }
  if (input.email !== undefined) {
    updateData.email = input.email ? input.email.trim().toLowerCase() : null;
  }
  if (input.phone !== undefined) {
    updateData.phone = input.phone ? input.phone.trim() : null;
  }
  if (input.password !== undefined && input.password && input.password.trim() !== "") {
    updateData.passwordHash = await Bun.password.hash(input.password, { algorithm: "bcrypt", cost: 10 });
  }

  if (Object.keys(updateData).length === 0) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new Error("USER_NOT_FOUND");
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    };
  }

  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    throw new Error("USER_NOT_FOUND");
  }

  let driverProfile = null;
  if (updatedUser.role === "delivery_partner") {
    const [driver] = await db
      .select()
      .from(deliveryPartners)
      .where(eq(deliveryPartners.userId, updatedUser.id))
      .limit(1);

    if (driver) {
      driverProfile = {
        ...driver,
        licenseFrontUrl: driver.licenseFrontUrl ? await getPresignedUrl(driver.licenseFrontUrl) : null,
        licenseBackUrl: driver.licenseBackUrl ? await getPresignedUrl(driver.licenseBackUrl) : null,
        vehiclePlateImage: driver.vehiclePlateImage ? await getPresignedUrl(driver.vehiclePlateImage) : null,
        identityProofImage: driver.identityProofImage ? await getPresignedUrl(driver.identityProofImage) : null,
        profilePictureUrl: driver.profilePictureUrl ? await getPresignedUrl(driver.profilePictureUrl) : null,
      };
    }
  }

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    role: updatedUser.role,
    isActive: updatedUser.isActive,
    driverProfile,
  };
}
