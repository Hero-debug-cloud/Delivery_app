import { Hono } from "hono";
import { requireAuth } from "../auth/middleware.ts";
import * as controller from "./controller.ts";

export const storesRouter = new Hono();

// Read operations: Allowed for any authenticated user (admins, dispatchers, drivers, customers)
storesRouter.get("/", requireAuth(), controller.getStores);
storesRouter.get("/:id", requireAuth(), controller.getStoreById);
storesRouter.post("/check-serviceability", requireAuth(), controller.checkServiceability);

// Write operations: Restricted to specific admin roles
storesRouter.post("/", requireAuth(["super_admin"]), controller.createStore);
storesRouter.patch("/:id", requireAuth(["super_admin", "store_manager"]), controller.updateStore);
storesRouter.delete("/:id", requireAuth(["super_admin"]), controller.deleteStore);
