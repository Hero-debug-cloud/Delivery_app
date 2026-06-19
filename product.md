# Product Requirement Document (PRD)
## LogiRoute — Enterprise Last-Mile Delivery & Operations Management Platform

---

## Table of Contents

1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Tech Stack](#2-tech-stack)
3. [Global Role-Based Access Control (RBAC)](#3-global-role-based-access-control-rbac)
4. [Module Functional Specifications](#4-module-functional-specifications)
5. [Admin Panel — Web Interface Specification](#5-admin-panel--web-interface-specification)
6. [Flutter App — Delivery Partner & Customer](#6-flutter-app--delivery-partner--customer)
7. [Operational Workflow Sequences](#7-operational-workflow-sequences)
8. [Technical Implementation & Non-Functional Requirements](#8-technical-implementation--non-functional-requirements)

---

## 1. Executive Summary & System Architecture

### 1.1 Project Overview

LogiRoute is an enterprise-grade, last-mile delivery and logistics management platform designed to orchestrate complex fulfillment networks. It bridges the gap between digital e-commerce storefronts, physical retail/warehousing stores, and a dynamic field workforce (delivery partners).

The platform consists of three core architectural pillars:

1. **E-Commerce Ingestion Layer** — An API/Webhook-driven integration engine that consumes orders from upstream platforms.
2. **Centralized Admin Control Panel** — A secure web application featuring multi-tenant store structures, fine-grained RBAC, algorithmic shift scheduling, automated payroll calculation, and high-fidelity real-time telemetric tracking with historical route replay.
3. **Delivery Partner & Customer Mobile App** — A single cross-platform Flutter application supporting two roles: Customer (order placement/tracking) and Delivery Partner (field operations, geofenced attendance, telemetry, navigation, delivery verification).

### 1.2 System Topology & Data Flow

```
[Upstream E-Commerce Platform]
          │
          ▼ (Webhook / REST)
[Hono API Gateway — Bun Runtime]
          │
    ┌─────┴──────┐
    ▼            ▼
[Order Engine]  [Telemetry Ingestion Service]
    │                     │
    ▼                     ▼
[PostgreSQL          [TimescaleDB]          [PostGIS]
 + Drizzle ORM]      (time-series          (spatial
 (core records)       telemetry)            queries)
    │
    ▼
[Redis — Ephemeral Geospatial Index]
    │
    ▼
[Admin Panel: Next.js]   [Flutter App: Customer + Delivery Partner]
```

**Key data flows:**

- Inbound orders hit the Hono webhook endpoint, trigger a PostGIS point-in-polygon check, and are assigned to the correct store instance.
- Driver telemetry packets stream via MQTT over WebSockets every 5–10 seconds into TimescaleDB for time-series storage and Redis for live position queries.
- Completed delivery paths are written to PostGIS as spatial linestrings, retained for 90 days for route replay and audit.

---

## 2. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Bun |
| **API Framework** | Hono |
| **ORM** | Drizzle ORM |
| **Primary Database** | PostgreSQL |
| **Time-Series Extension** | TimescaleDB (driver telemetry, event logs) |
| **Spatial Extension** | PostGIS (geofencing, PIP checks, route storage) |
| **Cache / Real-time Geo** | Redis (Geospatial keys, TTL-based ephemeral positions) |
| **Admin Frontend** | Next.js + Tailwind CSS + shadcn/ui |
| **Mobile App** | Flutter (single app — Customer role + Delivery Partner role) |
| **Routing Engine** | OSRM (map-matching, shortest path baseline) |
| **Push Notifications** | FCM (Firebase Cloud Messaging) |
| **Encryption** | TLS 1.3 (all client ↔ server communication) |

---

## 3. Global Role-Based Access Control (RBAC)

The system enforces a strict hierarchical security model. Every action, endpoint, and data boundary is governed by an assigned role. Permissions are additive and scoped by administrative level.

### 3.1 Role Definitions

| Role | Scope & Capabilities |
| :--- | :--- |
| **Super Admin** | Absolute read/write/delete across all modules, org configs, global financials, and developer settings. |
| **Regional Operations Manager** | Scoped to a geographic cluster of stores. Can provision stores, adjust regional fees, move drivers across stores, and audit regional metrics. |
| **Store Manager** | Scoped to a single store. Manages local inventory sync, order queues, driver re-assignments, clock-in verification, and shift approvals. |
| **Dispatcher / Live Ops Specialist** | Real-time monitoring only. Access to live tracking dashboard, dispatch maps, driver comms, and route adjustments. No financial access. |
| **HR & Payroll Admin** | Personnel records, compliance docs, attendance logs, pay structures, incentive/penalty configs, and bank settlement exports. |
| **Delivery Partner (Field Operator)** | Mobile app only. Own profile, assigned shifts, active order queue, navigation, personal metrics, and payout history. |
| **Customer** | Mobile app only. Order placement, live tracking of own orders, order history, and support. |

### 3.2 Permissions Matrix

| Module / Feature | Super Admin | Regional Mgr | Store Mgr | Dispatcher | HR/Payroll | Delivery Partner |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Global Settings & Billing | ✅ Write | ❌ | ❌ | ❌ | ❌ | ❌ |
| Store Creation & Config | ✅ Write | ✅ Write | 👁 Read | ❌ | ❌ | ❌ |
| Inventory & Product Sync | ✅ Write | ✅ Write | ✅ Write | 👁 Read | ❌ | ❌ |
| RBAC Profile Provisioning | ✅ Write | ✅ (≤ Mgr) | ❌ | ❌ | ❌ | ❌ |
| Shift Creation & Scheduling | ✅ Write | ✅ Write | ✅ Write | 👁 Read | 👁 Read | ❌ |
| Attendance Verification | ✅ Write | ✅ Write | ✅ Write | 👁 Read | ✅ Write | Self-log only |
| Order Manual Overrides | ✅ Write | ✅ Write | ✅ Write | ✅ Write | ❌ | ❌ |
| Real-time Map & Replay | ✅ Write | ✅ Write | ✅ Write | ✅ Write | ❌ | ❌ |
| Payroll Parameter Config | ✅ Write | ❌ | ❌ | ❌ | ✅ Write | ❌ |
| Payout Disbursement Approval | ✅ Write | ❌ | ❌ | ❌ | ✅ Write | ❌ |
| Profile & Active Order Ops | ✅ Write | 👁 Read | 👁 Read | 👁 Read | ❌ | ✅ Self |

---

## 4. Module Functional Specifications

### Module 1: Store & Geofencing Management

**Purpose:** Establishes physical boundaries for operations. Every order and delivery partner anchors to a specific store instance.

- **Geofence Definition:** Admins draw polygon delivery catchment zones on an interactive map editor. Stored as PostGIS geometry.
- **Order Catchment Engine:** Inbound orders carry lat/lng coordinates. The system runs a `ST_Contains` point-in-polygon check to assign the order to the correct store.
- **Driver Anchor Policy:** Drivers have a default home store but can be dynamically re-routed to adjacent stores based on shift schedules or surge volume.

---

### Module 2: Shift, Scheduling & Attendance Engine

**Purpose:** Manages driver capacity windows and feeds attendance logs directly into the payroll engine.

- **Shift Templates:** Repeating shift blocks (e.g., *Morning 06:00–14:00*, *Night 22:00–06:00*) with per-store driver capacity caps.
- **Driver Bidding / Assignment:** Store Managers can explicitly assign shifts, or publish them to an open pool for driver self-selection in the app.
- **Geofenced Clock-In:** Clock-In is blocked unless the driver's GPS is within 200m of the assigned store hub during their shift window.
- **Attendance Flags:** System auto-classifies entries as `Present`, `Late` (>15 min past start), `Absent` (no clock-in by shift midpoint), or `Left Early`.
- **Break Monitoring:** Explicit in-app break toggle freezes active order dispatching for that driver.

---

### Module 3: Order Ingestion & Algorithmic Dispatch

**Purpose:** Translates inbound e-commerce orders into optimized delivery tasks assigned to the right driver.

- **Webhook Ingestion:** Hono endpoint accepts a JSON payload containing order ID, line items, package dimensions/weight, delivery coordinates, customer contact, and payment type (Prepaid / COD).
- **Auto-Assignment Matching Engine:**
  1. Filter for `Present` + `Idle` drivers clocked into the originating store.
  2. Score drivers by available payload capacity, vehicle type, and proximity to the pickup bay.
  3. Batch orders with overlapping radial trajectories (max 3 orders per batch within a 1.5 km delta).
  4. Push the order offer to the selected driver via FCM. Driver has **60 seconds** to accept; timeout triggers fallback to the next candidate.
- **Manual Dispatch Console:** Dispatchers can drag and drop orders onto specific driver timelines via a live Gantt-style dashboard, overriding auto-assignment.

---

### Module 4: Real-Time Telemetry & Route Replay Engine

**Purpose:** Core observability engine — tracks live asset location and provides auditable proof of physical delivery passage.

- **Telemetry Ingestion:** Flutter app streams packets via MQTT over WebSockets every 5–10 seconds. Payload: `driver_id`, `order_id`, `lat/lng`, `bearing`, `speed`, `battery`, `network_type`, `timestamp`.
- **Adaptive Sampling:** Speed < 1 km/h for >2 min → interval drops to 60s. Speed > 5 km/h → interval returns to 5s.
- **Storage:** Live positions written to Redis `GEOADD` keys with 24h TTL. Historical coordinates written to TimescaleDB (time-series) and PostGIS (`ST_MakeLine` path linestrings).
- **Map Matching:** Raw GPS coordinates are processed through an OSRM map-matching call (with Kalman filter pre-processing) to snap points to actual road segments and eliminate urban canyon drift.
- **Route Replay:** Admin selects a completed order. The system reconstructs the full path and plays it as an animated avatar on a map, with a synchronized time-slider and speed/battery telemetry charts.
- **Anomaly Overlays:** Visual flags on the replay path for: idle > 5 min, speed limit breach, path deviation > 500m from OSRM baseline, signal loss.

---

### Module 5: Automated Payroll & Financial Settlement

**Purpose:** Converts raw attendance and delivery performance data into structured compensation — no spreadsheets required.

- **Pay Formula:**

  ```
  Total Payout = Base Shift Pay
               + Σ (Per-Order Base Rate + Distance Variable)
               + Surge / Night Bonus
               - Penalties
  ```

- **Distance Variable:** Actual GPS-traveled distance compared against the OSRM shortest path baseline.
- **Surge / Night Bonus:** Configurable multipliers applied during adverse weather alerts or defined late-night windows.
- **Penalties:** Auto-deducted for SLA breaches (e.g., grocery delivery > 20 min late without a system exception) or customer-reported damages.
- **Disbursement Cycle:** Weekly batch calculation. HR/Payroll Admin reviews statements on the Payroll Dashboard before exporting bank clearing files (CSV, or API push to Stripe Connect / RazorpayX).

---

## 5. Admin Panel — Web Interface Specification

Built with **Next.js + Tailwind CSS + shadcn/ui**. Optimized for density, rapid data filtering, and operational speed.

---

### Page 1: Global Live Monitoring Dashboard

The primary control room view.

**Components:**
- Full-bleed map (Mapbox / Google Maps) with toggleable layers: Active Drivers, Idle Drivers, Pending Orders, Store Radii.
- Right-hand collapsible live event stream: "Driver X accepted Order #3021", "Driver Y entered Geofence Area 2".
- Top KPI strip: Active Orders, On-Time Rate (%), Active Fleet Count, Avg Assignment Latency (s).

**Interactions:**
- Click a driver pin → floating card shows live speed, battery, current payload, and a direct phone link.

---

### Page 2: Store & Inventory Control Center

**Components:**
- Split-pane: store list with status toggles (left) / selected store config (right).
- Interactive polygon map editor for drawing and saving geofence boundaries.
- Product Sync Grid: `SKU ID` | `Product Name` | `E-com Stock` | `Local Buffer Stock` | `Sync Status`.

**Interactions:**
- "Trigger Manual Catalog Re-sync" forces an immediate upstream API sync.

---

### Page 3: Order Lifecycle Matrix

**Components:**
- Tabular view filterable by status: `Ingested` | `Assigned` | `In Transit` | `Delivered` | `Failed / Returned`.
- Columns: `Order ID` | `Source Store` | `Destination` | `Assigned Driver` | `Time Since Ingestion` | `SLA Ring (Green/Amber/Red)`.

**Interactions:**
- Action menu per row: re-assign driver, cancel task, or open a status history modal.

---

### Page 4: Route Replay & Telemetry Analytics Studio

**Components:**
- Search filters: Driver ID, Order ID, Date Range.
- Map viewport: solid blue line (travel), dashed red (signal dropout).
- Playback toolbar: Play / Pause / Speed (1×, 2×, 4×, 8×) / time-slider.
- Synchronized telemetry charts: speed, altitude, battery drain.
- Incident sidebar: indexed violations with timestamps (e.g., "Speed Limit Infraction at 14:22:10").

---

### Page 5: Driver Profiles & Shift Roster Manager

**Components:**
- Kanban-style weekly scheduling grid: columns = days, rows = drivers.
- Driver onboarding sub-page: personal identifiers, background check status, vehicle/license scans, digital contract.

**Interactions:**
- Drag-and-drop shift assignment. Right-click a shift card → clone template to future weeks.

---

### Page 6: Attendance Logs & Time-Card Verification

**Components:**
- Filterable by store and calendar week.
- Columns: `Driver` | `Shift Ref` | `Scheduled Start/End` | `Actual Clock-In` | `Geofence Deviation (m)` | `Total Hours` | `Approval Status`.

**Interactions:**
- Bulk-approve multiple time-cards simultaneously.

---

### Page 7: Payroll Processing & Financial Ledger

**Components:**
- Summary cards: Gross Total, Incentive Outlays, Deductions/Penalties, Net Payout.
- Line-item payout grid per driver showing each compensation component.

**Interactions:**
- "Generate Bank Settlement File" export modal.
- "Hold Payout" flag to quarantine earnings during an active audit.

---

### Page 8: RBAC & Permissions Engine

**Components:**
- Dual-column: roles list (left) / granular permission checklist grouped by domain (right).
- User Assignment Matrix: links admin accounts to roles and store scopes.

---

## 6. Flutter App — Delivery Partner & Customer

A **single Flutter application** with a role selector at authentication. Customers see the consumer flow; Delivery Partners see the operations flow. Optimized for high contrast, large touch targets, offline resiliency, and minimal battery draw.

---

### Authentication & Onboarding (Shared)

- Phone number input → OTP verification → biometric toggle (Face ID / Fingerprint).
- Role selection post-login: **Customer** or **Delivery Partner**.
- First-time setup for Delivery Partners: persistent location permission (`Always Allow`), camera check, background execution warning.

---

### Customer Screens

**Screen C1: Home & Order Placement**
- Browse product catalog synced from the e-commerce platform.
- Cart → checkout flow with address selection and payment method (Prepaid / COD).

**Screen C2: Live Order Tracking**
- Real-time map showing driver location, ETA, and current order state.
- Status timeline: `Confirmed → Picked Up → In Transit → Delivered`.

**Screen C3: Order History & Support**
- Past order list with drill-down receipts.
- Support ticket initiation per order.

---

### Delivery Partner Screens

**Screen D1: Main Dashboard & Shift Operations**
- Connectivity and GPS reliability banner.
- "Go Online" slide-to-unlock switch (prevents accidental toggling).
- Current/upcoming shift summary: hours logged, completed orders, earnings progress.
- Quick access: Emergency SOS, Store Manager chat.

**Screen D2: Order Offer (Modal Overlay)**
- Full-screen countdown timer on incoming order offer (60s).
- Map snippet: pickup + dropoff, distance, item count, guaranteed earnings.
- "Swipe to Accept" / "Decline" (requires reason selection).

**Screen D3: Active Task & Navigation Console**

Step-by-step workflow:

| Step | Action | Validation |
| :---: | :--- | :--- |
| 1 | Arrive at Store | Geofence confirmation |
| 2 | Scan Package Barcodes | Camera scanner → manifest check |
| 3 | Transit to Customer | Embedded nav (Google Maps / Mapbox SDK) |
| 4 | Delivery Verification | Signature / door photo / 4-digit customer PIN |

**Screen D4: Earnings Ledger & History**
- Graphical payout breakdown by day / week / month.
- Per-delivery drill-down: base rate, distance variable, bonuses, penalties.

**Screen D5: Attendance & Leave Management**
- Month-view calendar: green (on-time), amber (late), red (absent).
- Leave request form and vehicle downtime reporting.

---

## 7. Operational Workflow Sequences

### 7.1 Order Lifecycle

```
[Upstream E-Commerce Order Created]
          │
          ▼
[Hono Ingestion Webhook]
          │
          ▼
[PostGIS Point-in-Polygon Check] ──► Assigned to Store Instance
          │
          ▼
[State: Pending Assignment] ──► Matching Engine Executes
          │
          ├──► [Auto-Match: Driver Selected] ──► FCM Push Notification
          │              │
          │    ┌──────────┴──────────┐
          │    ▼                     ▼
          │ [Driver Accepts]   [Driver Rejects / 60s Timeout]
          │    │                     │
          │    ▼                     ▼
          │ [State: Assigned]   [Recycle → Next Candidate]
          │
          └──► [Manual Override by Dispatcher] ──► Driver Manually Selected
                         │
                         ▼
          [Driver En Route to Store]
                         │
                         ▼
          [Geofence Pick-Up Check] ──► Arrival Confirmed at Bay
                         │
                         ▼
          [Package Barcode Scan] ──► Manifest Validated & Checked Out
                         │
                         ▼
          [State: In Transit] ──► TimescaleDB + Redis Telemetry Active
                         │
                         ▼
          [Geofence Drop-Off Check] ──► Arrival Confirmed at Customer
                         │
                         ▼
          [Delivery Verification] ──► Signature / Photo / PIN
                         │
                         ▼
          [State: Delivered] ──► Payroll Ledger Update Triggered
```

---

### 7.2 Shift & Attendance Workflow

1. **Roster Creation** — Store Manager publishes weekly shift calendar on the Admin Panel.
2. **Driver Allocation** — Driver selects or is assigned a shift via the Flutter app.
3. **Clock-In:**

   ```
   Driver selects "Clock-In" → App fetches GPS
   
   IF distance(Driver_GPS, Store_Hub_GPS) ≤ 200m:
     → Record timestamp
     → Set status: Present or Late (based on schedule)
     → Start foreground telemetry service
     → Driver enters Active Matching Pool
   ELSE:
     → Hard block: "Must be within store perimeter to start shift"
   ```

4. **Active Window** — App broadcasts coordinate packets every 5–10s. If a driver exits the catchment zone without an active order, a dispatcher alert fires.

5. **Clock-Out:**

   ```
   Driver selects "Clock-Out"
   
   IF active_tasks == 0:
     → Stop telemetry service
     → Calculate time-card metrics
     → Push to payroll ledger
   ELSE:
     → Block clock-out until tasks are completed or manually reassigned by dispatcher
   ```

---

## 8. Technical Implementation & Non-Functional Requirements

### 8.1 Telemetry Streaming Protocol

Transport: **MQTT over WebSockets**

Payload format:

```json
{
  "t": 1781902930,
  "d_id": "DRV-908112",
  "o_id": "ORD-776152",
  "loc": [12.9716, 77.5946],
  "b": 184.5,
  "s": 32.4,
  "batt": 74,
  "net": "4G"
}
```

**Adaptive Sampling:**
- Speed = 0 km/h for > 2 min → interval extends to 60s
- Speed > 5 km/h → interval returns to 5s

---

### 8.2 Route Replay System

- **Retrieval:** Historical coordinates per order are pulled from PostGIS.
- **Map Matching:** Kalman filter pre-processing → OSRM map-matching to snap GPS drift onto actual road segments.
- **Timeline Sync:** Map playback cursor is linked directly to the speed/battery time-series charts, allowing auditors to correlate exact timestamps with spatial position.

---

### 8.3 Data Retention

| Layer | Storage | Retention |
| :--- | :--- | :--- |
| Live driver positions | Redis `GEOADD` (TTL) | 24 hours post-shift |
| Raw telemetry time-series | TimescaleDB | 90 days active, then cold archive |
| Spatial delivery paths | PostGIS (`ST_MakeLine`) | 90 days active, then data warehouse |

---

### 8.4 Security & Device Resiliency

- **Encryption:** TLS 1.3 enforced on all client ↔ server connections.
- **Offline Mode:** If network is unavailable, the Flutter app caches telemetry to an on-device SQLite database. On reconnect, cached records are uploaded chronologically to preserve the historical record.
- **Battery Guard:** Location tracking runs on an independent background isolate using a combined cell tower triangulation + hardware GPS strategy, capped at **≤ 4% battery drain per hour** during active tracking windows.
