import { Hono } from "hono";
import { requireAuth } from "../auth/middleware.ts";
import * as controller from "./controller.ts";

export const deliveryPartnersRouter = new Hono();

// Driver onboarding (requires driver role)
deliveryPartnersRouter.patch(
  "/me/onboard",
  requireAuth(["delivery_partner"]),
  controller.onboardMe
);

// Admin-facing actions (requires admin roles)
deliveryPartnersRouter.get(
  "/",
  requireAuth(["super_admin", "store_manager", "dispatcher"]),
  controller.getDrivers
);

deliveryPartnersRouter.post(
  "/:id/approve",
  requireAuth(["super_admin", "store_manager", "dispatcher"]),
  controller.approveDriver
);

deliveryPartnersRouter.post(
  "/:id/reject",
  requireAuth(["super_admin", "store_manager", "dispatcher"]),
  controller.rejectDriver
);
