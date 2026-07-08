import { z } from "zod";

// Payout Configuration Validation
export const upsertPayrollConfigSchema = z.object({
  storeId: z.string().uuid().nullable().optional(),
  perOrderRate: z.number().int().nonnegative().default(2000), // in paise/cents (default ₹20.00)
  perKmRate: z.number().int().nonnegative().default(500), // in paise/cents (default ₹5.00)
  nightSurgeRate: z.number().int().nonnegative().default(1000), // in paise/cents (default ₹10.00)
  weatherSurgeRate: z.number().int().nonnegative().default(1500), // in paise/cents (default ₹15.00)
  latePenalty: z.number().int().nonnegative().default(500), // in paise/cents (default ₹5.00)
});

export type UpsertPayrollConfigInput = z.infer<typeof upsertPayrollConfigSchema>;

// Payroll Generation Validation
export const generatePayrollSchema = z.object({
  storeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format"),
});

export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>;

// Payroll Update Validation
export const updatePayrollLedgerSchema = z.object({
  status: z.enum(["draft", "approved", "hold", "paid"]).optional(),
  paymentReference: z.string().min(1).nullable().optional(),
});

export type UpdatePayrollLedgerInput = z.infer<typeof updatePayrollLedgerSchema>;

// Filters for fetching ledgers
export interface GetLedgersFilters {
  storeId?: string;
  driverId?: string;
  status?: "draft" | "approved" | "hold" | "paid";
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface GetConfigurationsFilters {
  page?: number;
  limit?: number;
  search?: string;
}

