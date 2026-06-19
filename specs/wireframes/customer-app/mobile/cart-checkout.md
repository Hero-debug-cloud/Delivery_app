# Wireframe Spec: Cart & Checkout

## Screen

Customer App — Cart & Checkout

## Purpose

Enables customers to review their cart items, verify their delivery address (ensuring it falls within the store's geofenced perimeter), review the bill receipt, select payment method, and place their order.

## MVP Source

From `product.md` Section 6, Screen C1:
- Cart -> checkout flow with address selection and payment method (Prepaid / COD).

## Supported Roles

- Customer (authentication required to check out)

## Primary User Goal

Review order items and total cost, choose payment, and complete order placement.

---

## Screen Layout

```text
┌──────────────────────────────┐
│  ← Checkout                  │  <- Back button + Header
│                              │
│  Delivery Address            │
│  ┌────────────────────────┐  │
│  │ 🏠 Home (In Range)     │  │  <- Geofenced address block
│  │ 45 Park Ave, NY        │  │
│  │ [ Change Address ]     │  │  <- Triggers map picker
│  └────────────────────────┘  │
│                              │
│  Items in Cart               │
│  ┌────────────────────────┐  │
│  │ Fresh Milk 1L   [- 1 +]│  │  <- Item row with counter
│  │ Brown Bread     [- 1 +]│  │
│  └────────────────────────┘  │
│                              │
│  Bill Details                │
│  Item Total         $4.48    │  <- Billing breakdown
│  Delivery Fee       $0.00    │
│  Grand Total        $4.48    │
│                              │
│  Payment Method              │
│  ● Prepaid (Card)  ○ COD     │  <- Payment selectors
│                              │
│  [ Pay & Place Order ]       │  <- Primary button (success green)
└──────────────────────────────┘
```

---

## Component Checklist

### Header Row
- **Back Button:** Navigates back to the storefront (or previous product detail).
- **Title:** "Checkout" — `heading.20.semibold`, `neutral.950`.

### Delivery Address Card
- **Label:** "Delivery Address" — `caption.14.medium`, `neutral.500`.
- **Details Card:** Size=342×100, fill=`white`, border=1px `neutral.200`, radius=`radius.md` (12px), padding=16px.
  - Icon: map-pin, color=`success.600`.
  - Address title: "Home" or "Work" — `body.16.medium`, `neutral.950`.
  - Proximity warning: If address is outside store geofence catchment zone, border changes to `error.300`, background to `error.50`, showing: "⚠️ Out of delivery zone. Please choose another location."
- **Change Button:** Taps → opens geofenced Map Picker selector.

### Cart Items List
- **Scroll Container:** Shows all items in cart.
- **Item Row:** Height=56px, gap=16px.
  - Product Title & Size: `caption.14.medium`, `neutral.950`.
  - Price subtotal: `body.16.regular`, `neutral.950`.
  - Counter Adjuster: small counter component `[- 1 +]`, size=80×32px. Decrementing to 0 removes the row instantly.

### Bill Details Card
- **Receipt items:** Item Total, Delivery Fee (Free above $99 threshold, otherwise flat $1.99), Handling Charge ($0.49).
- **Grand Total:** `body.16.medium` (bold), `neutral.950`.

### Payment Selection Group
- **Title:** "Payment Method" — `caption.14.medium`, `neutral.500`.
- **Selector Buttons:** Gap=16px, flex-row.
  - Option 1: Prepaid (Credits, Debit/Credit Card) — default.
  - Option 2: Cash on Delivery (COD).

### Pay & Place Order Button
- **Fixed footer button:** Size=342×52.
- **Fill:** `theme.customer.primary.600` (success green), radius=`radius.md` (12px), shadow=`shadow.button.customer`.
- **Text:** "Pay & Place Order · ${total}" (for Prepaid) or "Confirm COD Order · ${total}" (for COD).
- **States:**
- *Disabled state:* fill=`neutral.200`, text=`neutral.400` (if address is out of delivery zone).
- *Loading state:* spinner icon, text="Placing order...".

---

## API Requirements

### Reads
- `GET /cart` -> retrieves active cart items and price validations.
- `GET /users/addresses` -> retrieves customer saved addresses.

### Writes
- `POST /orders`
  - Payload: `{ customer_id, store_id, address_id, payment_type, cart_items: [...] }`
  - On Success: Clears cart, redirects to the [Order Confirmation](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/confirmation.md) screen.

---

## Acceptance Criteria

- Checkout requires authentication. If guest attempts checkout, triggers SMS OTP sheet first.
- Checks if delivery address is within the store geofence catchment area on load. If invalid, blocks order placement and highlights error state.
- Counter buttons in the cart list adjust quantity dynamically. Removing all items from cart redirects back to Home with an empty cart toast.
- Grand total updates immediately when items are added or removed.
- Selecting COD changes primary CTA button label to "Confirm COD Order".
- Placing the order calls the POST API. On success, redirects user to the [Order Confirmation](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/confirmation.md) screen.
