import type { Context } from "hono";
import * as service from "./service.ts";
import { onboardDriverSchema, rejectDriverSchema, createDriverSchema } from "./types.ts";

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
