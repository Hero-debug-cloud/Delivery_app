import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

// Global Middleware
app.use("*", logger());
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
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

// Auth Routes Group
const auth = new Hono();
auth.post("/admin/login", (c) => c.json({ message: "Admin login success", token: "jwt_admin_token_stub" }));
auth.post("/otp/request", (c) => c.json({ message: "OTP sent successfully" }));
auth.post("/otp/verify", (c) => c.json({ message: "OTP verification success", token: "jwt_otp_token_stub", role: "delivery_partner" }));
auth.post("/logout", (c) => c.json({ message: "Logged out successfully" }));
auth.get("/me", (c) => c.json({ id: "user_stub_id", name: "John Doe", role: "dispatcher" }));
app.route("/auth", auth);

// Stores Routes Group
const stores = new Hono();
stores.get("/", (c) => c.json({ stores: [] }));
stores.post("/", (c) => c.json({ message: "Store created", id: "store_stub_id" }, 201));
stores.get("/:id", (c) => c.json({ id: c.req.param("id"), name: "Central Store" }));
stores.patch("/:id", (c) => c.json({ message: "Store updated", id: c.req.param("id") }));
stores.delete("/:id", (c) => c.json({ message: "Store deleted", id: c.req.param("id") }));
app.route("/stores", stores);

// Delivery Partners Routes Group
const partners = new Hono();
partners.get("/", (c) => c.json({ delivery_partners: [] }));
partners.post("/", (c) => c.json({ message: "Delivery partner created", id: "driver_stub_id" }, 201));
partners.get("/:id", (c) => c.json({ id: c.req.param("id"), name: "Sarah Connor", status: "online" }));
partners.patch("/:id", (c) => c.json({ message: "Driver profile updated", id: c.req.param("id") }));
partners.post("/:id/status", (c) => c.json({ message: "Driver status updated", status: "busy" }));
app.route("/delivery-partners", partners);

// Orders Routes Group
const orders = new Hono();
orders.get("/", (c) => c.json({ orders: [] }));
orders.post("/", (c) => c.json({ message: "Order created", id: "order_stub_id" }, 201));
orders.post("/ingest", (c) => c.json({ message: "Orders bulk ingested", count: 1 }, 201));
orders.get("/:id", (c) => c.json({ id: c.req.param("id"), status: "created" }));
orders.patch("/:id", (c) => c.json({ message: "Order updated", id: c.req.param("id") }));
orders.post("/:id/assign", (c) => c.json({ message: "Driver assigned", order_id: c.req.param("id") }));
orders.post("/:id/accept", (c) => c.json({ message: "Order accepted by driver", order_id: c.req.param("id") }));
orders.post("/:id/reject", (c) => c.json({ message: "Order rejected by driver", order_id: c.req.param("id") }));
orders.post("/:id/picked-up", (c) => c.json({ message: "Order picked up", order_id: c.req.param("id") }));
orders.post("/:id/delivered", (c) => c.json({ message: "Order delivered confirmed", order_id: c.req.param("id") }));
orders.post("/:id/failed", (c) => c.json({ message: "Order marked failed", order_id: c.req.param("id") }));
app.route("/orders", orders);

// Location Routes Group
const locations = new Hono();
locations.post("/ping", (c) => c.json({ message: "Telemetry ping recorded" }));
locations.get("/drivers/:driverId/latest", (c) => c.json({ driverId: c.req.param("driverId"), lat: 12.9716, lng: 77.5946 }));
locations.get("/orders/:orderId/latest", (c) => c.json({ orderId: c.req.param("orderId"), lat: 12.9716, lng: 77.5946 }));
locations.get("/orders/:orderId/history", (c) => c.json({ orderId: c.req.param("orderId"), pings: [] }));
app.route("/locations", locations);

// Customer Tracking Routes Group
const tracking = new Hono();
tracking.get("/:trackingToken", (c) => c.json({ order_id: "order_stub_id", status: "in_transit", eta: "15 mins" }));
tracking.get("/:trackingToken/location", (c) => c.json({ lat: 12.9716, lng: 77.5946 }));
app.route("/track", tracking);

// Error Handling
app.onError((err, c) => {
  console.error("Unhandle Server Error:", err);
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Not Found", message: "Requested path does not exist" }, 404);
});

// Startup using Bun.serve
export default {
  port: process.env.PORT || 8000,
  fetch: app.fetch,
};
