# MVP v1 Specification
## LogiRoute — First Buildable Release

---

## 1. MVP Goal

The MVP v1 of **LogiRoute** should prove the core last-mile delivery workflow:

> A store receives an order, assigns it to a delivery partner, tracks the delivery partner live, confirms delivery, and stores the completed delivery record.

This version should focus on operational usability and technical validation, not full enterprise automation.

---

## 2. MVP Success Criteria

MVP v1 is successful if:

1. Admin users can create stores and delivery partners.
2. Orders can be created manually or ingested through a basic API endpoint.
3. Store managers or dispatchers can assign an order to a delivery partner.
4. Delivery partners can accept, pick up, and complete assigned orders from the mobile app.
5. Admin users can view live driver location during an active delivery.
6. Customers can view basic order status and live tracking.
7. Completed orders are stored with timestamps, driver, store, customer, and delivery proof.

---

## 3. MVP User Roles

MVP v1 should include a simplified RBAC model.

| Role | Platform | Capabilities |
| :--- | :--- | :--- |
| Super Admin | Web | Full access to all stores, users, drivers, and orders. |
| Store Manager | Web | Manage one store, drivers, and orders for that store. |
| Dispatcher | Web | View order queue, assign drivers, monitor live deliveries. |
| Delivery Partner | Mobile | View assigned orders, accept/reject, update delivery status, share location. |
| Customer | Mobile/Web Link | View order status and live driver location for their own order. |

### Deferred Roles

The following roles are not required in MVP v1:

- Regional Operations Manager
- HR & Payroll Admin

---

## 4. MVP Functional Scope

### 4.1 Authentication

#### Required

- Phone/email login for admin users.
- Phone OTP login for delivery partners and customers.
- Role-based dashboard/app routing.
- Basic session management.

#### Deferred

- Biometric authentication.
- Enterprise SSO.
- Advanced permission editor.

---

### 4.2 Store Management

#### Required

- Create, edit, and deactivate stores.
- Store fields:
  - Store name
  - Address
  - Latitude
  - Longitude
  - Contact number
  - Active/inactive status
- Assign delivery partners to a default store.

#### Deferred

- Polygon geofence editor.
- Multi-region hierarchy.
- Store inventory sync.

---

### 4.3 Delivery Partner Management

#### Required

- Create delivery partner profile.
- Assign partner to a store.
- Track availability status:
  - Offline
  - Online
  - Busy
- Store basic vehicle details:
  - Vehicle type
  - Vehicle number
- Store basic compliance information manually.

#### Deferred

- Background checks.
- Digital contracts.
- License scan uploads.
- Driver bidding for shifts.

---

### 4.4 Order Management

#### Required

Orders can enter the system in two ways:

1. Manual creation from the admin panel.
2. Basic REST API ingestion endpoint.

Order fields:

- External order ID
- Customer name
- Customer phone
- Delivery address
- Delivery latitude/longitude
- Store ID
- Payment type: `prepaid` or `cod`
- Order status
- Assigned driver ID
- Created timestamp
- Delivered timestamp

Order statuses:

```text
created -> assigned -> accepted -> picked_up -> in_transit -> delivered
                          |             |              |
                          v             v              v
                       rejected       failed         failed
```

#### Required Admin Actions

- View order queue.
- Filter by status and store.
- Assign/reassign driver.
- Mark order failed.

#### Deferred

- Automatic batching.
- Algorithmic dispatch scoring.
- SLA scoring.
- Returns workflow.
- Inventory and product sync.

---

### 4.5 Dispatch

#### Required

- Dispatcher can manually assign an order to an online delivery partner.
- Delivery partner receives assignment in the mobile app.
- Delivery partner can accept or reject the order.
- If rejected, order returns to `created` or `pending_assignment` state.

#### Deferred

- 60-second FCM offer timer.
- Auto-assignment engine.
- Drag-and-drop Gantt dashboard.
- Surge routing.

---

### 4.6 Live Tracking

#### Required

- Delivery partner app sends GPS coordinates during active delivery.
- Admin dashboard shows active delivery partner location on a map.
- Customer tracking page shows order status and current driver location.
- Store latest live location in Redis or database.
- Persist location pings for completed order history.

Recommended telemetry interval for MVP:

```text
Every 10 seconds while an order is active.
Every 60 seconds when partner is online but idle.
No tracking when offline.
```

