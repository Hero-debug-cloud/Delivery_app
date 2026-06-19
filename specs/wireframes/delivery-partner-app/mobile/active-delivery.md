# Wireframe Spec: Active Delivery Screen

## Screen

Delivery Partner App — Active Delivery

## Purpose

Guides the driver through an active delivery. The screen shows a live navigation map, the current step in the delivery workflow, and action buttons to progress the order status. Location sharing is active on this screen.

## MVP Source

From `mvp-v1.md` Section 4.7:

5. Navigate to store.
6. Mark Picked Up.
7. Navigate to customer.
8. Mark Delivered.

## Supported Roles

- Delivery Partner

## Primary User Goal

Follow the delivery from store to customer, updating the status at each step.

---

## Delivery Sub-States

This screen covers two sub-states:

| Sub-state | Order Status | Next Action |
| :--- | :--- | :--- |
| Heading to store | `accepted` | Mark Picked Up |
| Heading to customer | `picked_up` | Mark Delivered |

---

## Screen Layout — Heading to Store (Accepted)

```text
┌──────────────────────────────┐
│  ← Cancel delivery           │
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │   [Navigation Map]     │  │
│  │   Store pin visible    │  │
│  │   Route highlighted    │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Step 1 of 2           │  │
│  │  Head to the store     │  │
│  │                        │  │
│  │  📍 Downtown Hub       │  │
│  │  12 Main St, New York  │  │
│  │                        │  │
│  │  [Navigate →]          │  │
│  │                        │  │
│  │  [Mark Picked Up]      │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## Screen Layout — Heading to Customer (Picked Up)

```text
┌──────────────────────────────┐
│  ← Cancel delivery           │
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │   [Navigation Map]     │  │
│  │   Customer pin visible │  │
│  │   Route highlighted    │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Step 2 of 2           │  │
│  │  Deliver to customer   │  │
│  │                        │  │
│  │  📍 Priya Sharma       │  │
│  │  45 Park Ave, NY       │  │
│  │  +91 9876 000 000      │  │
│  │                        │  │
│  │  [Navigate →]          │  │
│  │                        │  │
│  │  [Mark Delivered]      │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## Fields / Components

### Navigation Map

- Embedded map with route overlay
- Driver's real-time position shown (auto-updated)
- Destination pin: store (step 1) or customer address (step 2)
- Route drawn from driver to destination
- "Open in Maps" tappable shortcut (opens Google Maps or Apple Maps)

### Step Card (bottom sheet style)

| Element | Data |
| :--- | :--- |
| Step label | "Step 1 of 2" / "Step 2 of 2" |
| Step heading | "Head to the store" / "Deliver to customer" |
| Destination name | Store name or customer name |
| Destination address | Store address or delivery address |
| Phone (step 2 only) | Customer phone (tappable to call) |

### Action Buttons

- **Navigate →** → opens turn-by-turn directions in system maps app
- **Mark Picked Up** (step 1) → advances order to `picked_up`
- **Mark Delivered** (step 2) → navigates to Delivery Complete screen (PIN entry)

---

## Actions

### Mark Picked Up

```text
Driver taps Mark Picked Up
  -> confirmation: "Confirm you have picked up this order from the store?"
  -> [Cancel] [Confirm Pickup]
  -> call POST /orders/:id/picked-up
  -> on success: screen updates to Step 2 (heading to customer)
  -> start sending location pings every 10 seconds
```

### Mark Delivered

```text
Driver taps Mark Delivered
  -> navigate to Delivery Complete screen (PIN entry)
```

### Cancel Delivery (top back button)

```text
Tapping "← Cancel delivery"
  -> confirmation bottom sheet: "Are you sure? This will not automatically fail the order."
  -> [Stay] [Contact Dispatcher]
  -> Does NOT automatically change order status — driver contacts dispatcher
```

### Navigate

Opens system maps app with destination coordinates.

---

## Location Sharing Behaviour

```text
While this screen is active (order in accepted / picked_up / in_transit):
  -> send POST /locations/ping every 10 seconds
  -> payload: { latitude, longitude, speed, battery }
  -> continues in background (Flutter background location service)
```

---

## Error States

### Mark Picked Up Failed

```text
Toast: "Unable to update status. Please try again."
```

### Location Sharing Failed

```text
Non-blocking banner: "Location sharing paused. Check GPS settings."
```

---

## Loading States

Mark Picked Up / Mark Delivered buttons disable and show spinner during API call.

---

## Component Checklist

- Back / cancel header
- Embedded navigation map
- Route overlay
- Destination pin
- Open in Maps shortcut
- Step indicator (1 of 2 / 2 of 2)
- Step heading
- Destination name + address
- Customer phone link (step 2)
- Navigate button
- Mark Picked Up / Mark Delivered button
- Confirmation bottom sheet
- Location ping background service
- Error toast
- GPS warning banner

---

## API / Data Requirements

Reads:
- `GET /orders/:id` — order and address data

Writes:
- `POST /orders/:id/picked-up`
- `POST /locations/ping` every 10 seconds

---

## Acceptance Criteria

- Screen loads in `accepted` state showing store destination.
- Tapping Navigate opens system maps app to store coordinates.
- Mark Picked Up requires a confirmation bottom sheet.
- After pickup confirmed, screen transitions to step 2 showing customer destination.
- Tapping Navigate in step 2 opens system maps app to customer coordinates.
- Mark Delivered navigates to the Delivery Complete / PIN screen.
- Location pings are sent every 10 seconds while screen is active.
- GPS error banner appears if location permission is denied or GPS is unavailable.

---

# Figma Screen Specification

## Figma Frames

```text
Driver App / Active Delivery / Step 1 Store / Mobile — 390×844
Driver App / Active Delivery / Step 2 Customer / Mobile — 390×844
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Visual Composition

```text
Frame: 390×844, background=neutral.900 (map dark base), padding=0
```

### Navigation Bar (floating over map)

```text
Height: 56px, fill=neutral.900/80% blur
x=0, y=0 (safe area top)
Back/cancel text: "← Cancel delivery" — caption.14.medium, white, x=24
```

### Map Section

```text
Height: 480px (from y=0 to y=480)
Map fills full width
Route polyline: primary.500, 4px stroke
Destination pin: primary.600 drop pin
Driver position dot: white with primary.600 ring, animated
"Open in Maps" chip:
  Position: x=16, y=424 (over map bottom)
  size=140×32, fill=white/90%, radius=radius.full, shadow=shadow.card
  Icon: external-link 14×14, primary.600
  Text: "Open in Maps" — caption.14.medium, neutral.900
```

### Step Bottom Sheet

```text
Position: y=480, size=390×364
fill=white, radius top: radius.xl (32px)
Padding: 24px

Step indicator: "Step 1 of 2" — caption.14.medium, primary.600, y=504
Step heading: "Head to the store" — heading.24.bold, neutral.950, y=528

Destination block:
  Icon: map-pin 18×18 (primary.600 for store, error.600 for customer)
  Name: body.16.medium, neutral.950
  Address: caption.14.regular, neutral.500

Navigate button:
  size=342×44, fill=white, border=1px primary.200, radius=radius.md
  Icon: navigation 18×18, primary.600
  Text: "Navigate →" — body.16.medium, primary.600

Primary action button:
  size=342×52, fill=primary.600, shadow=shadow.button.primary, radius=radius.md
  Step 1 text: "Mark Picked Up" — body.16.medium, white
  Step 2 text: "Mark Delivered" — body.16.medium, white
```
