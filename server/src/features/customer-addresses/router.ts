import { Hono } from "hono";
import { requireAuth } from "../auth/middleware.ts";
import * as controller from "./controller.ts";

export const customerAddressesRouter = new Hono();

// Require authenticated user (specifically customer, but let's allow general authenticated for flexibility, then restrict to customers if needed)
// Usually, only customers manage saved addresses. Let's allow roles: super_admin, dispatcher, customer.
customerAddressesRouter.get("/", requireAuth(["customer", "super_admin"]), controller.getAddresses);
customerAddressesRouter.post("/", requireAuth(["customer", "super_admin"]), controller.createAddress);
customerAddressesRouter.patch("/:id", requireAuth(["customer", "super_admin"]), controller.updateAddress);
customerAddressesRouter.delete("/:id", requireAuth(["customer", "super_admin"]), controller.deleteAddress);
