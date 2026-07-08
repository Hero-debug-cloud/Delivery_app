import { Hono } from "hono";
import { requireAuth } from "../auth/middleware.ts";
import * as controller from "./controller.ts";

export const ordersRouter = new Hono();

// Customer Endpoints
ordersRouter.post("/", requireAuth(["customer"]), controller.createOrder);
ordersRouter.get("/customer", requireAuth(["customer"]), controller.getCustomerOrders);
ordersRouter.get("/customer/:id", requireAuth(["customer"]), controller.getCustomerOrderById);

// Driver Endpoints
ordersRouter.get("/active", requireAuth(["delivery_partner"]), controller.getActiveOrderForDriver);
ordersRouter.get("/broadcasts", requireAuth(["delivery_partner"]), controller.getBroadcastsForDriver);
ordersRouter.post("/:id/accept", requireAuth(["delivery_partner"]), controller.acceptOrder);
ordersRouter.post("/:id/ignore", requireAuth(["delivery_partner"]), controller.ignoreOrder);
ordersRouter.post("/:id/reached-store", requireAuth(["delivery_partner"]), controller.reachedStore);
ordersRouter.post("/:id/picked-up", requireAuth(["delivery_partner"]), controller.pickedUp);
ordersRouter.post("/:id/out-for-delivery", requireAuth(["delivery_partner"]), controller.outForDelivery);
ordersRouter.post("/:id/reached-location", requireAuth(["delivery_partner"]), controller.reachedLocation);
ordersRouter.post("/:id/complete", requireAuth(["delivery_partner"]), controller.completeOrder);
ordersRouter.post("/:id/cancel", requireAuth(["super_admin", "store_manager", "dispatcher", "delivery_partner"]), controller.cancelOrder);

// Admin Endpoints
ordersRouter.get("/", requireAuth(["super_admin", "store_manager", "dispatcher"]), controller.getOrders);
ordersRouter.post("/:id/assign", requireAuth(["super_admin", "store_manager", "dispatcher"]), controller.assignDriver);
ordersRouter.get("/dashboard/stats", requireAuth(["super_admin", "store_manager", "dispatcher"]), controller.getDashboardStats);

// Public Tracking Endpoints
export const trackRouter = new Hono();
trackRouter.get("/:trackingToken", controller.getTrackDetails);
trackRouter.get("/:trackingToken/location", controller.getTrackLocation);
