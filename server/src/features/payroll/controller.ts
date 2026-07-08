import type { Context } from "hono";
import * as service from "./service.ts";
import { 
  upsertPayrollConfigSchema, 
  generatePayrollSchema, 
  updatePayrollLedgerSchema 
} from "./types.ts";
import { db } from "../../db/index.ts";
import { deliveryPartners } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

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

export async function getPayrollConfigurations(c: Context) {
  try {
    const page = parseInt(c.req.query("page") || "1", 10);
    const limit = parseInt(c.req.query("limit") || "10", 10);
    const search = c.req.query("search") || "";

    const result = await service.getPayrollConfigurations({ page, limit, search });
    return c.json({
      success: true,
      message: "Payroll configurations fetched successfully",
      data: result.data,
      pagination: result.pagination,
    }, 200);
  } catch (err) {
    console.error("[getPayrollConfigurations] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch configurations",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

// 2. Get configuration by storeId (falls back to global)
export async function getPayrollConfigurationByStore(c: Context) {
  try {
    const storeId = c.req.param("storeId");
    const config = await service.getPayrollConfigurationByStoreId(!storeId || storeId === "global" ? null : storeId);
    return c.json({
      success: true,
      message: "Payroll configuration fetched successfully",
      data: config,
    }, 200);
  } catch (err) {
    console.error("[getPayrollConfigurationByStore] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch configuration",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

// 3. Create or update configuration
export async function upsertPayrollConfiguration(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = upsertPayrollConfigSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }

    const config = await service.upsertPayrollConfiguration(parsed.data);
    return c.json({
      success: true,
      message: "Payroll configuration updated successfully",
      data: config,
    }, 200);
  } catch (err) {
    console.error("[upsertPayrollConfiguration] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to update configuration",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

// 4. Generate Payroll ledgers per store and period
export async function generatePayroll(c: Context) {
  try {
    const body = await c.req.json();
    const parsed = generatePayrollSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }

    const result = await service.generatePayroll(parsed.data);
    return c.json({
      success: true,
      message: `Successfully generated payroll for ${result.generatedCount} drivers`,
      data: result,
    }, 200);
  } catch (err: any) {
    console.error("[generatePayroll] controller error:", err);
    if (err.message === "STORE_NOT_FOUND") {
      return c.json({
        success: false,
        message: "Store not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }
    return c.json({
      success: false,
      message: "Failed to generate payroll",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

// 5. Get payroll ledgers list (paginated, filtered)
export async function getPayrollLedgers(c: Context) {
  try {
    const storeId = c.req.query("storeId");
    const driverId = c.req.query("driverId");
    const status = c.req.query("status") as any;
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    const search = c.req.query("search") || "";

    const pageQuery = c.req.query("page");
    const page = pageQuery ? parseInt(pageQuery) : 1;

    const limitQuery = c.req.query("limit");
    const limit = limitQuery ? parseInt(limitQuery) : 10;

    const { list, totalItems } = await service.getPayrollLedgers({
      storeId,
      driverId,
      status,
      startDate,
      endDate,
      page,
      limit,
      search,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return c.json({
      success: true,
      message: "Payroll ledgers fetched successfully",
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
    console.error("[getPayrollLedgers] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch payroll ledgers",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

// 6. Update ledger details
export async function updatePayrollLedger(c: Context) {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ success: false, message: "Ledger ID is required" }, 400);
    }
    const body = await c.req.json();
    const parsed = updatePayrollLedgerSchema.safeParse(body);
    if (!parsed.success) {
      return c.json(formatValidationError(parsed), 400);
    }

    const updated = await service.updatePayrollLedger(id, parsed.data);
    if (!updated) {
      return c.json({
        success: false,
        message: "Ledger not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }

    return c.json({
      success: true,
      message: "Ledger updated successfully",
      data: updated,
    }, 200);
  } catch (err) {
    console.error("[updatePayrollLedger] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to update ledger",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

// 7. Export approved ledgers to CSV
export async function exportPayrollLedgers(c: Context) {
  try {
    const storeId = c.req.query("storeId");
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    // Fetch approved ledgers matching filter (limit set high to get all)
    const { list } = await service.getPayrollLedgers({
      storeId,
      startDate,
      endDate,
      status: "approved",
      page: 1,
      limit: 1000,
    });

    // Generate CSV contents
    const headers = [
      "Ledger ID",
      "Driver Name",
      "Driver Phone",
      "Store Name",
      "Billing Start Date",
      "Billing End Date",
      "Total Deliveries",
      "Total Distance (km)",
      "Base Earnings",
      "Distance Earnings",
      "Bonus Earnings",
      "Penalties",
      "Net Payout",
    ];

    const rows = list.map((item) => [
      item.id,
      item.driverName,
      item.driverPhone,
      item.storeName,
      item.startDate,
      item.endDate,
      item.totalDeliveries,
      (item.totalDistanceMeters / 1000).toFixed(2),
      (item.baseOrderEarnings / 100).toFixed(2),
      (item.distanceEarnings / 100).toFixed(2),
      (item.bonusEarnings / 100).toFixed(2),
      (item.penaltyDeductions / 100).toFixed(2),
      (item.netPayout / 100).toFixed(2),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const dateStr = new Date().toISOString().split("T")[0];
    c.header("Content-Type", "text/csv");
    c.header("Content-Disposition", `attachment; filename=payroll_export_${dateStr}.csv`);

    return c.body(csvContent, 200);
  } catch (err) {
    console.error("[exportPayrollLedgers] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to export payroll CSV",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

// 8. Get driver's earnings history
export async function getDriverEarnings(c: Context) {
  try {
    const user = c.get("user");
    if (!user) {
      return c.json({ error: "UNAUTHORIZED", message: "Not authenticated" }, 401);
    }

    // Resolve delivery partner ID from userId
    const [driver] = await db
      .select({ id: deliveryPartners.id })
      .from(deliveryPartners)
      .where(eq(deliveryPartners.userId, user.id))
      .limit(1);

    if (!driver) {
      return c.json({
        success: false,
        message: "Driver profile not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }

    const earnings = await service.getDriverEarnings(driver.id);
    return c.json({
      success: true,
      message: "Earnings fetched successfully",
      data: earnings,
    }, 200);
  } catch (err) {
    console.error("[getDriverEarnings] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to fetch driver earnings",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}

// 9. Delete configuration override
export async function deletePayrollConfiguration(c: Context) {
  try {
    const id = c.req.param("id");
    if (!id) {
      return c.json({ success: false, message: "Configuration ID is required" }, 400);
    }

    const deleted = await service.deletePayrollConfiguration(id);
    if (!deleted) {
      return c.json({
        success: false,
        message: "Configuration not found",
        error: { code: "NOT_FOUND" },
      }, 404);
    }

    return c.json({
      success: true,
      message: "Payroll configuration deleted successfully",
      data: deleted,
    }, 200);
  } catch (err) {
    console.error("[deletePayrollConfiguration] controller error:", err);
    return c.json({
      success: false,
      message: "Failed to delete configuration",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
}
