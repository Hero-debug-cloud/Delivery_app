import type { Context } from "hono";
import * as addressService from "./service.ts";
import { createAddressSchema, updateAddressSchema } from "./types.ts";

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

export async function getAddresses(c: Context) {
  try {
    const user = c.get("user");
    const list = await addressService.getCustomerAddresses(user.id);
    return c.json({
      success: true,
      message: "Customer addresses retrieved successfully",
      data: list,
    }, 200);
  } catch (err) {
    console.error("[getAddresses] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch addresses",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function createAddress(c: Context) {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    const parsed = createAddressSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const address = await addressService.createAddress(user.id, parsed.data);
    return c.json({
      success: true,
      message: "Address created successfully",
      data: address,
    }, 201);
  } catch (err) {
    console.error("[createAddress] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to create address",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function updateAddress(c: Context) {
  try {
    const user = c.get("user");
    const addressId = c.req.param("id") as string;
    const body = await c.req.json();
    const parsed = updateAddressSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }
    const address = await addressService.updateAddress(user.id, addressId, parsed.data);
    if (!address) {
      return c.json({
        success: false,
        message: "Address not found or unauthorized",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "Address updated successfully",
      data: address,
    }, 200);
  } catch (err) {
    console.error("[updateAddress] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to update address",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

export async function deleteAddress(c: Context) {
  try {
    const user = c.get("user");
    const addressId = c.req.param("id") as string;
    const deleted = await addressService.deleteAddress(user.id, addressId);
    if (!deleted) {
      return c.json({
        success: false,
        message: "Address not found or unauthorized",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: true,
      message: "Address deleted successfully",
      data: null,
    }, 200);
  } catch (err) {
    console.error("[deleteAddress] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to delete address",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}
