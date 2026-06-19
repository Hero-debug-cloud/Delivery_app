# Wireframe Spec: Live Tracking Map

## Route / Screen

```text
/tracking
```

## Purpose

Full-screen operational map showing all active delivery partners in real-time. Dispatchers click a driver pin to see their current order and status details in a side panel.

## MVP Source

From `mvp-v1.md` Section 4.6:

- Admin dashboard shows active delivery partner location on a map.
- Store latest live location in Redis or database.
- Telemetry: every 10s during active delivery, every 60s when online idle.

## Supported Roles

- Super Admin (all stores)
- Store Manager (own store)
- Dispatcher (all stores)

## Primary User Goal

See at a glance where every active driver is right now and quickly pull up their order details.

## Page Layout

The map occupies the full content area. Controls float over the map.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Top Nav]                                                                  │
├──────────┬──────────────────────────────────────────────────────────────────┤
│ [Sidebar]│                                                                  │
│          │   [Store filter ▼]    [Status filter ▼]     [↺ Live]            │
│          │                                                                  │
│          │         🟢    🟡          🟢                                     │
│          │                  🟢                                              │
│          │        [FULL SCREEN LIVE MAP]                                    │
│          │                                                                  │
│          │                          🟢  🟡                                 │
│          │                                                                  │
│          │   ┌──────────────────────────┐                                  │
│          │   │ Legend                   │                                  │
│          │   │ 🟢 Online  🟡 Busy  ○ Idle│                                 │
│          │   └──────────────────────────┘                                  │
└──────────┴──────────────────────────────────────────────────────────────────┘
```

### With Driver Side Panel Open

```text
┌──────────┬───────────────────────────────────────┬──────────────────────┐
│ [Sidebar]│                                       │  Marcus Williams     │
│          │                                       │  ● Online            │
│          │    [FULL SCREEN LIVE MAP]             │  Motorcycle MH01     │
│          │         ↑ selected driver pin         │  Downtown Hub        │
│          │                                       │  ─────────────────   │
│          │                                       │  Active Order        │
│          │                                       │  #ORD-5021           │
│          │                                       │  Priya Sharma        │
│          │                                       │  ● In Transit        │
│          │                                       │  [View Order]        │
│          │                                       │  [View Profile]      │
└──────────┴───────────────────────────────────────┴──────────────────────┘
```

## Fields / Components

### Map Layer

- Full-coverage map (Google Maps or Mapbox, street view)
- Driver pins for all active/online partners
- Pin colour by status:
  - Online + idle: `status.online` green
  - Online + active delivery (busy): `status.busy` amber
- Clicking a pin selects it (highlighted ring) and opens side panel
- Auto-refresh: new positions polled every 10–15 seconds

### Floating Controls

- Store filter dropdown (top-left over map)
- Status filter dropdown (top-left, beside store)
- Live indicator chip "↺ Live" — pulses green to show active polling

### Legend (bottom-left)

```text
● Online (idle)
● Busy (active delivery)
```

### Driver Side Panel (right, slides in)

| Field | Data |
| :--- | :--- |
| Avatar + Name | `driver.name` |
| Status badge | `driver.status` |
| Vehicle | `driver.vehicle_type + number` |
| Store | `store.name` |
| Active Order ID | `order.external_order_id` or "No active order" |
| Customer Name | `order.customer_name` |
| Order Status | `order.status` badge |
| View Order CTA | → `/orders/:id` |
| View Profile CTA | → `/delivery-partners/:id` |

## Actions

- **Click driver pin** → open side panel for that driver
- **Close side panel** → deselect pin, panel slides out
- **Store filter** → show only that store's drivers
- **Status filter** → All / Online / Busy
- **View Order** → navigate to order detail
- **View Profile** → navigate to driver profile

## States

### Loading State

```text
Map shows neutral tiles.
Spinner centered on map.
Floating controls skeleton.
```

### Empty State (no active drivers)

```text
Map shows city view.
Center overlay: "No active drivers right now."
```

### No Driver Selected

Side panel is hidden. Map fills full content area.

### Driver Side Panel — No Active Order

```text
"No active order assigned."
[View Profile]
```

### Error State

```text
Floating error chip: "Live data unavailable. Retrying..."
Map shows last known positions (stale indicator: grey tint on pins)
```

## Component Checklist

- Full-screen map component
- Driver pins (colour by status)
- Pin selection state (highlighted ring)
- Store filter dropdown (floating)
- Status filter dropdown (floating)
- Live indicator chip
- Map legend
- Driver side panel (slide-in)
- Driver avatar, name, status, vehicle, store
- Active order block in side panel
- View Order + View Profile buttons
- Polling refresh logic
- Stale data indicator

## API / Data Requirements

Reads (polled every 10–15s):
- `GET /delivery-partners?status=online,busy` — all active drivers
- `GET /locations/drivers/:driverId/latest` — current positions
- `GET /orders?status=assigned,accepted,picked_up,in_transit` — active order per driver

Required fields:
- `driver.id`, `driver.name`, `driver.status`, `driver.vehicle_type`, `driver.vehicle_number`, `driver.store_id`
- `location.latitude`, `location.longitude`, `location.recorded_at`
- `order.id`, `order.external_order_id`, `order.customer_name`, `order.status`

## Acceptance Criteria

- Map loads and shows all active drivers as pins.
- Pin colour reflects driver status accurately.
- Clicking a pin opens the side panel with correct driver and order data.
- Store Manager sees only their store's drivers.
- Store and status filters narrow the visible pins.
- Map auto-refreshes driver positions every 10–15 seconds.
- Live indicator shows last refresh time or pulses to indicate active polling.
- Stale/error state is shown if polling fails, not a blank map.
- Side panel closes when the user clicks the map background or the close button.
- View Order and View Profile links navigate correctly.

## Implementation Notes

- Use polling (HTTPS) for MVP. MQTT/WebSocket is deferred.
- Refresh interval: 10s for drivers with active orders, 60s for idle online drivers.
- Use `location.recorded_at` to detect stale positions (> 5 min = show grey pin).

---

# Figma Screen Specification

## Figma Frames

```text
Live Tracking / Map / Desktop — 1440×1024
Live Tracking / Map + Side Panel / Desktop — 1440×1024
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Desktop Visual Composition

