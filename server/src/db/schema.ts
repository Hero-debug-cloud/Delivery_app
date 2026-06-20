import { pgTable, text, timestamp, boolean, integer, doublePrecision, jsonb, uuid, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("user_role", [
  "super_admin",
  "store_manager",
  "dispatcher",
  "delivery_partner",
  "customer"
]);

export const vehicleTypeEnum = pgEnum("vehicle_type", [
  "motorcycle",
  "bicycle",
  "car",
  "van"
]);

export const driverStatusEnum = pgEnum("driver_status", [
  "offline",
  "online",
  "busy"
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "prepaid",
  "cod"
]);

export const orderStatusEnum = pgEnum("order_status", [
  "created",
  "assigned",
  "accepted",
  "picked_up",
  "in_transit",
  "delivered",
  "failed"
]);

// 1. users Table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash"),
  role: roleEnum("role").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 2. stores Table
export const stores = pgTable("stores", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  phone: text("phone").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 3. delivery_partners Table
export const deliveryPartners = pgTable("delivery_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
  vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
  vehicleNumber: text("vehicle_number").notNull(),
  status: driverStatusEnum("status").notNull().default("offline"),
  isActive: boolean("is_active").notNull().default(true),
  currentLatitude: doublePrecision("current_latitude"),
  currentLongitude: doublePrecision("current_longitude"),
  lastLocationAt: timestamp("last_location_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("delivery_partners_user_id_idx").on(table.userId),
    storeStatusIdx: index("delivery_partners_store_id_status_idx").on(table.storeId, table.status),
  };
});

// 4. customer_addresses Table
export const customerAddresses = pgTable("customer_addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  address: text("address").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    customerIdIdx: index("customer_addresses_customer_id_idx").on(table.customerId),
  };
});

// 5. products Table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  unitSize: text("unit_size"),
  category: text("category"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isVeg: boolean("is_veg").notNull().default(true),
  inStock: boolean("in_stock").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    storeCategoryIdx: index("products_store_id_category_idx").on(table.storeId, table.category),
    storeFeaturedIdx: index("products_store_id_is_featured_idx").on(table.storeId, table.isFeatured),
  };
});

// 6. carts Table
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storeId: uuid("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 7. cart_items Table
export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// 8. orders Table
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  externalOrderId: text("external_order_id").unique(),
  storeId: uuid("store_id").notNull().references(() => stores.id),
  customerId: uuid("customer_id").references(() => users.id, { onDelete: "set null" }),
  assignedDriverId: uuid("assigned_driver_id").references(() => deliveryPartners.id, { onDelete: "set null" }),
  addressId: uuid("address_id").references(() => customerAddresses.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLatitude: doublePrecision("delivery_latitude").notNull(),
  deliveryLongitude: doublePrecision("delivery_longitude").notNull(),
  paymentType: paymentTypeEnum("payment_type").notNull(),
  status: orderStatusEnum("status").notNull().default("created"),
  trackingToken: text("tracking_token").unique().notNull(),
  proofPin: text("proof_pin"),
  itemTotal: integer("item_total"),
  deliveryFee: integer("delivery_fee"),
  handlingCharge: integer("handling_charge"),
  grandTotal: integer("grand_total"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    statusIdx: index("orders_status_idx").on(table.status),
    storeIdIdx: index("orders_store_id_idx").on(table.storeId),
    assignedDriverIdIdx: index("orders_assigned_driver_id_idx").on(table.assignedDriverId),
    customerIdIdx: index("orders_customer_id_idx").on(table.customerId),
  };
});

// 9. order_items Table
export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  lineTotal: integer("line_total").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
  };
});

// 10. order_events Table
export const orderEvents = pgTable("order_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  metadataJson: jsonb("metadata_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    orderIdIdx: index("order_events_order_id_idx").on(table.orderId),
  };
});

// 11. location_pings Table
export const locationPings = pgTable("location_pings", {
  id: uuid("id").defaultRandom().notNull(),
  deliveryPartnerId: uuid("delivery_partner_id").notNull().references(() => deliveryPartners.id, { onDelete: "cascade" }),
  orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  speed: doublePrecision("speed"),
  battery: integer("battery"),
  recordedAt: timestamp("recorded_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => {
  return {
    partnerRecordedIdx: index("location_pings_partner_recorded_idx").on(table.deliveryPartnerId, table.recordedAt),
    orderIdIdx: index("location_pings_order_id_idx").on(table.orderId),
  };
});

// 12. user_permissions Table
export const userPermissions = pgTable("user_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tab: text("tab").notNull(), // 'dashboard', 'stores', 'drivers', 'orders', 'tracking'
  canCreate: boolean("can_create").notNull().default(false),
  canRead: boolean("can_read").notNull().default(true),
  canUpdate: boolean("can_update").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userTabUnique: uniqueIndex("user_permissions_user_id_tab_unique").on(table.userId, table.tab),
    userIdIdx: index("user_permissions_user_id_idx").on(table.userId),
  };
});

// 13. sessions Table
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // Session token string
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  };
});

// Relations Definitions
export const usersRelations = relations(users, ({ one, many }) => ({
  deliveryPartner: one(deliveryPartners),
  addresses: many(customerAddresses),
  carts: many(carts),
  orders: many(orders),
  orderEvents: many(orderEvents),
  permissions: many(userPermissions),
  sessions: many(sessions),
}));

export const storesRelations = relations(stores, ({ many }) => ({
  deliveryPartners: many(deliveryPartners),
  orders: many(orders),
  products: many(products),
  carts: many(carts),
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

export const customerAddressesRelations = relations(customerAddresses, ({ one, many }) => ({
  customer: one(users, {
    fields: [customerAddresses.customerId],
    references: [users.id],
  }),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(users, {
    fields: [carts.customerId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [carts.storeId],
    references: [stores.id],
  }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  assignedDriver: one(deliveryPartners, {
    fields: [orders.assignedDriverId],
    references: [deliveryPartners.id],
  }),
  address: one(customerAddresses, {
    fields: [orders.addressId],
    references: [customerAddresses.id],
  }),
  items: many(orderItems),
  events: many(orderEvents),
  locationPings: many(locationPings),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, {
    fields: [orderEvents.orderId],
    references: [orders.id],
  }),
  actorUser: one(users, {
    fields: [orderEvents.actorUserId],
    references: [users.id],
  }),
}));

export const locationPingsRelations = relations(locationPings, ({ one }) => ({
  deliveryPartner: one(deliveryPartners, {
    fields: [locationPings.deliveryPartnerId],
    references: [deliveryPartners.id],
  }),
  order: one(orders, {
    fields: [locationPings.orderId],
    references: [orders.id],
  }),
}));

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
