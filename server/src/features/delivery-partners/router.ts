import { Hono } from "hono";
import { requireAuth } from "../auth/middleware.ts";
import * as controller from "./controller.ts";

export const deliveryPartnersRouter = new Hono();

deliveryPartnersRouter.patch(
  "/me/onboard",
  requireAuth(["delivery_partner"]),
  controller.onboardMe
);

deliveryPartnersRouter.patch(
  "/me/status",
  requireAuth(["delivery_partner"]),
  controller.updateStatus
);

deliveryPartnersRouter.get(
  "/me/profile",
  requireAuth(["delivery_partner"]),
  controller.getProfile
);

deliveryPartnersRouter.patch(
  "/me/profile",
  requireAuth(["delivery_partner"]),
  controller.updateProfile
);

// Admin-facing actions (requires admin roles)
deliveryPartnersRouter.get(
  "/",
  requireAuth(["super_admin", "store_manager", "dispatcher"]),
  controller.getDrivers
);

deliveryPartnersRouter.post(
  "/",
  requireAuth(["super_admin", "store_manager", "dispatcher"]),
  controller.createDriver
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
