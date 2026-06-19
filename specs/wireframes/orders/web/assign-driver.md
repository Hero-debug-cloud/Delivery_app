# Wireframe Spec: Assign Driver Modal

## Route / Screen

Modal overlay on `/orders/:id`

No dedicated URL — this is a dialog triggered from the order detail page.

## Purpose

Allow a dispatcher or manager to assign (or reassign) an online delivery partner to an order. Shows only currently online drivers, filtered to the order's store by default.

## MVP Source

From `mvp-v1.md` Section 4.5:

- Dispatcher manually assigns an order to an online delivery partner.
- Delivery partner receives assignment notification in the mobile app.
- If rejected, order returns to `created` state.

## Supported Roles

- Super Admin
- Store Manager
- Dispatcher

## Primary User Goal

Pick an available driver and confirm the assignment in one step.

## Modal Layout

```text
┌──────────────────────────────────────────────────────┐
│  Assign Driver                                    ✕  │
│  Order #ORD-5021 · Downtown Hub                      │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │ 🔍  Search drivers...                         │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ● Online drivers (4)                               │
│  ┌────────────────────────────────────────────────┐  │
│  │  [Av] Marcus W.   Motorcycle MH01  ● Online  ○ │  │
│  │  [Av] Sunita R.   Bicycle KA03     ● Online  ○ │  │
│  │  [Av] Ali K.      Motorcycle MH07  ● Online  ○ │  │
│  │  [Av] Neha P.     Car MH14         ● Online  ○ │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  No offline or busy drivers shown.                   │
│                                                      │
│              [Cancel]   [Confirm Assignment]         │
└──────────────────────────────────────────────────────┘
```

## Fields / Components

| Component | Behaviour |
| :--- | :--- |
| Modal title | "Assign Driver" |
| Modal subtitle | Order ID and store name |
| Search input | Filters driver list by name in real-time |
| Driver list | Shows only `status=online` partners from the order's store |
| Radio selection | Single-select — one driver per assignment |
| Driver row | Avatar, name, vehicle type + number, status badge |
| Confirm Assignment | Disabled until a driver is selected |
| Cancel | Closes modal, no change |

## Actions

### Confirm Assignment

```text
User selects a driver
  -> Confirm Assignment button becomes active
  -> User clicks Confirm
  -> call POST /orders/:id/assign { driver_id: selected_driver_id }
  -> on success:
       - close modal
       - order status updates to "assigned"
       - driver card on order detail updates
  -> on error: show error inside modal
```

### Cancel

Closes modal without making any changes.

## States

### Loading State

```text
Driver list shows 3 skeleton rows while fetching.
```

### Empty State (No online drivers)

```text
Icon: user-off outline
Text: "No drivers are currently online for this store."
Subtext: "Ask a driver to go online before assigning."
Confirm button: disabled
```

### Reassign Variant

When an order already has a driver:

```text
Modal title: "Reassign Driver"
Current driver row highlighted with a "Currently assigned" chip.
User must select a different driver to enable Confirm.
```

### Error State (API failure)

```text
"Unable to assign driver. Please try again."
[Retry]
```

## Component Checklist

- Modal overlay with close button
- Modal title + subtitle
- Search input
- Driver list with radio buttons
- Driver avatar (initials)
- Driver name, vehicle info, status badge
- "Currently assigned" chip (reassign variant)
- Confirm Assignment button (disabled until selection)
- Cancel button
- Loading skeleton
- Empty state
- Error alert inside modal

## API / Data Requirements

Reads:
- `GET /delivery-partners?status=online&store_id=:storeId` — online drivers for this store

Writes:
- `POST /orders/:id/assign` with `{ driver_id }`

Required fields:
- `driver.id`, `driver.name`, `driver.vehicle_type`, `driver.vehicle_number`, `driver.status`

## Acceptance Criteria

- Modal shows only online drivers assigned to the order's store.
- Confirm Assignment button is disabled until a driver is selected.
- Submitting calls `POST /orders/:id/assign` with the correct `driver_id`.
- On success, modal closes and order detail page reflects the new driver and `assigned` status.
- If no online drivers exist, an empty state is shown and Confirm is disabled.
- Cancel closes the modal with no state change.
- In reassign mode, the current driver is visually highlighted.

---

# Figma Screen Specification

## Figma Frames

```text
Orders / Assign Driver / Modal / Desktop — 1440×1024
Orders / Assign Driver / Empty / Desktop — 1440×1024
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Desktop Visual Composition

### Modal Overlay

```text
Background: neutral.950 / 50% opacity (scrim)
Modal card:
  Width: 560px
  Height: auto (min 400, max 680)
  Position: centered horizontally and vertically in frame
  Fill: white
  Radius: radius.lg (24px)
  Shadow: shadow.card
  Padding: 32px
```

### Modal Header

```text
Title: "Assign Driver" — heading.20.semibold, neutral.950
Subtitle: "Order #ORD-5021 · Downtown Hub" — caption.14.regular, neutral.500
Close button: x-icon, 24×24, neutral.400, top-right at x=504, y=32
Divider: 1px neutral.200, below header, margin-top=16px
```

### Search Input

```text
y=108 inside modal
size=496×40
leading icon: search, 16×16, neutral.400
placeholder: "Search drivers..."
```

### Section Label

```text
y=164
"● Online drivers (4)" — caption.14.medium, neutral.500
```

### Driver List

```text
y=192
Max height: 320px (scrollable)
Row height: 56px
Border-bottom: 1px neutral.100
Hover: neutral.50
Padding: 12px 0
```

#### Driver Row Content

```text
Radio input: 20×20, left-aligned
Avatar: 36×36, radius=radius.full, fill=primary.100, text=primary.600, initials
Name: body.16.medium, neutral.950
Vehicle: caption.14.regular, neutral.500
Status badge: "● Online" — success.600 badge, right-aligned
Gap: radio→avatar=12px, avatar→text=12px
```

#### Selected Driver Row

```text
Background: primary.50
Radio: filled, primary.600
Name: primary.600
Border: 1px primary.200
```

#### "Currently Assigned" Chip (reassign variant)

```text
Chip: "Currently assigned"
fill: warning.50, text: warning.500
radius: radius.full, padding: 2×8
type: tiny.12.medium
Position: after status badge, same row
```

### Action Row

```text
Position: bottom of modal, above padding end
Align: right, gap=16px

Cancel button:
  size=120×44, fill=white, border=1px neutral.300, radius=radius.md
  text: "Cancel" — body.16.medium, neutral.700

Confirm Assignment button:
  size=200×44, radius=radius.md

  Disabled state (no selection):
    fill=neutral.200, text=neutral.400
    text: "Confirm Assignment"

  Active state (driver selected):
    fill=primary.600, shadow=shadow.button.primary
    text: "Confirm Assignment" — body.16.medium, white

  Loading state (submitting):
    fill=primary.600, opacity=70%
    leading spinner 16×16
    text: "Assigning..."
```

### Empty State Variant

```text
Replace driver list with:
  Icon: user-x, 40×40, neutral.300, centered
  Text: "No drivers are online" — body.16.medium, neutral.700, centered
  Subtext: "Ask a driver to go online before assigning." — caption.14.regular, neutral.500

Confirm button stays disabled.
```
