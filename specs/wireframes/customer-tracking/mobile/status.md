# Wireframe Spec: Customer Order Status

## Screen / Route

```text
/track/:trackingToken
```

## Purpose

Shows the customer their current order status, assigned driver info, and a status progress bar. No login required — accessed via the secure tracking link.

## MVP Source

From `mvp-v1.md` Section 4.8:

- Current order status.
- Assigned driver name and phone (optional).
- Estimated status text.
- Live driver position on map.

## Supported Roles

- Customer (public, no auth)

## Primary User Goal

Know where their order is right now.

---

## Screen Layout

```text
┌──────────────────────────────┐
│       LogiRoute              │
│                              │
│  Order #ORD-5021             │
│  Your order is on its way!   │
│                              │
│  ──●────────────────○─────   │
│  Created Assigned Picked  Delivered
│             ↑ In Transit     │
│                              │
│  ┌────────────────────────┐  │
│  │  🚴 Marcus Williams    │  │
│  │  Your delivery partner │  │
│  │  📞 +1 555-0091        │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  [View Live Map]       │  │
│  └────────────────────────┘  │
│                              │
│  Delivering to:              │
│  45 Park Ave, New York       │
│                              │
└──────────────────────────────┘
```

---

## Status Progress Bar

Shows the order lifecycle. Completed steps are filled. Current step is highlighted. Upcoming steps are empty.

```text
● Created → ● Assigned → ● Accepted → ● Picked Up → ◎ In Transit → ○ Delivered
```

Status label text shown below current step:

| Status | Shown Text |
| :--- | :--- |
| created | "Order confirmed" |
| assigned | "Driver assigned" |
| accepted | "Driver heading to store" |
| picked_up | "Order picked up" |
| in_transit | "Your order is on its way!" |
| delivered | "Delivered! Enjoy." |
| failed | "Delivery was unsuccessful. Please contact support." |

---

## Fields Displayed

| Field | Data |
| :--- | :--- |
| Order ID | `order.external_order_id` |
| Status text | mapped from `order.status` |
| Progress bar | `order.status` step |
| Driver name | `driver.name` |
| Driver phone | `user.phone` (optional per privacy settings) |
| Delivery address | `order.delivery_address` |

---

## Actions

- **View Live Map** → navigates to map screen (`/track/:token/location` or scroll down to map section)
- **Call Driver** → taps phone number to call (system phone dialler)

---

## States

### Loading State

Skeleton for status bar and driver card.

### No Driver Assigned Yet

```text
Driver card shows:
  "A driver will be assigned shortly."
```

### Delivered State

```text
Progress bar fully complete.
Driver card replaced with:
  "✅ Delivered successfully!"
"View Live Map" button hidden.
```

### Failed State

```text
"⚠️ Delivery was unsuccessful."
"Please contact the store for assistance."
```

### Polling / Refresh

Status screen polls every 15 seconds to refresh `order.status`.

---

## Component Checklist

- Brand header
- Order ID
- Status progress bar with step labels
- Status description text
- Driver info card (name, optional phone)
- View Live Map button
- Delivery address
- Loading skeleton
- No driver state
- Delivered success state
- Failed state

---

## API / Data Requirements

Reads (polled every 15s):
- `GET /track/:trackingToken` — order status, driver name, phone, delivery address

Required fields:
- `order.id`, `order.external_order_id`, `order.status`, `order.delivery_address`
- `driver.name`, `user.phone` (optional)

---

## Acceptance Criteria

- Customer can view their order status via the tracking link without logging in.
- Status progress bar reflects the current order status accurately.
- Driver name is shown once a driver is assigned.
- Driver phone is tappable to call (if provided).
- View Live Map button is shown when driver is in transit.
- Delivered state removes the map button and shows a success message.
- Failed state shows a clear message with contact guidance.
- Status refreshes automatically every 15 seconds.

---

# Figma Screen Specification

## Figma Frames

```text
Customer Tracking / Status / In Transit / Mobile — 390×844
Customer Tracking / Status / Delivered / Mobile — 390×844
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Visual Composition

```text
Frame: 390×844, background=neutral.50, padding=0
Content padding: 24px
```

### Brand Header

```text
Height: 56px, fill=white, border-bottom=1px neutral.200
Logo icon: 32×32, x=24
"LogiRoute" — body.16.medium, neutral.950, x=64
```

### Order Header

```text
y=80, x=24
Order ID: "#ORD-5021" — caption.14.regular, neutral.500
Status text: "Your order is on its way!" — heading.24.bold, neutral.950, y=108
```

### Progress Bar

```text
y=164, x=24, width=342

Steps: 6 circles connected by lines
Circle size: 16×16
Completed: fill=success.600, border=none
Current: fill=`theme.customer.primary.600`, ring=4px `theme.customer.primary.100`
Upcoming: fill=white, border=2px neutral.300

Connector line between circles:
  height=2px
  Completed segment: success.600
  Upcoming segment: neutral.200
  flex-grow to fill space

Step labels below circles:
  tiny.12.medium
  Completed: neutral.500
  Current: theme.customer.primary.600, bold
  Upcoming: neutral.300
```

### Driver Card

```text
x=24, y=252, size=342×96
fill=white, radius=radius.lg, shadow=shadow.card, padding=20px

Vehicle icon: 32×32, fill=theme.customer.primary.50, icon=bike, theme.customer.primary.600, radius=radius.md
Driver name: "Marcus Williams" — body.16.medium, neutral.950
Label: "Your delivery partner" — caption.14.regular, neutral.500
Phone (if provided): caption.14.medium, theme.customer.primary.600, right-aligned, tappable
```

### View Live Map Button

```text
x=24, y=364, size=342×52
fill=theme.customer.primary.600, shadow=shadow.button.customer, radius=radius.md
Icon: map 18×18, white
text: "View Live Map" — body.16.medium, white
```

### Delivery Address Block

```text
x=24, y=432
Label: "Delivering to" — caption.14.medium, neutral.500
Address: "45 Park Ave, New York" — body.16.regular, neutral.950
```

---

## Delivered Variant

```text
Status text: "Delivered! Enjoy." — heading.24.bold, neutral.950
Progress bar: all circles success.600

Driver card replaced with:
  size=342×80
  fill=success.50, border=1px success.600 (light), radius=radius.lg
  Icon: check-circle, 32×32, success.600
  Text: "Delivered successfully!" — body.16.medium, success.600

View Live Map button: hidden
```
