import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import * as authService from "./service.ts";
import { adminLoginSchema, adminSignupSchema, otpRequestSchema, otpVerifySchema, updateProfileSchema } from "./types.ts";

const COOKIE_NAME = "logiroute_session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "Lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function adminLogin(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const result = await authService.adminLogin(parsed.data, {
      userAgent: c.req.header("user-agent"),
      ipAddress: c.req.header("x-forwarded-for") ?? undefined,
    });

    setCookie(c, COOKIE_NAME, result.sessionId, {
      ...COOKIE_OPTIONS,
      maxAge: parsed.data.rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
    });

    return c.json({ user: result.user }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    if (msg === "INVALID_CREDENTIALS") return c.json({ error: "Invalid email/phone or password" }, 401);
    if (msg === "UNAUTHORIZED_ROLE") return c.json({ error: "This account does not have access to the admin panel" }, 403);
    if (msg === "ACCOUNT_INACTIVE") return c.json({ error: "This account has been deactivated" }, 403);
    console.error("[adminLogin] error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
}

export async function adminSignup(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = adminSignupSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const result = await authService.adminSignup(parsed.data, {
      userAgent: c.req.header("user-agent"),
      ipAddress: c.req.header("x-forwarded-for") ?? undefined,
    });

    setCookie(c, COOKIE_NAME, result.sessionId, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ user: result.user }, 201);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    if (msg === "DUPLICATE_EMAIL") return c.json({ error: "An account with this email already exists" }, 409);
    if (msg === "DUPLICATE_PHONE") return c.json({ error: "An account with this phone already exists" }, 409);
    console.error("[adminSignup] error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
}

export async function otpRequest(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = otpRequestSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }
    await authService.requestOtp(parsed.data.phone);
    return c.json({ message: "OTP sent successfully" }, 200);
  } catch (err) {
    console.error("[otpRequest] error:", err);
    return c.json({ error: "Failed to send OTP" }, 500);
  }
}

export async function otpVerify(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const result = await authService.verifyOtp(parsed.data.phone, parsed.data.otp, {
      userAgent: c.req.header("user-agent"),
      ipAddress: c.req.header("x-forwarded-for") ?? undefined,
      role: parsed.data.role,
    });

    setCookie(c, COOKIE_NAME, result.sessionId, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 7,
    });

    return c.json({ user: result.user }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    if (msg === "OTP_EXPIRED") return c.json({ error: "Code has expired. Request a new one." }, 401);
    if (msg === "OTP_INVALID") return c.json({ error: "The code you entered is incorrect." }, 401);
    if (msg === "USER_NOT_FOUND") return c.json({ error: "No delivery partner account found with this phone number." }, 404);
    if (msg === "ACCOUNT_INACTIVE") return c.json({ error: "This account has been deactivated." }, 403);
    console.error("[otpVerify] error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
}

export async function getMe(c: Context) {
  try {
    const sessionId = getCookie(c, COOKIE_NAME);
    if (!sessionId) return c.json({ error: "Not authenticated" }, 401);

    const user = await authService.getMe(sessionId);
    if (!user) {
      deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
      return c.json({ error: "Session expired or invalid" }, 401);
    }

    return c.json({ user }, 200);
  } catch (err) {
    console.error("[getMe] error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
}

export async function logout(c: Context) {
  try {
    const sessionId = getCookie(c, COOKIE_NAME);
    if (sessionId) {
      await authService.logout(sessionId);
    }
    deleteCookie(c, COOKIE_NAME, COOKIE_OPTIONS);
    return c.json({ message: "Logged out successfully" }, 200);
  } catch (err) {
    console.error("[logout] error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
}

export async function updateProfile(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "UNAUTHORIZED" }, 401);
    }

    const body = await c.req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "VALIDATION_ERROR", details: parsed.error.flatten() }, 400);
    }

    const updatedUser = await authService.updateProfile(user.id, parsed.data);
    return c.json({ user: updatedUser }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    if (msg === "DUPLICATE_EMAIL") return c.json({ error: "An account with this email already exists" }, 409);
    if (msg === "DUPLICATE_PHONE") return c.json({ error: "An account with this phone number already exists" }, 409);
    if (msg === "USER_NOT_FOUND") return c.json({ error: "User not found" }, 404);
    console.error("[updateProfile] error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
}