#### Deferred

- MQTT over WebSockets.
- Adaptive sampling.
- Kalman filtering.
- OSRM map matching.
- Route replay animation.
- Anomaly detection.

For MVP, simple HTTPS location updates are acceptable.

---

### 4.7 Delivery Workflow

#### Delivery Partner App Flow

1. Login.
2. Go online.
3. View assigned order.
4. Accept or reject order.
5. Navigate to store.
6. Mark `Picked Up`.
7. Navigate to customer.
8. Mark `Delivered`.
9. Upload proof of delivery.
10. Return to available state.

#### Proof of Delivery Required

At least one of:

- Customer PIN
- Delivery photo
- Customer signature

Recommended MVP choice: **4-digit customer PIN**.

#### Deferred

- Barcode scanning.
- Door photo workflow.
- Signature capture.
- Geofenced pickup/dropoff validation.

---

### 4.8 Customer Tracking

#### Required

- Customer can view order status using a secure tracking link or app screen.
- Customer sees:
  - Current order status
  - Assigned driver name
  - Driver phone number, optional
  - Live driver position on map
  - Estimated status text

#### Deferred

- Customer product catalog.
- Cart and checkout.
- Payments.
- Support tickets.
- Order history.

---

## 5. MVP Admin Web Pages

Built with **Next.js + Tailwind CSS + shadcn/ui**.

### Page 1: Login

- Admin login.
- Role-based redirect.

### Page 2: Dashboard

Cards:

- Active orders
- Available drivers
- Orders delivered today
- Failed orders today

Map:

- Active delivery partners
- Active orders

### Page 3: Stores

- Store list.
- Create/edit store.
- Activate/deactivate store.

### Page 4: Delivery Partners

- Driver list.
- Create/edit driver.
- Assign driver to store.
- View current status.

### Page 5: Orders

- Order queue table.
- Create manual order.
- Assign/reassign driver.
- View order detail.

### Page 6: Live Tracking

- Map of active drivers.
- Click driver/order to view status details.

---

## 6. MVP Mobile App Screens

Built with **Flutter**.

### Delivery Partner Screens

1. Login / OTP
2. Home Dashboard
3. Assigned Order Detail
4. Active Delivery Screen
5. Delivery Completion / PIN Entry
6. Profile

### Customer Screens

For MVP, this can be either inside the Flutter app or a lightweight responsive web page.

1. Tracking Link / Order Lookup
2. Order Status View
3. Live Map View

---

## 7. MVP Backend Services

Built with **Bun + Hono + Drizzle ORM**.

### Required Services

1. Auth service
2. User/role service
3. Store service
4. Delivery partner service
5. Order service
6. Dispatch service
7. Location service
8. Customer tracking service

### Deferred Services

- Payroll service
- Shift scheduling service
- Inventory sync service
- Route replay service
- OSRM integration service
- MQTT telemetry service

---

## 8. Suggested MVP Database Tables

### users

- id
- name
- email
- phone
- password_hash, nullable for OTP-only users
- role
- created_at
- updated_at

### stores

- id
- name
- address
- latitude
- longitude
- phone
- is_active
- created_at
- updated_at

### delivery_partners

- id
- user_id
- store_id
- vehicle_type
- vehicle_number
- status: `offline`, `online`, `busy`
- current_latitude
- current_longitude
- last_location_at
- created_at
- updated_at

### customers

- id
- name
- phone
- created_at
- updated_at

### orders

- id
- external_order_id
- store_id
- customer_id
- delivery_address
- delivery_latitude
- delivery_longitude
- payment_type: `prepaid`, `cod`
- status
- assigned_driver_id
- pickup_at
- delivered_at
- proof_pin
- created_at
- updated_at

### order_events

- id
- order_id
- event_type
- actor_user_id
- metadata_json
- created_at

### location_pings

- id
- delivery_partner_id
- order_id, nullable
- latitude
- longitude
- speed, nullable
- battery, nullable
- recorded_at
- created_at

---

## 9. MVP API Endpoints

### Auth

```http
POST /auth/admin/login
POST /auth/otp/request
POST /auth/otp/verify
POST /auth/logout
GET  /auth/me
```

### Stores

```http
GET    /stores
POST   /stores
GET    /stores/:id
PATCH  /stores/:id
DELETE /stores/:id
```

