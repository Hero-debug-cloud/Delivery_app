# Wireframe Spec: Create Order

## Route / Screen

```text
/orders/new
```

## Purpose

Allows Super Admins and Store Managers to manually create an order. Delivery address and coordinates are captured via the map picker — the user searches or drops a pin to set the location, exactly as in the store create flow.

## MVP Source

From `mvp-v1.md` Section 4.4:

- Manual order creation from admin panel.
- Order fields: external order ID, customer name, phone, delivery address, lat/lng, store ID, payment type.

## Supported Roles

- Super Admin
- Store Manager

## Primary User Goal

Enter order details, pick the delivery location on the map, and submit.

---

## Page Layout

Two-column layout: form fields on the left, embedded map picker on the right.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  ← Orders / New Order                                         │
│             │                                                               │
│             │  ┌─────────────────────────┐  ┌───────────────────────────┐  │
│             │  │  Order Details          │  │                           │  │
│             │  │                         │  │   [Embedded Map]          │  │
│             │  │  External Order ID      │  │                           │  │
│             │  │  ┌───────────────────┐  │  │   Search address...       │  │
│             │  │  └───────────────────┘  │  │   ┌───────────────────┐   │  │
│             │  │                         │  │   └───────────────────┘   │  │
│             │  │  Customer Name *        │  │                           │  │
│             │  │  ┌───────────────────┐  │  │     📍 Drop a pin to      │  │
│             │  │  └───────────────────┘  │  │        set delivery       │  │
│             │  │                         │  │        location           │  │
│             │  │  Customer Phone *       │  │                           │  │
│             │  │  ┌───────────────────┐  │  │    [Confirm Location]     │  │
│             │  │  └───────────────────┘  │  └───────────────────────────┘  │
│             │  │                         │                                 │
│             │  │  Store *                │                                 │
│             │  │  ┌───────────────────┐  │                                 │
│             │  │  │  Select store... ▾│  │                                 │
│             │  │  └───────────────────┘  │                                 │
│             │  │                         │                                 │
│             │  │  Delivery Address *     │                                 │
│             │  │  ┌───────────────────┐  │                                 │
│             │  │  │ 📍 [map-filled]   │  │                                 │
│             │  │  └───────────────────┘  │                                 │
│             │  │  [Pick on map →]        │                                 │
│             │  │                         │                                 │
│             │  │  Payment Type *         │                                 │
│             │  │  ● Prepaid  ○ COD        │                                 │
│             │  │                         │                                 │
│             │  │  [Cancel]  [Create Order]│                                │
│             │  └─────────────────────────┘                                 │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Location Picker Behaviour

Same pattern as the store create form:

```text
1. User types in the map search bar
     → autocomplete shows address suggestions
     → selecting a suggestion drops a delivery pin on the map

2. User can click anywhere on the map
     → delivery pin drops at that position
     → address is reverse-geocoded and shown in the pin label

3. "Confirm Location" button becomes active once a pin is placed
     → clicking it locks in delivery_address, delivery_latitude, delivery_longitude
     → Delivery Address field on the form updates to the resolved address

4. User can reposition the pin before saving; must re-confirm to update stored values
```

Coordinates are stored as hidden values in form state. They are never shown as raw editable inputs.

---

## Fields

| Field | Type | Required | Notes |
| :--- | :--- | :---: | :--- |
| External Order ID | text | No | Free text, max 64 chars. Auto-generated if blank. |
| Customer Name | text | Yes | Non-empty, max 100 chars |
| Customer Phone | tel | Yes | Valid phone format |
| Store | select | Yes | Populated from active stores |
| Delivery Address | read-only text (map-filled) | Yes | Resolved from map pin |
| Delivery Latitude | hidden | Yes | From map pin |
| Delivery Longitude | hidden | Yes | From map pin |
| Payment Type | radio | Yes | Prepaid (default) or COD |

---

## Actions

### Create Order

```text
User completes all required fields and confirms delivery location
  -> validate name, phone, store, location confirmed, payment type
  -> call POST /orders
  -> on success: redirect to /orders/:id (the new order)
  -> on error: show inline errors
```

### Cancel

Navigate back to `/orders`.

---

## Error States

### Delivery Location Not Confirmed

```text
Please pick a delivery location on the map before creating the order.
```

Shown below the Delivery Address field.

### Geocoding Failed

```text
Could not resolve address for this location. Try searching or choose a nearby point.
```

Shown inside the map panel.

### Validation Errors

```text
Customer name is required.
Customer phone is required.
Please select a store.
Please confirm the delivery location on the map.
```

### Server Error

