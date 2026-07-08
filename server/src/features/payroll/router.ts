import { Hono } from "hono";
import { requireAuth } from "../auth/middleware.ts";
import * as controller from "./controller.ts";

export const payrollRouter = new Hono();

// Payout configurations management
payrollRouter.get("/configurations", requireAuth(["super_admin"]), controller.getPayrollConfigurations);
payrollRouter.get("/configurations/:storeId", requireAuth(), controller.getPayrollConfigurationByStore);
payrollRouter.post("/configurations", requireAuth(["super_admin"]), controller.upsertPayrollConfiguration);
payrollRouter.delete("/configurations/:id", requireAuth(["super_admin"]), controller.deletePayrollConfiguration);

// Payroll operations (generate, list, update, export)
payrollRouter.post("/generate", requireAuth(["super_admin", "store_manager"]), controller.generatePayroll);
payrollRouter.get("/ledgers", requireAuth(["super_admin", "store_manager", "dispatcher"]), controller.getPayrollLedgers);
payrollRouter.patch("/ledgers/:id", requireAuth(["super_admin"]), controller.updatePayrollLedger);
payrollRouter.get("/ledgers/export", requireAuth(["super_admin"]), controller.exportPayrollLedgers);

// Driver self-access
payrollRouter.get("/me/earnings", requireAuth(["delivery_partner"]), controller.getDriverEarnings);