### Delivery Partners

```http
GET   /delivery-partners
POST  /delivery-partners
GET   /delivery-partners/:id
PATCH /delivery-partners/:id
POST  /delivery-partners/:id/status
```

### Orders

```http
GET   /orders
POST  /orders
POST  /orders/ingest
GET   /orders/:id
PATCH /orders/:id
POST  /orders/:id/assign
POST  /orders/:id/accept
POST  /orders/:id/reject
POST  /orders/:id/picked-up
POST  /orders/:id/delivered
POST  /orders/:id/failed
```

### Location

```http
POST /locations/ping
GET  /locations/drivers/:driverId/latest
GET  /locations/orders/:orderId/latest
GET  /locations/orders/:orderId/history
```

### Customer Tracking

```http
GET /track/:trackingToken
GET /track/:trackingToken/location
```

---

## 10. Recommended Tech Stack for MVP

| Layer | MVP Choice |
| :--- | :--- |
| Runtime | Bun |
| API Framework | Hono |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Spatial | Simple lat/lng columns first, PostGIS optional in v1 |
| Cache | Redis optional, can start with database latest location fields |
| Admin Frontend | Next.js + Tailwind CSS + shadcn/ui |
| Mobile App | Flutter |
| Maps | Google Maps or Mapbox |
| Push Notifications | FCM, optional for MVP if polling is used first |
| Hosting | Docker-based deployment |

---

## 11. Explicitly Out of Scope for MVP v1

The following should not be built in v1 unless the core MVP is already complete:

- Payroll engine
- Shift scheduling
- Attendance and clock-in system
- Geofence polygon editor
- Automatic order assignment algorithm
- Route replay
- OSRM map matching
- Kalman filtering
- Inventory synchronization
- Customer checkout/cart
- Payment gateway integration
- Regional manager hierarchy
- Advanced RBAC permission editor
- Driver incentives and penalties
- Bank settlement exports
- Full telemetry anomaly detection

---

## 12. MVP Build Phases

### Phase 1: Foundation

- Initialize backend project.
- Set up PostgreSQL and Drizzle schema.
- Implement auth and roles.
- Implement stores, users, drivers, and orders CRUD.

### Phase 2: Admin Operations

- Build admin login.
- Build dashboard.
- Build stores page.
- Build delivery partners page.
- Build orders page.
- Add manual driver assignment.

### Phase 3: Delivery Partner App

- Build Flutter login.
- Build driver dashboard.
- Build assigned order detail.
- Add accept/reject flow.
- Add pickup and delivery status updates.

### Phase 4: Live Tracking

- Add location ping API.
- Add mobile background/foreground location sender during active delivery.
- Add admin live map.
- Add customer tracking page.

### Phase 5: Stabilization

- Add audit events.
- Add error handling and validation.
- Add seed data.
- Add basic tests.
- Prepare deployment scripts.

---

## 13. Suggested Development Order

1. Backend schema and API.
2. Admin web CRUD screens.
3. Manual order assignment.
4. Flutter delivery partner flow.
5. Location tracking.
6. Customer tracking link.
7. Testing and deployment.

---

## 14. MVP Risks

| Risk | Mitigation |
| :--- | :--- |
| Live tracking drains battery | Track only during active delivery in v1. |
| Mobile background location complexity | Start with foreground tracking, then improve. |
| Dispatch logic becomes too complex | Keep assignment manual in v1. |
| Customer app scope expands | Use tracking link first, not full commerce app. |
| Geospatial logic slows delivery | Use simple coordinates first, add PostGIS in v1.1. |

---

## 15. Post-MVP v1.1 Candidates

After MVP v1 is working, add:

1. Geofenced pickup/dropoff validation.
2. Basic shift scheduling.
3. FCM push notifications for driver assignment.
4. Route history view.
5. PostGIS store catchment zones.
6. Simple auto-assignment by nearest available driver.
7. Delivery proof photo upload.

---

## 16. Post-MVP v2 Candidates

MVP v2 can include the enterprise features from the full PRD:

- Payroll engine
- Attendance engine
- Driver shift bidding
- Route replay studio
- Telemetry anomaly detection
- OSRM map matching
- Inventory sync
- Customer ordering and checkout
- Advanced RBAC
- Regional operations hierarchy
- Bank settlement exports
