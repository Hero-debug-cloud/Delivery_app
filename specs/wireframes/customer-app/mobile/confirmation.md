# Wireframe Spec: Order Confirmation (Success)

## Screen

Customer App — Order Confirmation Screen

## Purpose

Provides a delightful, clear success state immediately after order placement. It presents the Order ID, estimated delivery time (ETA), a visual summary of items, and a prominent call-to-action to track the delivery live on the map.

## MVP Source

From `product.md` Section 6, Screen C1:
- Order confirmation screen showing placed status and link to live map tracking.

## Supported Roles

- Customer

## Primary User Goal

Confirm that their order and payment went through successfully, view the estimated time of arrival (ETA), and quickly launch the live map tracking view to watch their delivery partner's progress.

---

## Screen Layout

```text
┌──────────────────────────────┐
│            [✕]               │  <- Close / Home button (top-right)
│                              │
│       🎉 SUCCESS!            │  <- Celebration Header
│    Order Placed Details      │  <- heading.24.bold
│                              │
│     ⚡ Arriving in            │
│       10-15 Mins             │  <- Large ETA display
│                              │
│  ┌────────────────────────┐  │
│  │     [MAP PREVIEW]      │  │  <- Route preview block
│  │    🏪 (Store)          │  │
│  │     \                  │  │
│  │      \__               │  │
│  │         📍 (Home)      │  │
│  └────────────────────────┘  │
│                              │
│  Order Details               │  <- Section Header
│  ID: #ORD-5021               │
│  Deliver to: Home (45 Park)  │
│  Payment: Prepaid (Card)     │
│  Total: $4.48                │
│                              │
│  [ Track Order Live ]        │  <- Primary CTA (success green)
│                              │
│  [ Continue Shopping ]       │  <- Secondary CTA (neutral border)
└──────────────────────────────┘
```

---

## Component Checklist

### Close Button
- **Icon:** `✕` icon in the top-right corner.
- **Action:** Tapping returns the user to the Home storefront (`/home`), clearing any checkout-related stack history.

### Success Celebration Block
- **Success Graphic:** Large animated checkmark or party popper icon (size=64×64), fill=`success.600`.
- **Title:** "Order Confirmed!" or "Order Placed!" — `heading.24.bold`, `neutral.950`.
- **Subtitle:** "Your order #ORD-5021 has been sent to the store." — `caption.14.regular`, `neutral.500`.

### Speed ETA Display
- **Layout:** Size=342×80, fill=`success.50`, radius=`radius.md` (12px), border=1px `success.600` (light).
- **Label:** "⚡ Arriving in" — `caption.14.medium`, `success.600`.
- **Time Counter:** "10-15 Mins" — `heading.32.bold`, `success.600` (success green).

### Map Preview Card
- **Layout:** Size=342×160, radius=`radius.md` (12px), border=1px `neutral.200`, clipping enabled.
- **Content:**
  - Standard Leaflet or Mapbox static preview.
  - Pin 1: Store Hub icon (`🏪`), colored `theme.customer.primary.600`.
  - Pin 2: Customer destination icon (`📍`), colored `success.600`.
  - Path: Snapped road route line connecting Pins, colored `theme.customer.primary.500` (4px width).
  - Floating badge overlay: "Preparing order at store" — `tiny.12.medium`, fill=`white`, border=1px `neutral.200`.

### Order Details Summary
- **Section Heading:** "Order Details" — `heading.20.semibold`, `neutral.950`.
- **Text rows:** Gap=8px.
- **Fields:**
  - **Order ID:** `#ORD-5021` — `body.16.medium`, `neutral.950`.
  - **Delivery Address:** "Home (45 Park Ave, NY)" — `caption.14.regular`, `neutral.700`.
  - **Payment Method:** "Prepaid (Card)" or "Cash on Delivery" — `caption.14.regular`, `neutral.700`.
  - **Grand Total:** "$4.48" — `body.16.medium` (bold), `neutral.950`.

### Action Buttons

#### Primary CTA: Track Order Live
- **Size:** 342×52.
- **Fill:** `theme.customer.primary.600` (success green), radius=`radius.md` (12px), shadow=`shadow.button.customer`.
- **Text:** "Track Order Live" — `body.16.medium`, `white`.
- **Action:** Navigates directly to the live tracking view (`/track/:trackingToken`), using the secure tracking token returned by the order placement API.

#### Secondary CTA: Continue Shopping
- **Size:** 342×52.
- **Fill:** `white`, border=1px `neutral.300`, radius=`radius.md` (12px).
- **Text:** "Continue Shopping" — `body.16.medium`, `neutral.700`.
- **Action:** Navigates back to the Home storefront (`/home`).

---

## API Requirements

### Reads
- `GET /orders/:id`
  - Retrieves order status, items, address details, and the unique `tracking_token` generated for public customer status queries.

---

## Acceptance Criteria

- Displayed immediately upon successful order placement from Checkout.
- Displays the correct order details, matching the items and price verified during checkout.
- Renders the Map Preview centered, showing store hub position, destination pin, and route overlay.
- Clicking the `[Track Order Live]` button navigates the customer directly to the public live tracking page (`/track/:trackingToken`).
- Clicking `[Continue Shopping]` or the `✕` close button returns the user to the Home storefront.
