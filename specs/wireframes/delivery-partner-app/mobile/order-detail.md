# Wireframe Spec: Assigned Order Detail

## Screen

Delivery Partner App — Assigned Order Detail

## Purpose

Shows the full details of an order assigned to the delivery partner. The driver can accept or reject the order from this screen.

## MVP Source

From `mvp-v1.md` Section 4.7:

3. View assigned order.
4. Accept or reject order.
5. Navigate to store.

## Supported Roles

- Delivery Partner

## Primary User Goal

Review the order details and decide whether to accept or reject it.

---

## Screen Layout

```text
┌──────────────────────────────┐
│  ← Back       Order Detail  │
│                              │
│  #ORD-5021                   │
│  ● Assigned                  │
│                              │
│  ┌────────────────────────┐  │
│  │  Pickup                │  │
│  │  📍 Downtown Hub       │  │
│  │  12 Main St, New York  │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Deliver to            │  │
│  │  📍 Priya Sharma       │  │
│  │  45 Park Ave, NY       │  │
│  │  +91 9876 000 000      │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Order Info            │  │
│  │  Payment  Prepaid      │  │
│  │  Order ID #ORD-5021    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Reject    │  Accept   │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

---

## Fields Displayed

| Field | Data |
| :--- | :--- |
| Order ID | `order.external_order_id` |
| Status badge | `order.status` |
| Pickup address | `store.name` + `store.address` |
| Customer name | `order.customer_name` |
| Delivery address | `order.delivery_address` |
| Customer phone | `customer.phone` |
| Payment type | `order.payment_type` badge |

---

## Actions

### Accept Order

```text
Driver taps Accept
  -> call POST /orders/:id/accept
  -> on success: navigate to Active Delivery screen
  -> on error: show error toast
```

### Reject Order

```text
Driver taps Reject
  -> confirmation bottom sheet: "Reject this order? It will go back to the queue."
  -> [Cancel] [Reject Order]
  -> call POST /orders/:id/reject
  -> on success: navigate back to Home screen
  -> on error: show error toast
```

---

## Error States

### Accept / Reject Failed

```text
Toast: "Unable to process. Please try again."
```

---

## Loading States

- Accept and Reject buttons show spinner and disable while API call is in progress.

---

## Component Checklist

- Back navigation
- Order ID + status badge
- Pickup card (store name + address)
- Delivery card (customer name + address + phone)
- Order info card (payment type, order ID)
- Accept button
- Reject button
- Reject confirmation bottom sheet
- Error toast

---

## API / Data Requirements

Reads:
- `GET /orders/:id` — order details, store info, customer info

Writes:
- `POST /orders/:id/accept`
- `POST /orders/:id/reject`

---

## Acceptance Criteria

- Screen shows full order details when navigated to from the Home assigned order card.
- Accept navigates to the Active Delivery screen.
- Reject shows a confirmation bottom sheet before calling the API.
- Rejected order takes the driver back to Home in online/waiting state.
- Both buttons are disabled while the API call is pending.

---

# Figma Screen Specification

## Figma Frames

```text
Driver App / Order Detail / Assigned / Mobile — 390×844
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

### Navigation Bar

```text
Height: 56px, fill=white, border-bottom=1px neutral.200
Back icon: chevron-left, 24×24, neutral.700, x=24
Title: "Order Detail" — body.16.medium, neutral.950, centered
```

### Order Header

```text
y=80
Order ID: "#ORD-5021" — heading.24.bold, neutral.950, x=24
Status badge: "● Assigned" — primary.600, y=116
```

### Pickup Card

```text
x=24, y=148, size=342×88
fill=white, radius=radius.lg, shadow=shadow.card, padding=16px

Label: "Pickup" — caption.14.medium, neutral.500
Icon: map-pin, 16×16, primary.600
Store name: body.16.medium, neutral.950
Address: caption.14.regular, neutral.500
```

### Delivery Card

```text
x=24, y=252, size=342×104
fill=white, radius=radius.lg, shadow=shadow.card, padding=16px

Label: "Deliver to" — caption.14.medium, neutral.500
Icon: map-pin, 16×16, error.600
Customer name: body.16.medium, neutral.950
Address: caption.14.regular, neutral.500
Phone (tappable): caption.14.medium, primary.600
```

### Order Info Card

```text
x=24, y=372, size=342×72
fill=white, radius=radius.lg, shadow=shadow.card, padding=16px

Payment type: left — "Payment" caption.14.regular neutral.500 + "Prepaid" badge
Order ID: right — "Order ID" caption.14.regular neutral.500 + "#ORD-5021" body.16.medium neutral.950
Divider: 1px neutral.200 vertical
```

### Accept / Reject Button Row

```text
Position: fixed bottom, y=772 (above safe area)
x=24, size=342×56, fill=white, padding=8px 0

Reject button: size=159×44, fill=white, border=1px error.300, text=error.600, radius=radius.md
  text: "Reject" — body.16.medium
Gap: 12px

Accept button: size=159×44, fill=primary.600, shadow=shadow.button.primary, radius=radius.md
  text: "Accept" — body.16.medium, white
```

### Reject Confirmation Bottom Sheet

```text
Height: 240px, fill=white, radius top: radius.lg
Handle: 4×32, neutral.300, centered top

Title: "Reject this order?" — heading.20.semibold, neutral.950, x=24
Body: "This order will go back to the dispatch queue." — body.16.regular, neutral.500, x=24

Buttons:
  Cancel: size=145×44, fill=white, border=1px neutral.300
  Reject Order: size=145×44, fill=error.600, text=white
  Gap: 12px, x=24, y=176
```
