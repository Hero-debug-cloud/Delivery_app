import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  doublePrecision, 
  boolean, 
  integer,
  jsonb,
  customType
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Custom type for PostGIS Point geometry (SRID 4326)
export const postgisPoint = customType<{ data: { lng: number; lat: number }; driverParam: string }>({
  dataType() {
    return "geometry(Point, 4326)";
  },
  toDriver(value) {
    return `SRID=4326;POINT(${value.lng} ${value.lat})`;
  },
  fromDriver(value: unknown) {
    // PostGIS returns points in WKB or text format like POINT(lng lat) depending on driver
    if (typeof value === "string") {
      const match = value.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
      }
    }
    return { lng: 0, lat: 0 };
  }
});

// Users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash"), // Nullable for OTP users
  role: text("role", { enum: ["super_admin", "store_manager", "dispatcher", "delivery_partner", "customer"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Stores Table
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  geom: postgisPoint("geom"), // PostGIS Spatial integration
  phone: text("phone").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Delivery Partners Table
export const deliveryPartners = pgTable("delivery_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
  vehicleType: text("vehicle_type").notNull(), // bicycle, scooter, motorbike, car
  vehicleNumber: text("vehicle_number").notNull(),
  status: text("status", { enum: ["offline", "online", "busy"] }).default("offline").notNull(),
  currentLatitude: doublePrecision("current_latitude"),
  currentLongitude: doublePrecision("current_longitude"),
  currentGeom: postgisPoint("current_geom"), // PostGIS real-time tracking
  lastLocationAt: timestamp("last_location_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Customers Table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Orders Table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalOrderId: text("external_order_id").unique(),
  storeId: uuid("store_id").references(() => stores.id).notNull(),
  customerId: uuid("customer_id").references(() => customers.id).notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLatitude: doublePrecision("delivery_latitude").notNull(),
  deliveryLongitude: doublePrecision("delivery_longitude").notNull(),
  deliveryGeom: postgisPoint("delivery_geom"), // PostGIS dropoff point
  paymentType: text("payment_type", { enum: ["prepaid", "cod"] }).notNull(),
  status: text("status", { 
    enum: ["created", "assigned", "accepted", "picked_up", "in_transit", "delivered", "rejected", "failed"] 
  }).default("created").notNull(),
  assignedDriverId: uuid("assigned_driver_id").references(() => deliveryPartners.id),
  pickupAt: timestamp("pickup_at"),
  deliveredAt: timestamp("delivered_at"),
  proofPin: text("proof_pin"), // 4-digit code
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Order Events (Time-Series ready event log / audit trail)
export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  eventType: text("event_type").notNull(), // status changes, manual overrides, assignments
  actorUserId: uuid("actor_user_id").references(() => users.id),
  metadataJson: jsonb("metadata_json"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Location Pings Table (Time-Series driver telemetry for TimescaleDB hypertable conversion)
export const locationPings = pgTable("location_pings", {
  id: uuid("id").defaultRandom().notNull(),
  deliveryPartnerId: uuid("delivery_partner_id").references(() => deliveryPartners.id, { onDelete: "cascade" }).notNull(),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  geom: postgisPoint("geom"), // PostGIS index integration
  speed: doublePrecision("speed"),
  battery: integer("battery"),
  recordedAt: timestamp("recorded_at").notNull(), // Primary time column for TimescaleDB hypertable
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Define Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  deliveryPartner: one(deliveryPartners, {
    fields: [users.id],
    references: [deliveryPartners.userId],
  }),
  orderEvents: many(orderEvents),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  deliveryPartners: many(deliveryPartners),
  orders: many(orders),
}));

export const deliveryPartnersRelations = relations(deliveryPartners, ({ one, many }) => ({
  user: one(users, {
    fields: [deliveryPartners.userId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [deliveryPartners.storeId],
    references: [stores.id],
  }),
  orders: many(orders),
  locationPings: many(locationPings),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  driver: one(deliveryPartners, {
    fields: [orders.assignedDriverId],
    references: [deliveryPartners.id],
  }),
  events: many(orderEvents),
  locationPings: many(locationPings),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
  actor: one(users, {
    fields: [orderEvents.actorUserId],
    references: [users.id],
  }),
}));

export const locationPingsRelations = relations(locationPings, ({ one }) => ({
  driver: one(deliveryPartners, {
    fields: [locationPings.deliveryPartnerId],
    references: [deliveryPartners.id],
  }),
  order: one(orders, {
    fields: [locationPings.orderId],
    references: [orders.id],
  }),
}));
