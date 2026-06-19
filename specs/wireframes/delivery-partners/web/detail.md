# Wireframe Spec: Delivery Partner Detail

## Route / Screen

```text
/delivery-partners/:id
```

## Purpose

Show the full profile of a delivery partner including their personal info, vehicle details, assigned store, current status, and recent order history.

## MVP Source

From `mvp-v1.md` Section 4.3:

- View partner profile, store assignment, vehicle details, and availability status.

## Supported Roles

- Super Admin (full actions)
- Store Manager (own store partners, read-only)
- Dispatcher (read-only)

## Primary User Goal

Review a driver's current status and recent activity before assigning them an order.

## Page Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  ← Delivery Partners / Marcus W.                              │
│             │                                                               │
│             │  [Avatar]  Marcus Williams          ● Online   [Edit]        │
│             │                                                               │
│             │  ┌──────────────────────────────┐  ┌──────────────────────┐  │
│             │  │  Profile Info                │  │  Current Location    │  │
│             │  │  Phone     +1 555-0091       │  │  [Mini Map]          │  │
│             │  │  Email     marcus@email.com   │  │  Last seen 2 min ago │  │
│             │  │  Store     Downtown Hub       │  └──────────────────────┘  │
│             │  │  Vehicle   Motorcycle MH01    │                            │
│             │  └──────────────────────────────┘                            │
│             │                                                               │
│             │  Recent Orders (last 30 days)                                 │
│             │  ┌──────────────────────────────────────────────────────┐    │
│             │  │ Order ID    Customer      Status       Date      ⋮   │    │
│             │  │ #ORD-4921   Priya S.      Delivered    Today     →   │    │
│             │  │ #ORD-4850   Ravi T.       Failed       Yesterday →   │    │
│             │  └──────────────────────────────────────────────────────┘    │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

## Fields Displayed

### Profile Header

| Field | Data |
| :--- | :--- |
| Avatar | Initials-based avatar |
| Name | `driver.name` |
| Status badge | `driver.status` |

### Profile Info Card

| Field | Data |
| :--- | :--- |
| Phone | `driver.phone` (via `users.phone`) |
| Email | `driver.email` (via `users.email`) |
| Store | `store.name` |
| Vehicle | `driver.vehicle_type` + `driver.vehicle_number` |

### Current Location Card

- Mini map centred on `driver.current_latitude` / `driver.current_longitude`
- "Last seen X min ago" using `driver.last_location_at`
- If driver is offline: "Location unavailable"

### Recent Orders Table

| Column | Data |
| :--- | :--- |
| Order ID | `order.external_order_id` |
| Customer | `order.customer_name` |
| Status | `order.status` badge |
| Date | `order.delivered_at` or `order.created_at` |
| Actions | View → `/orders/:id` |

## Actions

- **Edit** → `/delivery-partners/:id/edit` (Super Admin / Store Manager)
- **View Order** → `/orders/:id`

## States

Refer to [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md) for detailed visual layouts of shared states.

### Loading State

Shows pulsing Card Skeletons for Profile Info and Current Location mini map, and 3 Skeleton rows for recent orders table.

### Location Unavailable State

```text
Mini map replaced with:
  Icon: map-pin-off, neutral.300
  Text: "Location unavailable"
  Subtext: "Driver is offline or has not sent a location yet."
```

### Empty Orders State

Shows "No orders in the last 30 days." inside the table container.

### Error State

Renders the Inline Error Alert at the top of the content area.

## Component Checklist

- Breadcrumb
- Avatar (initials-based)
- Name heading + status badge
- Edit button (role-gated)
- Profile info card (key-value)
- Current location mini-map card
- Last seen timestamp
- Recent orders table
- Order status badges
- View order row action
- Recent orders pagination controls (see [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md))

## API / Data Requirements

Reads:
- `GET /delivery-partners/:id`
- `GET /locations/drivers/:driverId/latest`
- `GET /orders?assigned_driver_id=:id&page=:page&limit=:limit` — paginated driver orders (default limit=10)

Required fields:
- `driver.*`, `user.phone`, `user.email`, `store.name`
- `location.latitude`, `location.longitude`, `location.recorded_at`
- `order.id`, `order.external_order_id`, `order.customer_name`, `order.status`, `order.delivered_at`

## Acceptance Criteria

- Partner detail page loads all profile fields.
- Mini map shows driver's last known location with timestamp.
- Offline or no-location state is handled gracefully.
- Recent orders table shows paginated order list. Tapping page numbers refetches active page.
- Edit button is hidden from Dispatcher.
- Clicking an order row navigates to the order detail page.

---

# Figma Screen Specification

## Figma Frames

```text
Delivery Partners / Detail / Desktop — 1440×1024
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Desktop Visual Composition

```text
Frame size: 1440×1024
Background: neutral.50
Inherits top nav and sidebar.
```

### Profile Header Row

```text
x=272, y=96, gap=16px

Avatar: size=56×56, radius=radius.full, fill=primary.100, text=primary.600, initials
Name: heading.32.bold, neutral.950
Status badge: same tokens as list page
Edit button: x=1232, y=100, size=120×40, fill=white, border=1px neutral.300
```

### Info + Map Row

```text
y=184, gap=24px

Profile Info card: size=480×168, fill=white, radius=radius.lg, shadow=shadow.card, padding=24px
  Key-value rows, gap=14px, key=caption.14.medium neutral.500, value=body.16.regular neutral.950

Location card: size=600×168, fill=white, radius=radius.lg, shadow=shadow.card, overflow=hidden
  Mini map fills upper 120px
  Footer strip: height=48, padding=16px, text="Last seen 2 min ago" caption.14.regular neutral.500
```

### Recent Orders Table

```text
x=272, y=380, width=1136
fill=white, radius=radius.lg, shadow=shadow.card

Header: height=48, fill=neutral.50
Rows: height=56

Columns:
  Order ID: 160px
  Customer: 240px
  Status: 160px
  Date: 180px
  Actions: 80px
```
