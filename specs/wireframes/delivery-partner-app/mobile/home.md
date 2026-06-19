# Wireframe Spec: Delivery Partner Home Dashboard

## Screen

Delivery Partner App — Home Dashboard

## Purpose

The main screen after login. The driver can toggle their availability online/offline, see any assigned order, and access their profile.

## MVP Source

From `mvp-v1.md` Section 4.7:

1. Login.
2. Go online.
3. View assigned order.

## Supported Roles

- Delivery Partner

## Primary User Goal

Go online to start receiving orders, and see at a glance if an order has been assigned.

---

## Screen Layout — Offline State

```text
┌──────────────────────────────┐
│  Good morning, Marcus  👤    │
│  Offline (No Store Active)   │
│                              │
│  ┌────────────────────────┐  │
│  │    You are OFFLINE     │  │
│  │                        │  │
│  │   [Clock In to Store]  │  │  <- Navigates to Store Map / Clock-In Screen
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Today's Summary       │  │
│  │  Deliveries: 0         │  │
│  │  Earnings: $0.00       │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

## Screen Layout — Online, No Order

```text
┌──────────────────────────────┐
│  Good morning, Marcus  👤    │
│  🟢 Active: Downtown Hub     │  <- Clocked-in store indicator
│                              │
│  ┌────────────────────────┐  │
│  │    ● You are ONLINE    │  │
│  │                        │  │
│  │   [Clock Out]          │  │  <- Toggles back to offline
│  └────────────────────────┘  │
│                              │
│  Waiting for orders...       │
│  [animated pulse indicator]  │
│                              │
│  ┌────────────────────────┐  │
│  │  Today's Summary       │  │
│  │  Deliveries: 3         │  │
│  │  Earnings: $18.00      │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

## Screen Layout — Order Assigned

```text
┌──────────────────────────────┐
│  Good morning, Marcus  👤    │
│  🟢 Active: Downtown Hub     │
│                              │
│  ┌────────────────────────┐  │
│  │    ● You are ONLINE    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  📦 New Order!         │  │
│  │  #ORD-5021             │  │
│  │  Priya Sharma          │  │
│  │  ● Prepaid             │  │
│  │                        │  │
│  │  [View Order]          │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Today's Summary       │  │
│  │  Deliveries: 3         │  │
│  │  Earnings: $18.00      │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## Fields / Components

### Header

| Element | Data |
| :--- | :--- |
| Greeting | "Good morning/afternoon/evening, {driver.name}" |
| Store name | `store.name` |
| Profile icon | Tap → Profile screen |

### Status Card

- Large online/offline status indicator
- Toggle button: "Go Online" / "Go Offline"
- Confirmation prompt before going offline if an order is active

### Waiting Indicator

- Animated pulse ring shown when online and no order assigned
- Text: "Waiting for orders..."

### Assigned Order Card

- Shown when `driver` has an order in `assigned` status
- Displays: order ID, customer name, payment type badge
- Tap "View Order" → Order Detail screen

### Today's Summary Card

| Metric | Data |
| :--- | :--- |
| Deliveries | Count of orders delivered today by this driver |
| Earnings | Sum of earnings for the day (deferred — show $0.00 placeholder for MVP) |

---

## Actions

- **Clock In to Store** → navigates to Store Map & Geofenced Clock-In screen (`/clock-in`, see [clock-in.md](file:///Users/me/Projects/delivery_app/specs/wireframes/delivery-partner-app/mobile/clock-in.md))
- **Clock Out** → `POST /delivery-partners/:id/status { status: "offline" }`
  - If order is active: show confirmation dialog "You have an active order. Clocking out is not recommended. Continue?"
- **View Order** → navigate to Order Detail screen
- **Profile icon** → navigate to Profile screen

---

## Error States

### Status Toggle Failed

```text
"Unable to update your status. Please try again."
```

### Network Error

```text
Offline banner at top: "No internet connection."
```

---

## Loading States

- Clock Out button shows spinner while API call is in progress.
- Screen shows skeleton on first load.

---

## Component Checklist

- Header with greeting and active store hub indicator
- Profile icon button
- Status card with online/offline indicator
- Clock In to Store button (offline state)
- Clock Out button (online state)
- Waiting pulse indicator (online, no order)
- Assigned order card (when applicable)
- View Order button
- Today's summary card
- Network offline banner
- Confirmation dialog for clocking out during active order

---

## API / Data Requirements

Reads:
- `GET /auth/me` — driver identity and details
- `GET /orders?assigned_driver_id=:id&status=assigned` — pending order

Writes:
- `POST /delivery-partners/:id/status` — toggle online/offline

---

## Acceptance Criteria

- Driver lands on Home after successful OTP login in OFFLINE status.
- Tapping Clock In to Store navigates to the Store Map & Geofenced Clock-In Screen.
- Status card accurately reflects current `driver.status` (ONLINE when active at a store).
- Tapping Clock Out while an active order exists shows a confirmation prompt.
- Clocking out calls the status API with offline, clearing the active store assignment.
- Assigned order card appears when an order enters `assigned` status for this driver.
- Tapping View Order navigates to the Order Detail screen.
- Profile icon navigates to Profile screen.
- Today's deliveries count reflects completed orders for the current day.

---

# Figma Screen Specification

## Figma Frames

```text
Driver App / Home / Offline / Mobile — 390×844
Driver App / Home / Online No Order / Mobile — 390×844
Driver App / Home / Order Assigned / Mobile — 390×844
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Visual Composition

