import type { Context } from "hono";
import * as storeService from "./service.ts";
import {
  createStoreSchema,
  updateStoreSchema,
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

export async function getStores(c: Context) {
  try {
    const pageQuery = c.req.query("page");
    const page = pageQuery ? parseInt(pageQuery) : 1;

    const limitQuery = c.req.query("limit");
    const limit = limitQuery ? parseInt(limitQuery) : 10;

    const search = c.req.query("search");
    const isActiveQuery = c.req.query("isActive");
    const isActive = isActiveQuery !== undefined ? isActiveQuery === "true" : undefined;

    const sortBy = c.req.query("sortBy");
    const sortOrder = c.req.query("sortOrder") as "asc" | "desc" | undefined;

    const { list, totalItems } = await storeService.getStores({
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
      message: "Stores fetched successfully",
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
    console.error("[getStores] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch stores",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function getStoreById(c: Context) {
  try {
    const id = c.req.param("id") as string;
    const store = await storeService.getStoreById(id);
    if (!store) {
      return c.json({
        success: false,
        message: "Store not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "Store fetched successfully",
      data: store,
    }, 200);
  } catch (err) {
    console.error("[getStoreById] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch store",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function createStore(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = createStoreSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const store = await storeService.createStore(parsed.data);
    return c.json({
      success: true,
      message: "Store created successfully",
      data: store,
    }, 201);
  } catch (err) {
    console.error("[createStore] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to create store",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function updateStore(c: Context) {
  try {
    const id = c.req.param("id") as string;
    const body = await c.req.json();
    const parsed = updateStoreSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const store = await storeService.updateStore(id, parsed.data);
    if (!store) {
      return c.json({
        success: false,
        message: "Store not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "Store updated successfully",
      data: store,
    }, 200);
  } catch (err) {
    console.error("[updateStore] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to update store",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function deleteStore(c: Context) {
  try {
    const id = c.req.param("id") as string;
    await storeService.deleteStore(id);
    return c.json({
      success: true,
      message: "Store deleted successfully",
      data: null,
    }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "STORE_HAS_ORDERS") {
      return c.json({
        success: false,
        message: "Cannot delete store as it is linked to order records.",
        error: { code: "CONFLICT" },
      }, 409);
    }
    if (msg === "STORE_HAS_DRIVERS") {
      return c.json({
        success: false,
        message: "Cannot delete store as it has delivery partners assigned to it.",
        error: { code: "CONFLICT" },
      }, 409);
    }
    console.error("[deleteStore] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to delete store",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function checkServiceability(c: Context) {
  try {
    const { latitude, longitude } = await c.req.json();

    if (latitude === undefined || longitude === undefined) {
      return c.json({ success: false, message: "latitude and longitude are required" }, 400);
    }

    const result = await storeService.checkServiceability(latitude, longitude);
    return c.json({
      success: true,
      ...result,
    }, 200);
  } catch (err) {
    console.error("[checkServiceability] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to check serviceability",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

