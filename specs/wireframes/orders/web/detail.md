# Wireframe Spec: Order Detail

## Route / Screen

```text
/orders/:id
```

## Purpose

Show the full details of a single order including customer info, delivery address (with map), current status, status timeline, assigned driver, and available actions.

## MVP Source

From `mvp-v1.md` Section 4.4 and 4.5:

- View order fields: status, customer, address, driver, timestamps.
- Assign/reassign driver.
- Mark order failed.

## Supported Roles

- Super Admin (full actions)
- Store Manager (own store, assign driver and mark failed)
- Dispatcher (all orders, assign driver and mark failed)

## Primary User Goal

Understand the current state of a specific order and take the next action — assign a driver, contact the customer, or mark it failed.

## Page Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  ← Orders / #ORD-5021                                         │
│             │                                                               │
│             │  Order #ORD-5021          ● In Transit   [Assign Driver]     │
│             │                                          [Mark Failed]       │
│             │                                                               │
│             │  ┌─────────────────────────┐  ┌───────────────────────────┐  │
│             │  │  Order Info             │  │  Delivery Map             │  │
│             │  │  Customer  Priya Sharma │  │  [Map showing store →     │  │
│             │  │  Phone     +91 9876..   │  │   customer address with   │  │
│             │  │  Store     Downtown Hub │  │   driver pin on route]    │  │
│             │  │  Payment   Prepaid      │  │                           │  │
│             │  │  Created   Today 10:22  │  └───────────────────────────┘  │
│             │  └─────────────────────────┘                                 │
│             │                                                               │
│             │  ┌─────────────────────────┐  ┌───────────────────────────┐  │
│             │  │  Assigned Driver        │  │  Status Timeline          │  │
│             │  │  [Avatar] Marcus W.     │  │  ✓ Created      10:20     │  │
│             │  │  ● Online               │  │  ✓ Assigned     10:22     │  │
│             │  │  Motorcycle MH01        │  │  ✓ Accepted     10:23     │  │
│             │  │  [View Profile]         │  │  ✓ Picked Up    10:35     │  │
│             │  │  [Reassign Driver]      │  │  ◎ In Transit   10:38     │  │
│             │  └─────────────────────────┘  │    Delivered    —         │  │
│             │                               └───────────────────────────┘  │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

## Fields Displayed

### Order Info Card

| Field | Data |
| :--- | :--- |
| Customer Name | `order.customer_name` |
| Customer Phone | `order.customer_phone` (via customers table) |
| Store | `store.name` |
| Payment Type | `order.payment_type` — Prepaid / COD badge |
| External Order ID | `order.external_order_id` |
| Created | `order.created_at` |
| Delivered | `order.delivered_at` or `—` |

### Delivery Map Card

- Map showing:
  - Store pin (origin) — blue square pin
  - Customer delivery address pin — red drop pin
  - Driver current position — green animated dot (if in transit)
  - Dashed line from driver to delivery address
  - Traveled Route (for `delivered` or `failed` orders) — solid `success.600` polyline showing the exact path the driver took based on location history pings.
- Map is read-only (no picker interaction — this is a view screen)
- Centred to fit store + customer coordinates in one view

### Assigned Driver Card

| Field | Data |
| :--- | :--- |
| Avatar | Initials |
| Name | `driver.name` |
| Status | `driver.status` badge |
| Vehicle | `driver.vehicle_type` + `driver.vehicle_number` |

If no driver is assigned yet, show:

```text
Icon: user-plus outline
Text: "No driver assigned yet"
CTA: [Assign Driver]
```

### Status Timeline & Audit Log Card

Tabbed interface for tracking operations:

#### Tab 1: Status Timeline (Default View)

Ordered visual list of primary statuses from the order lifecycle:

```text
✓  Created
✓  Assigned
✓  Accepted
✓  Picked Up
◎  In Transit  ← current
○  Delivered
```

Completed steps: checkmark, `neutral.950`, timestamp shown.
Current step: filled circle, `primary.600`, bold.
Upcoming steps: empty circle, `neutral.300`, no timestamp.

#### Tab 2: Audit Log

Tabular listing of all fine-grained events from the `order_events` table (includes system triggers, location dropouts, and dispatcher overrides). Columns:

| Timestamp | Event | Actor | Metadata |
| :--- | :--- | :--- | :--- |
| `event.created_at` | `event.event_type` | `user.name` (role) | JSON details |

Example:
- `10:20:00` | Ingestion | System | External Order ID matched: EXT-42
- `10:22:15` | Driver Assigned | Dispatcher Ali | Assigned to Marcus Williams (DRV-90)
- `10:23:05` | Offer Accepted | Driver Marcus | accepted from mobile
- `10:35:10` | Pickup Confirmed | Driver Marcus | geofence: 12m from Downtown Hub
- `10:38:20` | Telemetry Active | System | MQTT session opened, battery 84%
- `10:44:00` | Signal Lost | System | No ping received in 2 min (Out of Range)

Failed steps:

```text
✗  Failed — shown in error.600
```

## Actions