```text
Frame: 390×844, background=neutral.50, padding=0
Safe area top: 44px
Content padding: 24px
```

### Header Bar

```text
Height: 72px, fill=white, border-bottom=1px neutral.200
Padding horizontal: 24px

Greeting: "Good morning, Marcus" — body.16.medium, neutral.950, left
Store: "Downtown Hub" — caption.14.regular, neutral.500, below greeting

Profile button:
  right-aligned, 40×40, radius=radius.full
  Avatar: initials, fill=primary.100, text=primary.600
```

### Status Card

```text
x=24, y=136, size=342×120
fill=white, radius=radius.lg, shadow=shadow.card, padding=20px

Offline variant:
  Status dot: 12×12, neutral.400
  Status text: "You are Offline" — body.16.medium, neutral.700
  Button: "Go Online" — size=140×44, fill=primary.600, radius=radius.md

Online variant:
  Status dot: 12×12, success.600, animated pulse
  Status text: "You are Online" — body.16.medium, success.600
  Button: "Go Offline" — size=140×44, fill=white, border=1px neutral.300, radius=radius.md
```

### Waiting Pulse (online, no order)

```text
x=centered, y=300
Outer ring: 80×80, primary.50, animated expand+fade
Inner ring: 56×56, primary.100
Center dot: 32×32, primary.600
Text below: "Waiting for orders..." — caption.14.regular, neutral.500, y=400
```

### Assigned Order Card

```text
x=24, y=280, size=342×140
fill=white, radius=radius.lg, shadow=shadow.card, padding=20px
border-left: 4px primary.600

Header: "📦 New Order Assigned" — caption.14.medium, primary.600
Order ID: "#ORD-5021" — body.16.medium, neutral.950
Customer: "Priya Sharma" — body.16.regular, neutral.700
Payment badge: "Prepaid" — success or neutral badge, right-aligned

View Order button:
  y=offset inside card, size=302×44, fill=primary.600, radius=radius.md
```

### Today's Summary Card

```text
x=24, y bottom area, size=342×96
fill=white, radius=radius.lg, shadow=shadow.card, padding=20px

Two metrics side by side:
  Left: label "Deliveries" caption.14.regular neutral.500, value "3" heading.20.semibold neutral.950
  Right: label "Earnings" caption.14.regular neutral.500, value "$18.00" heading.20.semibold neutral.950
  Divider: 1px neutral.200 vertical, centered
```
