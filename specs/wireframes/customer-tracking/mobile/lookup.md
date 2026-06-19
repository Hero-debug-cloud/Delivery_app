# Wireframe Spec: Order Lookup

## Screen / Route

```text
/track
```

## Purpose

Fallback screen for customers who do not have a direct tracking link. They enter their phone number or order ID to find their order.

## MVP Source

From `mvp-v1.md` Section 4.8:

- Customer can view order status using a secure tracking link or app screen.

## Supported Roles

- Customer (no login required)

## Primary User Goal

Enter an identifier to find their active order and view tracking.

---

## Screen Layout

```text
┌──────────────────────────────┐
│                              │
│       [LogiRoute Icon]       │
│         LogiRoute            │
│      Track Your Order        │
│                              │
│   Enter your phone number    │
│   or order ID to track your  │
│   delivery.                  │
│                              │
│  ┌────────────────────────┐  │
│  │  Phone or Order ID     │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │      Track Order       │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

---

## Fields

| Field | Type | Required | Validation |
| :--- | :--- | :---: | :--- |
| Phone or Order ID | text | Yes | Non-empty |

---

## Actions

### Track Order

```text
User enters phone or order ID
  -> call GET /track/:token or a lookup endpoint
  -> on success: navigate to /track/:trackingToken (status screen)
  -> on not found: "No active order found for this phone or order ID."
```

---

## Error States

### No Order Found

```text
"We couldn't find an active order for that phone number or order ID."
```

### Network Error

```text
"Unable to look up your order. Please check your connection."
```

---

## Loading State

Track Order button shows "Looking up..." and disables during request.

---

## Acceptance Criteria

- Customer can enter a phone number or order ID to find their order.
- If found, they are taken to the order status screen.
- If not found, a clear error is shown.
- This page is publicly accessible with no login required.

---

# Figma Screen Specification

## Figma Frames

```text
Customer Tracking / Lookup / Mobile — 390×844
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Visual Composition

```text
Frame: 390×844, background=white, padding=24px
Content centered vertically in upper 60% of screen
```

### Brand Block

```text
App icon: 56×56, radius=radius.xl, fill=gradient.brand.dark, centered, y=160
Brand: "LogiRoute" — heading.24.bold, neutral.950, centered, y=232
Page title: "Track Your Order" — body.16.regular, neutral.500, centered, y=264
```

### Input

```text
Label: "Phone number or Order ID"
  x=24, y=340, body.16.medium, neutral.700
Input: x=24, y=368, size=342×48, radius=radius.sm
  placeholder: "+1 555 000 0000 or EXT-00421"
```

### Button

```text
x=24, y=440, size=342×52
fill=theme.customer.primary.600, shadow=shadow.button.customer, radius=radius.md
text: "Track Order" — body.16.medium, white

```
