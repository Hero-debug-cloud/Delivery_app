# Wireframe Spec: Edit Order

## Route / Screen

```text
/orders/:id/edit
```

## Purpose

Allows Super Admins and Store Managers to edit an order's customer details, payment type, or re-pin the delivery address. 

> [!IMPORTANT]
> **Operational Status Gate:** Editing is restricted to orders in the `created` status. If an order has been assigned (`assigned`, `accepted`, `picked_up`, etc.), the Edit Order button is hidden and direct access to `/orders/:id/edit` redirects to `/orders/:id` with an Error Toast ("Cannot edit an order currently in progress").

## MVP Source

From `mvp-v1.md` Section 4.4 & Section 9:
- `PATCH /orders/:id` for modifying details.
- Address capture via map picker (same interaction pattern as `orders/web/create.md`).

## Supported Roles

- Super Admin (all stores)
- Store Manager (own store orders only)

## Primary User Goal

Quickly correct a customer address or contact number before dispatch begins, and lock in the updated coordinates on the map.

---

## Page Layout

Structured two-column layout: grouped form cards on the left, map picker card on the right.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  ← Orders / #ORD-5020 / Edit Order                            │
│             │                                                               │
│             │  ┌─────────────────────────┐  ┌───────────────────────────┐   │
│             │  │ 👤 Customer Details     │  │  📍 Delivery Location     │   │
│             │  │  ──────────────         │  │  ──────────────           │   │
│             │  │  Customer Name *        │  │                           │   │
│             │  │  [Ravi Teja           ] │  │   [Embedded Map]          │   │
│             │  │                         │  │                           │   │
│             │  │  Customer Phone *       │  │   [Search for address... ]│   │
│             │  │  [+91 9876543210      ] │  │                           │   │
│             │  └─────────────────────────┘  │      (Map Pin Drag)       │   │
│             │  ┌─────────────────────────┐  │                           │   │
│             │  │  💳 Billing & Origin    │  │   [✔ Location Confirmed!] │   │
│             │  │  ──────────────────     │  │   45 Park Ave, New York   │   │
│             │  │  Payment Type           │  └───────────────────────────┘   │
│             │  │  ● Prepaid   ○ COD      │                                  │
│             │  │                         │                                  │
│             │  │  Store Origin           │                                  │
│             │  │  [Downtown Hub       ▾] │                                  │
│             │  └─────────────────────────┘                                  │
│             │                                                               │
│             │                                [Cancel]  [Update Order]       │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Enhanced Component Breakdown

### Left Column: Form Details

1. **Breadcrumb:** `components/ui/breadcrumb`
   - Path: `Orders / #ORD-5020 / Edit Order`
2. **Customer Details Card:** `components/ui/card`
   - **CardHeader:** "Customer Details"
   - **CardContent:**
     - **Customer Name:** `components/ui/input` with pre-populated name.
     - **Customer Phone:** `components/ui/input` (type `tel`) with pre-populated number.
3. **Billing & Origin Card:** `components/ui/card`
   - **CardHeader:** "Billing & Origin"
   - **CardContent:**
     - **Payment Type:** Radio buttons: `Prepaid` / `COD` (pre-populated).
     - **Store Origin:** `components/ui/select` (disabled for Store Managers, active for Super Admins to transfer orders between hubs).

### Right Column: Location Picker Card

1. **Delivery Location Card:** `components/ui/card`
   - **CardHeader:** "Delivery Location"
   - **CardContent:** Embedded map component.
   - **Map State on Load:** Pre-centered on `order.delivery_latitude` and `order.delivery_longitude` with zoom=15 and the pin pre-placed. The confirm button shows a success Alert: "✔ Location Confirmed!" displaying the current address.
   - **Map Picker Interaction:** (Matches [create-edit-v2.md](file:///Users/me/Projects/delivery_app/specs/wireframes/stores/web/create-edit-v2.md) behavior). User drags pin or searches a new address -> click `[Confirm Location]` -> unlocks input form saving states.

### Page Actions

- **Cancel:** `components/ui/button` (variant: `outline`). Navigates back to `/orders/:id`.
- **Update Order:** `components/ui/button` (default).
  - Disabled during submission, text changes to "Updating...".
  - On Success: Redirects to `/orders/:id` and shows Toast ("Order updated successfully").

---

## Fields

| Field | Type | Required | Notes |
| :--- | :--- | :---: | :--- |
| Customer Name | text | Yes | Non-empty |
| Customer Phone | tel | Yes | Valid format |
| Payment Type | radio | Yes | Prepaid / COD |
| Store ID | select | Yes | Hub boundary |
| Delivery Address | text (read-only) | Yes | Auto-filled on map confirmation |
| Latitude / Longitude | hidden | Yes | Coordinates from confirmed map pin |

---

## Error & State Handlings

- **Validation Failure:** standard inline inputs highlighted in `error.600` with descriptive error text (e.g. "Customer phone is required").
- **Unauthorized Edit Attempt:** (Redirect state) If accessed for an active order:
  - User is immediately redirected to `/orders/:id`.
  - App triggers a floating `Error Toast` with message: "Cannot edit an order currently in progress."
- **Network / API Failures:** Calls inline `Error Alert` at the bottom of the form with a `[Retry]` action.

---

## API Requirements

### Reads (on Load)
- `GET /orders/:id` -> retrieve order fields and check `status === "created"`.

### Writes (on Submit)
- `PATCH /orders/:id`
  - Payload: `{ customer_name, customer_phone, payment_type, store_id, delivery_address, delivery_latitude, delivery_longitude }`

---

## Acceptance Criteria

- Form is pre-populated with current order data on load.
- If order status is NOT `created`, user is redirected to detail page and shown an Error Toast.
- Dropping a pin or searching an address updates the read-only address field after clicking "Confirm Location".
- Store Managers can edit details but cannot transfer the order to another store (the Store Origin dropdown is disabled).
- Clicking Update Order makes a patch request; on success, user redirects back to the order details page with a success Toast.
- Cancel abandons changes and returns to the details page.
- References global tokens (`colors.md`, `typography.md`, `spacing.md`) and shared layouts (`feedback-states.md`).
