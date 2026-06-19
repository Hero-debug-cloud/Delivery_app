# Wireframe Spec: Customer Live Map View

## Screen / Route

```text
/track/:trackingToken  (map section or separate view)
```

## Purpose

Shows the customer a live map with the delivery partner's current position and the delivery destination. Read-only — the customer cannot interact with the map beyond panning and zooming.

## MVP Source

From `mvp-v1.md` Section 4.8:

- Live driver position on map.
- Order status.

## Supported Roles

- Customer (public, no auth)

## Primary User Goal

See exactly where the delivery partner is right now.

---

## Screen Layout

```text
┌──────────────────────────────┐
│  ← Back to status            │
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │                        │  │
│  │   [Live Map]           │  │
│  │   🟢 Driver pin        │  │
│  │   📍 Customer pin      │  │
│  │   --- dashed route     │  │
│  │                        │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Marcus is on the way  │  │
│  │  ● In Transit          │  │
│  │  Last updated: just now│  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

---

## Map Elements

| Element | Description |
| :--- | :--- |
| Driver pin | Green animated dot at `driver.current_latitude/longitude` |
| Customer pin | Primary drop pin at `order.delivery_latitude/longitude` |
| Dashed route line | From driver to customer destination |
| Map type | Standard street map (no satellite) |
| Zoom | Auto-fit to show both pins |
| Interaction | Pan and zoom allowed; no place search |

---

## Status Info Card (bottom)

| Field | Data |
| :--- | :--- |
| Heading | "{driver.name} is on the way" |
| Status badge | `order.status` |
| Last updated | Time since last location ping |

---

## States

### Loading State

```text
Map tiles loading: neutral.200 placeholder
Bottom card: skeleton
```

### No Location Available

```text
Map shows destination pin only.
Bottom card: "Driver location is not available yet."
```

### Driver Arrived / Delivered

```text
Bottom card: "Delivered! ✅"
Driver pin removed.
```

### Stale Location (> 3 min since last ping)

```text
Driver pin: grey tint
Bottom card note: "Location may be delayed."
```

### Error State

```text
"Unable to load live location. Tap to retry."
```

---

## Polling

Map view polls `GET /track/:trackingToken/location` every 10 seconds.

---

## Component Checklist

- Back to status link
- Full-screen map
- Driver animated pin
- Customer destination pin
- Dashed driver-to-customer route line
- Auto-fit zoom to both pins
- Status info card (bottom)
- Driver name + status badge
- Last updated timestamp
- Stale location indicator
- No location state
- Delivered state
- Error / retry state

---

## API / Data Requirements

Reads (polled every 10s):
- `GET /track/:trackingToken/location` — driver lat/lng, order status, last_location_at

Required fields:
- `driver.name`
- `order.status`
- `location.latitude`
- `location.longitude`
- `location.recorded_at`
- `order.delivery_latitude`
- `order.delivery_longitude`

---

## Acceptance Criteria

- Map loads with driver pin and customer destination pin.
- Both pins are visible on screen (auto-fit zoom).
- Driver pin updates every 10 seconds.
- If no location is available, a message is shown and the destination pin is still visible.
- Stale location (> 3 min) shows a visual indicator.
- Delivered state removes driver pin and shows completion message.
- Back to status navigates back to the order status screen.

---

# Figma Screen Specification

## Figma Frames

```text
Customer Tracking / Live Map / Mobile — 390×844
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Visual Composition

```text
Frame: 390×844, background=neutral.900, padding=0
```

### Navigation Bar (floating)

```text
x=0, y=0, height=56px
fill=neutral.900/80%, backdrop-blur
"← Back to status" — caption.14.medium, white, x=24
```

### Map Section

```text
Full frame: 390×844
Map fills entire screen (edge to edge)
Standard street map style
```

### Driver Pin

```text
Outer ring: 32×32, success.600 / 25%, animated pulse
Inner dot: 16×16, fill=success.600, border=2px white
```

### Customer Destination Pin

```text
Drop pin icon: 20×28, fill=theme.customer.primary.600
White dot center: 6×6
```

### Driver-to-Customer Route

```text
Stroke: theme.customer.primary.500, 2px, dash=8 6, opacity=70%
```

### Status Info Card (bottom sheet)

```text
Position: x=0, y=668 (floating over map, bottom)
Size: 390×176
fill=white, border-radius top: radius.xl (32px)
Padding: 24px

Driver heading: "{name} is on the way" — body.16.medium, neutral.950
Status badge: below heading
Last updated: "Updated just now" — caption.14.regular, neutral.500, right-aligned

Divider: 1px neutral.100
```

### "Last Updated" Chip (over map, bottom-left corner of map)

```text
Position: x=16, y=636
Size: auto×28, fill=neutral.900/70%, radius=radius.full
Padding: 6×12
Text: "● Live" or "Updated 2m ago" — tiny.12.medium, white
```
