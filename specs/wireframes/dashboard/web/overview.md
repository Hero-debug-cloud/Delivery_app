# Wireframe Spec: Dashboard Overview

## Route / Screen

```text
/dashboard
```

## Purpose

Show a real-time operational summary for the logistics operation. Includes stat cards for key metrics and a live map showing active drivers and orders.

## MVP Source

From `mvp-v1.md` Section 5, Page 2:

- Cards: Active orders, Available drivers, Orders delivered today, Failed orders today.
- Map: Active delivery partners, Active orders.

## Supported Roles

- Super Admin
- Store Manager (scoped to their store)
- Dispatcher

## Primary User Goal

Quickly understand the health of the operation at a glance. Identify blocked orders, check driver availability, and locate active drivers on the map.

## Page Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo]  LogiRoute         Dashboard  Stores  Partners  Orders  Tracking    │
├──────────┬──────────────────────────────────────────────────────────────────┤
│          │                                                                  │
│  [Nav]   │  Good morning, Alex                    [Store: All ▼]            │
│          │                                                                  │
│  Dash    │  ┌────────────────┐ ┌────────────────┐ ┌────────────┐ ┌───────┐ │
│  Stores  │  │ Active Orders  │ │ Avail. Drivers │ │ Delivered  │ │ Failed│ │
│  Partners│  │      24        │ │      11        │ │  Today 87  │ │   3   │ │
│  Orders  │  └────────────────┘ └────────────────┘ └────────────┘ └───────┘ │
│  Tracking│                                                                  │
│          │  ┌──────────────────────────────────────────────────────────┐    │
│          │  │                                                          │    │
│          │  │               LIVE MAP                                  │    │
│          │  │   [driver pins]  [order pins]  [delivery lines]         │    │
│          │  │                                                          │    │
│          │  │                                                          │    │
│          │  │                                                          │    │
│          │  └──────────────────────────────────────────────────────────┘    │
│          │                                                                  │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

## Fields

### Stat Cards

| Card | Data Field | Color Treatment |
| :--- | :--- | :--- |
| Active Orders | Count of orders in `assigned`, `accepted`, `picked_up`, `in_transit` | `primary.600` icon |
| Available Drivers | Count of delivery partners with `status=online` | `success.600` icon |
| Delivered Today | Count of orders with `status=delivered` today | `success.600` icon |
| Failed Today | Count of orders with `status=failed` today | `error.600` icon |

### Live Map

- Pins for each online delivery partner (green dot)
- Pins for each active order delivery address (blue dot)
- Line connecting assigned driver to their order destination (dashed blue)
- Click driver pin → opens side panel with driver detail
- Click order pin → opens side panel with order detail

## Actions

- Select store filter (Super Admin and Dispatcher see all stores, Store Manager sees only their store)
- Click a driver pin → opens driver side panel
- Click an order pin → opens order side panel
- Navigate to full pages via sidebar

## States

### Loading State

```text
All four stat cards show skeleton loaders.
Map shows a neutral gray placeholder with spinner centered.
```

### Empty State

```text
All cards show zero values.
Map shows city view with message: "No active deliveries right now."
```

### Error State

```text
Cards show — with a refresh icon.
Map shows: "Unable to load live data. Tap to retry."
```

### Map Driver Side Panel (on click)

```text
┌───────────────────────────────┐
│  ← Back                      │
│  [Avatar]  Marcus W.          │
│  Status: ● Online             │
│  Vehicle: Motorcycle — MH 01  │
│  Store: Downtown Hub          │
│  Active Order: #ORD-4921      │
│  [View Order] [View Profile]  │
└───────────────────────────────┘
```

### Map Order Side Panel (on click)

```text
┌───────────────────────────────┐
│  ← Back                      │
│  Order #ORD-4921              │
│  Status: In Transit           │
│  Customer: Priya Sharma       │
│  Driver: Marcus W.            │
│  Store: Downtown Hub          │
│  [View Order Detail]          │
└───────────────────────────────┘
```

## Component Checklist

- Top navigation bar with role-aware links
- Sidebar navigation
- Store filter dropdown (Super Admin / Dispatcher only)
- Four stat cards
- Stat card icons
- Live map component (Google Maps or Mapbox)
- Driver map pin component
- Order map pin component
- Driver-to-order line overlay
- Driver side panel
- Order side panel

## API / Data Requirements

Reads:
- `GET /orders?status=assigned,accepted,picked_up,in_transit` → active order count and pins
- `GET /orders?status=delivered&date=today` → delivered today count
- `GET /orders?status=failed&date=today` → failed today count
- `GET /delivery-partners?status=online` → available driver count and map positions
- `GET /locations/drivers/:driverId/latest` → each active driver's current position