### Frame: `Live Tracking / Map / Desktop`

```text
Frame size: 1440×1024
Top nav: h=64
Sidebar: w=240
Map area: x=240, y=64, size=1200×960
```

Map fills the entire content area with no extra padding. Controls float on top.

### Floating Controls Bar

```text
Position: x=264, y=88 (16px from map edges)
Gap: 12px

Store dropdown:
  size=200×40, fill=white/90% blur, radius=radius.sm, shadow=shadow.card
  text: "All Stores ▾"

Status dropdown:
  size=160×40, same styling
  text: "All Status ▾"

Live chip:
  size=88×32, fill=white/90%, radius=radius.full, shadow=shadow.card
  Leading dot: 8×8, success.600, animated pulse
  Text: "Live" — caption.14.medium, neutral.700
```

### Map Legend

```text
Position: x=264, y=960 (bottom-left, 16px from map bottom edge)
Size: 200×44
Fill: white/90% blur
Radius: radius.md
Shadow: shadow.card
Padding: 12×16

Items (horizontal, gap=16px):
  🟢 Online — caption.14.medium, neutral.700
  🟡 Busy — caption.14.medium, neutral.700
```

### Driver Pin Component

```text
Online (idle):
  Outer ring: 28×28, circle, success.600 / 20%
  Inner dot: 14×14, circle, fill=success.600
  Border: 2px white

Busy (active order):
  Outer ring: 28×28, warning.500 / 20%
  Inner dot: 14×14, warning.500
  Border: 2px white

Selected state:
  Outer ring expands to 36×36
  Border: 2px primary.600
  Drop shadow

Stale pin (> 5 min old location):
  Inner dot: neutral.400
  Outer ring: neutral.300
```

---

### Frame: `Live Tracking / Map + Side Panel / Desktop`

```text
Map area shrinks to: x=240, y=64, size=840×960
Side panel: x=1080, y=64, size=360×960
```

### Side Panel

```text
Position: x=1080, y=64
Size: 360×960
Fill: white
Border-left: 1px neutral.200
Padding: 24px
```

#### Panel Header

```text
Close button: x, 20×20, neutral.400, top-right
Avatar: 48×48, radius=radius.full, initials
Name: heading.20.semibold, neutral.950
Status badge: below name
Vehicle: caption.14.regular, neutral.500
Store: caption.14.regular, neutral.500
Divider: 1px neutral.200, margin-top=16px
```

#### Active Order Block

```text
Section label: "Active Order" — caption.14.medium, neutral.500
Order ID: body.16.medium, neutral.950
Customer: body.16.regular, neutral.700
Order status badge
Gap: 12px
```

#### CTA Buttons

```text
Gap: 12px

View Order:
  size=312×44, fill=primary.600, shadow=shadow.button.primary, radius=radius.md
  text: "View Order" — body.16.medium, white

View Profile:
  size=312×44, fill=white, border=1px neutral.300, radius=radius.md
  text: "View Profile" — body.16.medium, neutral.700
```
