# Wireframe Spec: Store Detail

## Route / Screen

```text
/stores/:id
```

## Purpose

Show the full details of a single store, including its information, status, and a list of delivery partners assigned to it.

## MVP Source

From `mvp-v1.md` Section 4.2:

- View store fields: name, address, lat/lng, contact, active/inactive status.
- Assign delivery partners to a default store.

## Supported Roles

- Super Admin (full actions)
- Store Manager (read-only, own store only)
- Dispatcher (read-only)

## Primary User Goal

Review a store's information and see which delivery partners are assigned to it.

## Page Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  ← Stores   /  Downtown Hub                                   │
│             │                                                               │
│             │  Downtown Hub              ● Active    [Edit Store]           │
│             │                                                               │
│             │  ┌─────────────────────────────┐  ┌───────────────────────┐  │
│             │  │  Store Info                 │  │  [Map mini-view]      │  │
│             │  │  Address  12 Main St        │  │  pin at lat/lng       │  │
│             │  │  Phone    555-0001          │  │                       │  │
│             │  │  Lat      40.7128           │  └───────────────────────┘  │
│             │  │  Lng      -74.0060          │                             │
│             │  └─────────────────────────────┘                             │
│             │                                                               │
│             │  Delivery Partners (8)                                        │
│             │  ┌──────────────────────────────────────────────────────┐    │
│             │  │ Name       Vehicle     Status    Store   [View]       │    │
│             │  │ Marcus W.  Moto        ● Online  ↑Here   →           │    │
│             │  │ Priya S.   Bicycle     ○ Offline ↑Here   →           │    │
│             │  └──────────────────────────────────────────────────────┘    │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

## Fields Displayed

### Store Info Card

| Field | Value |
| :--- | :--- |
| Store Name | `store.name` (page heading) |
| Address | `store.address` |
| Phone | `store.phone` |
| Latitude | `store.latitude` |
| Longitude | `store.longitude` |
| Status | Active / Inactive badge |

### Delivery Partners Table

| Column | Data |
| :--- | :--- |
| Name | `driver.name` |
| Vehicle | `driver.vehicle_type` + `driver.vehicle_number` |
| Status | `driver.status` badge |
| Actions | View link → `/delivery-partners/:id` |

## Actions

- **Edit Store** → navigate to `/stores/:id/edit` (Super Admin only)
- **Deactivate / Activate** → triggers deactivate confirmation modal (details in [modals.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/modals.md))
- **Delete Store** → triggers delete store confirmation modal (Super Admin only; details in [modals.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/modals.md))
- **View Partner** → navigate to `/delivery-partners/:id`

## States

Refer to [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md) for detailed visual layouts of shared states.

### Loading State

Shows pulsing Card Skeletons for Store Info and mini map, and 3 Table Skeletons for partners.

### Empty Partners State

Shows "No delivery partners assigned to this store yet." inside the partners table container.

### Error State

Renders the Inline Error Alert at the top of the content area.

## Component Checklist

- Breadcrumb
- Page heading with status badge
- Edit Store button (Super Admin only)
- Store info card (key-value list)
- Mini map with store pin
- Delivery partners table
- Status badges (online / offline / busy)
- View partner link per row
- Danger Zone card with Delete Store button (Super Admin only)

## API / Data Requirements

Reads:
- `GET /stores/:id`
- `GET /delivery-partners?store_id=:id`

Writes:
- `DELETE /stores/:id`
- `PATCH /stores/:id` (for deactivate/activate status toggle)

Required fields:
- All store fields
- `driver.id`, `driver.name`, `driver.vehicle_type`, `driver.vehicle_number`, `driver.status`

## Acceptance Criteria

- Store detail page loads all store fields correctly.
- Mini map shows a pin at the store's lat/lng coordinates.
- Delivery partners table shows all partners assigned to this store.
- Edit Store button is visible only to Super Admin.
- Deactivating or deleting a store triggers the correct confirmation modal.
- On successful deletion, redirect to `/stores` with a success Toast.
- Clicking a driver row navigates to that driver's detail page.
- Empty state is shown when no partners are assigned.

---

# Figma Screen Specification

## Figma Frames

```text
Stores / Detail / Desktop — 1440×1024
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Desktop Visual Composition

### Frame: `Stores / Detail / Desktop`

```text
Frame size: 1440×1024
Background: neutral.50
```

### Breadcrumb + Header

```text
Breadcrumb: x=272, y=96 — "← Stores / Downtown Hub"
Store name heading: x=272, y=128 — heading.32.bold, neutral.950
Status badge: x alongside heading
Edit Store button: x=1232, y=124 — size=160×40
```

### Info + Map Row

```text
Position: x=272, y=192
Gap: 24px

Info card:
  size=480×200
  fill: white, radius: radius.lg, shadow: shadow.card, padding: 24px
  Key-value rows, gap=16px
  Key: caption.14.medium, neutral.500
  Value: body.16.regular, neutral.950

Mini map:
  size=600×200
  radius: radius.lg
  overflow: hidden
  border: 1px neutral.200
```

### Partners Table

```text
Position: x=272, y=420
Width: 1136px
fill: white, radius: radius.lg, shadow: shadow.card

Header row: height=48, fill=neutral.50
Data rows: height=56, hover=neutral.50

Columns:
  Name: 240px
  Vehicle: 240px
  Status: 160px
  Actions: 80px
```

### Danger Zone Card (Super Admin Only)

```text
Position: x=272, y=700 (placed below the partners table with 24px vertical spacing)
Width: 1136px
Height: 96px
Fill: white
Border: 1px error.300
Radius: radius.lg (24px)
Padding: 24px
Flex-Direction: Row
Align-Items: Center
Justify-Content: Space-Between

Text elements (vertical stack, gap=4px):
  Title: "Danger Zone" — heading.20.semibold, error.600
  Description: "Permanently delete this store and all of its associated data." — body.16.regular, neutral.500

Button:
  size=160×44
  fill: error.600
  text: "Delete Store" — body.16.medium, white
  radius: radius.md
  cursor: pointer
```