- **Edit Order** → `/orders/:id/edit` (Super Admin & Store Manager; only when status is `created`)
- **Assign Driver** → opens Assign Driver modal (if unassigned)
- **Reassign Driver** → opens Assign Driver modal (if already assigned)
- **Mark Failed** → triggers deactivation/failed confirmation modal → `POST /orders/:id/failed`
- **View Driver Profile** → `/delivery-partners/:id`

Action button visibility by status:

| Status | Edit Order | Assign/Reassign | Mark Failed |
| :--- | :---: | :---: | :---: |
| created | ✅ | ✅ Assign | ✅ |
| assigned | — | ✅ Reassign | ✅ |
| accepted | — | ✅ Reassign | ✅ |
| picked_up | — | — | ✅ |
| in_transit | — | — | ✅ |
| delivered | — | — | — |
| failed | — | — | — |

## States

Refer to [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md) for detailed styles of shared states.

### Loading State

Shows Card Skeletons for all four dashboard cards.

### No Driver Assigned State

Driver card shows the empty driver state with `[Assign Driver]` CTA.

### Error State

Renders the Inline Error Alert at the top of the content area.

## Component Checklist

- Breadcrumb
- Order number heading + status badge
- Edit Order button (Super Admin & Store Manager, created status only)
- Action buttons (role and status gated)
- Order info card
- Delivery map (read-only, view mode — not a picker)
- Assigned driver card
- Reassign driver button
- Status timeline
- Assign Driver modal trigger
- Mark Failed confirmation dialog (details in [modals.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/modals.md))

## API / Data Requirements

Reads:
- `GET /orders/:id`
- `GET /locations/orders/:orderId/latest` — driver position on map
- `GET /locations/orders/:orderId/history?downsample=true` — historical tracking route optimized to downsample coordinates (Douglas-Peucker Snapping or capping at 1 point per 30s) to minimize DB load.
- `GET /order_events?order_id=:id&page=:page&limit=:limit` — paginated audit trail timeline logs (default limit=50)

Writes:
- `POST /orders/:id/assign` (via modal)
- `POST /orders/:id/failed`

Required fields:
- All order fields
- `customer.name`, `customer.phone`
- `store.name`, `store.latitude`, `store.longitude`
- `driver.name`, `driver.status`, `driver.vehicle_type`, `driver.vehicle_number`
- `location.latitude`, `location.longitude`
- `order_events.*`

## Acceptance Criteria

- Order detail page loads all fields correctly.
- Map shows store pin, customer address pin, and driver pin (when in transit).
- Status timeline reflects all events in chronological order.
- Traveled Route overlay utilizes downsampled coordinates to minimize network latency and browser rendering overhead.
- Audit Log tab successfully paginates event history logs.
- Assign Driver button is shown when order has no driver.
- Reassign Driver button is shown when order already has a driver.
- Mark Failed is not available for delivered or already-failed orders.
- Mark Failed requires a confirmation dialog.
- Clicking View Profile navigates to the driver's profile page.

---

# Figma Screen Specification

## Figma Frames

```text
Orders / Detail / Desktop — 1440×1024
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
Main content: x=240, y=64, padding=32px
```

### Header Row

```text
Breadcrumb: x=272, y=96
Order heading: "Order #ORD-5021" — heading.32.bold, neutral.950, x=272, y=128
Status badge: alongside heading, y=136
Action buttons: right-aligned, x=1060, y=124, gap=12px
  Edit Order: size=120×40, fill=white, border=1px neutral.300, text=neutral.700, radius=radius.md (created status only)
  Mark Failed: size=144×40, fill=white, border=1px error.300, text=error.600, radius=radius.md
  Assign Driver / Reassign Driver: size=176×40, fill=primary.600, shadow=shadow.button.primary, radius=radius.md
```

### Top Row — Info + Map

```text
y=188, gap=24px

Order Info card:
  size=480×240
  fill=white, radius=radius.lg, shadow=shadow.card, padding=24px
  Key-value rows, gap=14px

Delivery Map card:
  size=600×240
  fill=white, radius=radius.lg, shadow=shadow.card
  overflow=hidden
  Map fills entire card (read-only, no picker)
  Store pin: blue square, 20×20
  Customer pin: primary.600 drop pin, 20×28
  Driver pin: success.600 animated dot, 16×16 + pulsing ring
```

### Bottom Row — Driver + Timeline

```text
y=452, gap=24px

Assigned Driver card:
  size=480×220
  fill=white, radius=radius.lg, shadow=shadow.card, padding=24px

Status Timeline card:
  size=600×220
  fill=white, radius=radius.lg, shadow=shadow.card, padding=24px
```

#### Timeline Visual Tokens

```text
Completed step icon: check-circle, 20×20, success.600
Current step icon: circle-dot, 20×20, primary.600
Upcoming step icon: circle, 20×20, neutral.300
Failed step icon: x-circle, 20×20, error.600

Connector line between steps: 2px, neutral.200, height=24px
Step label: body.16.medium, neutral.950
Timestamp: caption.14.regular, neutral.500, right-aligned
```
