# Wireframe Spec: Create / Edit Delivery Partner

## Route / Screen

```text
/delivery-partners/new
/delivery-partners/:id/edit
```

## Purpose

Allows Super Admins and Store Managers to create a new delivery partner profile or edit an existing one.

## MVP Source

From `mvp-v1.md` Section 4.3:

- Create delivery partner profile.
- Assign partner to a store.
- Store vehicle type and number.
- Track availability status.

## Supported Roles

- Super Admin (all stores)
- Store Manager (own store only)

## Primary User Goal

Register a new driver with their basic details and vehicle info, then assign them to a store.

## Page Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  ← Delivery Partners / New Partner                            │
│             │                                                               │
│             │  ┌──────────────────────────────────────────────────────┐    │
│             │  │  Partner Details                                      │    │
│             │  │                                                       │    │
│             │  │  Full Name *           Phone Number *                 │    │
│             │  │  ┌───────────────┐     ┌────────────────────────┐   │    │
│             │  │  └───────────────┘     └────────────────────────┘   │    │
│             │  │                                                       │    │
│             │  │  Email                                                │    │
│             │  │  ┌────────────────────────────────────────────────┐  │    │
│             │  │  └────────────────────────────────────────────────┘  │    │
│             │  │                                                       │    │
│             │  │  Assigned Store *                                     │    │
│             │  │  ┌────────────────────────────────────────────────┐  │    │
│             │  │  │  Select store...  ▾                            │  │    │
│             │  │  └────────────────────────────────────────────────┘  │    │
│             │  │                                                       │    │
│             │  │  Vehicle Type *         Vehicle Number *             │    │
│             │  │  ┌───────────────┐     ┌────────────────────────┐   │    │
│             │  │  │ Motorcycle ▾  │     └────────────────────────┘   │    │
│             │  │  └───────────────┘                                   │    │
│             │  │                                                       │    │
│             │  │              [Cancel]   [Save Partner]               │    │
│             │  └──────────────────────────────────────────────────────┘    │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

## Fields

| Field | Type | Required | Validation |
| :--- | :--- | :---: | :--- |
| Full Name | text | Yes | Non-empty, max 100 chars |
| Phone Number | tel | Yes | Valid phone format |
| Email | email | No | Valid email format if provided |
| Assigned Store | select | Yes | Must select from available stores |
| Vehicle Type | select | Yes | Motorcycle / Bicycle / Car / Van |
| Vehicle Number | text | Yes | Non-empty, max 20 chars |

## Actions

### Save Partner (Create)

```text
User fills form
  -> validate required fields
  -> call POST /delivery-partners
  -> on success: redirect to /delivery-partners/:id
  -> on error: show inline errors
```

### Save Partner (Edit)

```text
Form pre-filled with existing data
  -> user modifies fields
  -> call PATCH /delivery-partners/:id
  -> on success: redirect to /delivery-partners/:id
  -> on error: show inline errors
```

### Cancel

Navigate back to `/delivery-partners`.

## Error States

### Validation Errors

```text
Full name is required.
Phone number is required.
Please select an assigned store.
Please select a vehicle type.
Vehicle number is required.
```

### Server Error

```text
Unable to save delivery partner. Please try again.
```

## Loading State

```text
Store dropdown shows "Loading stores..." while fetching.
Save button shows "Saving..." during submission.
```

## Component Checklist

- Breadcrumb
- Full Name input
- Phone Number input
- Email input (optional)
- Store select dropdown
- Vehicle Type select dropdown
- Vehicle Number input
- Cancel button
- Save Partner / Update Partner button
- Inline validation messages
- Global error alert

## API / Data Requirements

Reads:
- `GET /stores?status=active` — populate store dropdown
- `GET /delivery-partners/:id` (edit only) — pre-populate form

Writes:
- `POST /delivery-partners` — create
- `PATCH /delivery-partners/:id` — edit

Required payload fields:
- `name`
- `phone`
- `email` (optional)
- `store_id`
- `vehicle_type`
- `vehicle_number`

## Acceptance Criteria

- Required fields show validation errors on empty submit.
- Store dropdown is populated from active stores only.
- Store Manager can only select or see their own store.
- On successful create, user is redirected to the new partner's detail page.
- On successful edit, user is redirected to the updated partner's detail page.
- Edit form is pre-populated with existing values.
- Cancel navigates back to the list without saving.

---

# Figma Screen Specification

## Figma Frames

```text
Delivery Partners / Create / Desktop — 1440×1024
Delivery Partners / Edit / Desktop — 1440×1024
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
Inherits top nav and sidebar.
```

### Breadcrumb: x=272, y=96

### Form Card

```text
Position: x=272, y=132
Size: 800×580
Fill: white, Radius: radius.lg, Shadow: shadow.card, Padding: 40px
```

### Form Content

```text
Section heading: "Partner Details" — heading.20.semibold, y=172

Full Name + Phone row (side by side):
  Full Name: label y=228, input y=256, size=344×48
  Phone: label y=228, input y=256, size=344×48, x offset=376

Email:
  label y=328, input y=356, size=720×48

Assigned Store:
  label y=428, select y=456, size=720×48
  placeholder: "Select store..."

Vehicle Type + Vehicle Number row:
  Vehicle Type: label y=528, select y=556, size=344×48
  Vehicle Number: label y=528, input y=556, size=344×48, x offset=376

Action row: y=644, align=right, gap=16px
  Cancel: size=120×44, fill=white, border=1px neutral.300
  Save Partner: size=168×44, fill=primary.600, shadow=shadow.button.primary
```

## Edit Variant

```text
Breadcrumb: "← Delivery Partners / Marcus W. / Edit"
Heading: "Edit Partner"
All fields pre-populated.
Button text: "Update Partner"
```
