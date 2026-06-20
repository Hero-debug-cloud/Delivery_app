import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRouter } from "./features/auth/router.ts";
import { uploadRouter } from "./features/upload/index.ts";
import { productsRouter } from "./features/products/index.ts";
import { deliveryPartnersRouter } from "./features/delivery-partners/index.ts";
import { db } from "./db/index.ts";
import { stores as storesTable } from "./db/schema.ts";
import { sql } from "drizzle-orm";

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

// Stores Routes Group (stubs — will be replaced in Stores module)
const stores = new Hono();
stores.get("/", async (c) => {
  try {
    const pageQuery = c.req.query("page");
    const page = pageQuery ? parseInt(pageQuery) : 1;

    const limitQuery = c.req.query("limit");
    const limit = limitQuery ? parseInt(limitQuery) : 10;

    const offset = (page - 1) * limit;

    const countResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(storesTable);
    const totalItems = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(totalItems / limit);

    const list = await db
      .select()
      .from(storesTable)
      .limit(limit)
      .offset(offset);

    return c.json({
      success: true,
      message: "Stores fetched successfully",
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
    console.error("Failed to query stores:", err);
    return c.json({
      success: false,
      message: "Failed to fetch stores",
      error: { code: "INTERNAL_SERVER_ERROR" },
    }, 500);
  }
});
stores.post("/", (c) => c.json({ message: "Store created", id: "store_stub_id" }, 201));
stores.get("/:id", (c) => c.json({ id: c.req.param("id"), name: "Central Store" }));
stores.patch("/:id", (c) => c.json({ message: "Store updated", id: c.req.param("id") }));
stores.delete("/:id", (c) => c.json({ message: "Store deleted", id: c.req.param("id") }));
app.route("/stores", stores);

// Delivery Partners Routes Group
app.route("/delivery-partners", deliveryPartnersRouter);

// Orders Routes Group (stubs)
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

// Location Routes Group (stubs)
const locations = new Hono();
locations.post("/ping", (c) => c.json({ message: "Telemetry ping recorded" }));
locations.get("/drivers/:driverId/latest", (c) => c.json({ driverId: c.req.param("driverId"), lat: 12.9716, lng: 77.5946 }));
locations.get("/orders/:orderId/latest", (c) => c.json({ orderId: c.req.param("orderId"), lat: 12.9716, lng: 77.5946 }));
locations.get("/orders/:orderId/history", (c) => c.json({ orderId: c.req.param("orderId"), pings: [] }));
app.route("/locations", locations);

// Customer Tracking Routes Group (stubs)
const tracking = new Hono();
tracking.get("/:trackingToken", (c) => c.json({ order_id: "order_stub_id", status: "in_transit", eta: "15 mins" }));
tracking.get("/:trackingToken/location", (c) => c.json({ lat: 12.9716, lng: 77.5946 }));
app.route("/track", tracking);

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
};
