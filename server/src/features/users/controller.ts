import type { Context } from "hono";
import * as userService from "./service.ts";
import {
  createUserSchema,
  updateUserSchema,
} from "./types.ts";

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

export async function getUsers(c: Context) {
  try {
    const pageQuery = c.req.query("page");
    const page = pageQuery ? parseInt(pageQuery) : 1;

    const limitQuery = c.req.query("limit");
    const limit = limitQuery ? parseInt(limitQuery) : 10;

    const search = c.req.query("search");
    const role = c.req.query("role");
    const type = c.req.query("type") as "staff" | "customer" | "driver" | undefined;
    
    const isActiveQuery = c.req.query("isActive");
    const isActive = isActiveQuery !== undefined ? isActiveQuery === "true" : undefined;

    const sortBy = c.req.query("sortBy");
    const sortOrder = c.req.query("sortOrder") as "asc" | "desc" | undefined;

    const { list, totalItems } = await userService.getUsers({
      role,
      type,
      isActive,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return c.json({
      success: true,
      message: "Users fetched successfully",
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
    console.error("[getUsers] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch users",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function getUserById(c: Context) {
  try {
    const id = c.req.param("id") as string;
    const user = await userService.getUserById(id);
    if (!user) {
      return c.json({
        success: false,
        message: "User not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "User fetched successfully",
      data: user,
    }, 200);
  } catch (err) {
    console.error("[getUserById] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch user",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function createUser(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const user = await userService.createUser(parsed.data);
    return c.json({
      success: true,
      message: "User created successfully",
      data: user,
    }, 201);
  } catch (err) {
    console.error("[createUser] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to create user",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function updateUser(c: Context) {
  try {
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const user = await userService.updateUser(id, parsed.data);
    if (!user) {
      return c.json({
        success: false,
        message: "User not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "User updated successfully",
      data: user,
    }, 200);
  } catch (err) {
    console.error("[updateUser] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to update user",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function deleteUser(c: Context) {
  try {
    const id = c.req.param("id") as string;
    await userService.deleteUser(id);
    return c.json({
      success: true,
      message: "User deleted successfully",
      data: null,
    }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "USER_HAS_ORDERS") {
      return c.json({
        success: false,
        message: "Cannot delete user as they are linked to order history. Consider deactivating their account instead.",
        error: { code: "CONFLICT" },
      }, 409);
    }
    if (msg === "USER_HAS_DRIVER_PROFILE") {
      return c.json({
        success: false,
        message: "Cannot delete user as they have an active driver profile. Consider deactivating their profile or deleting the driver record first.",
        error: { code: "CONFLICT" },
      }, 409);
    }
    console.error("[deleteUser] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to delete user",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}
