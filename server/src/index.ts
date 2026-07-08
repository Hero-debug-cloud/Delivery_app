import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRouter } from "./features/auth/router.ts";
import { uploadRouter } from "./features/upload/index.ts";
import { productsRouter } from "./features/products/index.ts";
import { deliveryPartnersRouter } from "./features/delivery-partners/index.ts";
import { storesRouter } from "./features/stores/index.ts";
import { customerAddressesRouter } from "./features/customer-addresses/index.ts";
import { usersRouter } from "./features/users/index.ts";
import { telemetryRouter, websocket } from "./features/telemetry/index.ts";
import { ordersRouter, trackRouter } from "./features/orders/index.ts";
import { payrollRouter } from "./features/payroll/router.ts";

const app = new Hono();

// Global Middleware
app.use("*", logger());
app.use("*", cors({
  origin: ["http://localhost:3000", "http://localhost:3010"],
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Base / Healthcheck
app.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "logiroute-api",
    timestamp: new Date().toISOString(),
    runtime: "Bun"
  });
});

// Auth Routes
app.route("/auth", authRouter);

// Global Upload Routes
app.route("/upload", uploadRouter);

// Products & Categories Routes
app.route("/", productsRouter);

// Stores Routes Group
app.route("/stores", storesRouter);

// Delivery Partners Routes Group
app.route("/delivery-partners", deliveryPartnersRouter);

// Customer Saved Addresses Routes Group
app.route("/customer/addresses", customerAddressesRouter);

// Users Routes Group
app.route("/users", usersRouter);

// Orders Routes Group
app.route("/orders", ordersRouter);

// Location Routes Group (real-time telemetry & WebSocket stream)
app.route("/locations", telemetryRouter);

// Customer Tracking Routes Group
app.route("/track", trackRouter);

// Payroll Routes Group
app.route("/payroll", payrollRouter);

// Error Handling
app.onError((err, c) => {
  console.error("Unhandled Server Error:", err);
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Not Found", message: "Requested path does not exist" }, 404);
});

// Startup using Bun.serve
export default {
  port: process.env.PORT || 8000,
  fetch: app.fetch,
  websocket,
};