Required data fields:
- `order.id`
- `order.status`
- `order.customer_name`
- `order.delivery_latitude`
- `order.delivery_longitude`
- `order.assigned_driver_id`
- `driver.id`
- `driver.name`
- `driver.status`
- `driver.current_latitude`
- `driver.current_longitude`
- `driver.vehicle_type`
- `driver.vehicle_number`
- `driver.store_id`

## Acceptance Criteria

- Dashboard loads within 2 seconds on a standard connection.
- Stat cards display correct counts matching current order and driver states.
- Store Manager sees only data from their assigned store.
- Live map renders driver and order pins at correct coordinates.
- Clicking a driver pin opens the driver side panel with correct data.
- Clicking an order pin opens the order side panel with correct data.
- Map and cards refresh automatically or have a visible refresh control.
- Empty state is shown when there are no active deliveries.
- Error state is shown if API calls fail, with a retry option.

## Implementation Notes

- Use a polling interval of 10–15 seconds for live map updates in MVP.
- Map library: Google Maps or Mapbox as per `mvp-v1.md`.
- Dashboard is the default landing page after login.
- Super Admin and Dispatcher see all stores; Store Manager view is filtered server-side.

---

# Figma Screen Specification

## Figma Frames

```text
Dashboard / Overview / Desktop — 1440×1024
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Desktop Visual Composition

### Frame: `Dashboard / Overview / Desktop`

```text
Frame size: 1440×1024
Background: neutral.50 (#F8FAFC)
```

### Top Navigation Bar

```text
Position: x=0, y=0
Size: 1440×64
Fill: white
Border bottom: 1px neutral.200
Padding horizontal: 24px

Logo: x=24, y=12, size=40×40
Brand text: "LogiRoute" — body.16.medium, neutral.950, x=72, y=20
Nav links: right-aligned, gap=32px, body.16.medium, neutral.700
Active link: primary.600 with bottom border 2px primary.600
```

### Sidebar

```text
Position: x=0, y=64
Size: 240×960
Fill: white
Border right: 1px neutral.200
Padding: 16px

Nav item height: 44px
Active: fill primary.50, text primary.600, icon primary.600
Inactive: text neutral.600, icon neutral.400

Items:
  Dashboard (active)
  Stores
  Delivery Partners
  Orders
  Live Tracking
```

### Main Content Area

```text
Position: x=240, y=64
Size: 1200×960
Padding: 32px
```

### Page Header

```text
Greeting text: "Good morning, Alex"
  x=272, y=96
  type: heading.32.bold
  color: neutral.950

Store filter dropdown:
  x=1136, y=96
  size=200×40
  radius: radius.sm
  fill: white
  border: 1px neutral.300
  text: "All Stores ▾" — body.16.regular, neutral.700
```

### Stat Cards Row

```text
Position: x=272, y=160
Gap: 24px
Each card: size=265×120
```

#### Card 1 — Active Orders

```text
Fill: white
Radius: radius.lg (24px)
Shadow: shadow.card
Padding: 24px

Icon container: size=40×40, radius=radius.md, fill=primary.50
Icon: package, 20×20, color=primary.600

Label: "Active Orders" — caption.14.regular, neutral.500, y offset 0
Value: "24" — heading.32.bold, neutral.950, y offset 24
```

#### Card 2 — Available Drivers

```text
Icon: users, color=success.600, container fill=success.50
Label: "Available Drivers"
Value: "11"
```

#### Card 3 — Delivered Today

```text
Icon: check-circle, color=success.600, container fill=success.50
Label: "Delivered Today"
Value: "87"
```

#### Card 4 — Failed Today

```text
Icon: alert-circle, color=error.600, container fill=error.50
Label: "Failed Today"
Value: "3"
```

### Live Map

```text
Position: x=272, y=308
Size: 1136×640
Radius: radius.lg (24px)
Overflow: hidden
Border: 1px neutral.200
```

#### Map Overlay Header

```text
Position on map: x=16, y=16
Chip: "Live Map" — tiny.12.medium, neutral.700, fill=white, radius=radius.full, padding=8×16
```

#### Driver Pin Component

```text
Outer ring: 24×24, circle, fill=success.600, opacity=20%
Inner dot: 12×12, circle, fill=success.600
Tooltip on hover:
  "Marcus W. — In Transit"
  fill=neutral.900, opacity=90%, radius=radius.sm, padding=8×12
```

#### Order Pin Component

```text
Shape: map drop pin
Size: 20×28
Fill: primary.600
Center dot: 6×6 white
```

#### Driver-to-Order Line

```text
Stroke: primary.500
Width: 2px
Dash: 6 4
Opacity: 60%
```

#### Driver Side Panel (right overlay)

```text
Position: x=988, y=308 (inside map area or as right slide-in)
Size: 360×auto
Fill: white
Radius left: radius.lg
Shadow: shadow.card
Padding: 24px
```