```text
Unable to create order. Please try again.
```

---

## Loading States

- Store dropdown shows "Loading stores..." while fetching.
- "Confirm Location" shows spinner during reverse geocoding.
- Create Order button shows "Creating..." and is disabled during submission.

---

## Component Checklist

- Breadcrumb
- Two-column layout (form left, map right)
- External Order ID input
- Customer Name input
- Customer Phone input
- Store select dropdown
- Delivery Address read-only field (map-filled)
- "Pick on map" anchor link
- Embedded map component
- Map search bar with autocomplete
- Draggable delivery pin
- Reverse geocode label on pin
- Confirm Location button
- Payment Type radio group
- Cancel button
- Create Order button
- Inline validation messages
- Global error alert

---

## API / Data Requirements

Reads:
- `GET /stores?status=active` — populate store dropdown

External:
- Google Places Autocomplete or Mapbox Search — address search
- Reverse geocoding API — pin to address

Writes:
- `POST /orders`

Required payload fields:
- `external_order_id` (optional)
- `customer_name`
- `customer_phone`
- `store_id`
- `delivery_address`
- `delivery_latitude`
- `delivery_longitude`
- `payment_type`

Note: `status` defaults to `created`. `assigned_driver_id` is null at creation.

---

## Acceptance Criteria

- Required fields show validation errors on empty submit.
- User cannot submit without confirming a delivery pin on the map.
- Dropping a pin reverse-geocodes and populates the Delivery Address field.
- Confirming a location locks in address and coordinates in form state.
- Store dropdown only shows active stores.
- Store Manager can only select their own store (enforced client and server side).
- On successful create, user is redirected to the new order detail page.
- Cancel navigates back to the order list without saving.
- External Order ID field is optional; a system ID is generated if omitted.

---

# Figma Screen Specification

## Figma Frames

```text
Orders / Create / Desktop — 1440×1024
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
Inherits top nav (h=64) and sidebar (w=240).
```

### Breadcrumb: x=272, y=96

```text
"← Orders / New Order"
caption.14.regular, neutral.500 / neutral.700
```

### Two-Column Layout

```text
Left column (form card): x=272, y=132, width=520
Gap: 24px
Right column (map card): x=816, y=132, width=592
```

---

### Left — Form Card

```text
Size: 520×820
Fill: white, Radius: radius.lg (24px), Shadow: shadow.card, Padding: 40px
```

#### Form Content

```text
Section heading: "Order Details" — heading.20.semibold, neutral.950, y=172

External Order ID label: y=228, type: body.16.medium, neutral.700
External Order ID input: y=256, size=440×48
  placeholder: "e.g. EXT-00421 (optional)"

Customer Name label: y=328, input y=356, size=440×48
Customer Phone label: y=428, input y=456, size=440×48

Store label: y=528
Store select: y=556, size=440×48, placeholder: "Select store..."

Delivery Address label: y=628
Delivery Address field (read-only):
  y=656, size=440×56
  fill: neutral.100, border: 1px neutral.200, radius: radius.sm, padding: 12×16
  Leading icon: map-pin, 16×16, primary.600
  Empty text: "No delivery location set" — body.16.regular, neutral.400
  Filled text: resolved address — body.16.regular, neutral.950

"Pick on map" link:
  y=724, text: "Pick on map →"
  type: caption.14.medium, color: primary.600

Payment Type label: y=756, type: body.16.medium
Payment Type radios: y=784, gap=32px
  ● Prepaid   ○ COD

Action row: y=840, align=right, gap=16px
  Cancel: size=120×44, fill=white, border=1px neutral.300, radius=radius.md
  Create Order: size=176×44, fill=primary.600, shadow=shadow.button.primary, radius=radius.md
```

---

### Right — Map Card

Identical specification to `stores/web/create-edit.md` map card, with these differences:

```text
Size: 592×820 (taller to align with the order form card height)

Map search placeholder: "Search delivery address..."
Pin colour: primary.600 (same)
Confirm Location button text: "Confirm Delivery Location"
Empty state label: "Drop a pin or search to set the delivery location"
```

---

## Figma Variants to Create

```text
Orders / Create / No location (empty map)
Orders / Create / Pin dropped (geocoding)
Orders / Create / Location confirmed
Orders / Create / Validation error — location not confirmed
Orders / Create / Loading (submitting)
```

---

## Implementation Notes

- Reuse the same map picker component from the store create form.
- Pass a `mode="delivery"` or equivalent prop to distinguish pin icon and labels.
- On mobile, collapse to single column: form fields stack above the map.
- Map card height matches form card height on desktop; both scroll together on overflow.
