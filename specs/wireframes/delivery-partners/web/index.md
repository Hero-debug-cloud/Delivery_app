# Wireframe Spec: Delivery Partner List

## Route / Screen

```text
/delivery-partners
```

## Purpose

Display a searchable, filterable list of all delivery partners. Admins can create new partners, view current availability status, and navigate to individual profiles.

## MVP Source

From `mvp-v1.md` Section 4.3:

- View partner list with status (offline / online / busy).
- Assign partner to a store.
- Create/edit partner profile.

## Supported Roles

- Super Admin (full access)
- Store Manager (partners assigned to their store only)
- Dispatcher (read-only, all stores)

## Primary User Goal

Quickly see who is available right now and navigate to a specific driver's profile.

## Page Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Delivery Partners               [+ Add Partner]              │
│             │                                                               │
│             │  ┌──────────────────────────┐  [Status: All ▼]  [Store: All ▼]│
│             │  │ 🔍  Search partners...   │                                 │
│             │  └──────────────────────────┘                                 │
│             │                                                               │
│             │  ┌──────────────────────────────────────────────────────┐    │
│             │  │ Name        Store          Vehicle     Status     ⋮  │    │
│             │  ├──────────────────────────────────────────────────────┤    │
│             │  │ Marcus W.   Downtown Hub   Moto MH01   ● Online    ⋮ │    │
│             │  │ Priya S.    East Depot     Bike KA02   ● Busy      ⋮ │    │
│             │  │ Ravi T.     West Branch    Moto MH09   ○ Offline   ⋮ │    │
│             │  └──────────────────────────────────────────────────────┘    │
│             │                                                               │
│             │  Showing 24 of 24 partners                                   │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

## Fields Displayed

| Column | Data |
| :--- | :--- |
| Name | `driver.name` |
| Store | `store.name` (via `driver.store_id`) |
| Vehicle | `driver.vehicle_type` + `driver.vehicle_number` |
| Status | `driver.status` badge |
| Actions `⋮` | View, Edit |

## Actions

- **Add Partner** → `/delivery-partners/new` (Super Admin, Store Manager)
- **Search** → filter by name (debounced input with clear icon, see [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md))
- **Status filter** → All / Online / Busy / Offline
- **Store filter** → All / specific store (Super Admin, Dispatcher)
- **Filter Chips Row** → Shows active filters as chips (e.g. "Status: Online") with inline clear icons and a "Clear All" button below the filters row.
- **Row click** → `/delivery-partners/:id`
- **⋮ → View** → `/delivery-partners/:id`
- **⋮ → Edit** → `/delivery-partners/:id/edit`

## States

Refer to [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md) for detailed visual layouts of shared states.

### Loading State

Table shows 5 Data Table Skeleton rows.

### Empty State

List Empty State centered card with user outline icon.

### Empty Search State

Search/Filter Empty State card with clear filters action.

### Error State

Inline Error Alert at the top of the data table.

## Component Checklist

- Page heading + Add Partner button
- Search input (with debouncer & clear icon, see [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md))
- Status filter dropdown
- Store filter dropdown
- Active filter chips row with clear buttons
- Data table
- Status badge (online / busy / offline)
- Row actions menu
- Pagination controls (see [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md))

## API / Data Requirements

Reads:
- `GET /delivery-partners?page=:page&limit=:limit` — paginated partner list (default limit=20)
- `GET /delivery-partners?status=online&page=:page&limit=:limit` — filtered and paginated list
- `GET /delivery-partners?store_id=:id&page=:page&limit=:limit` — store filtered and paginated list

Required fields:
- `driver.id`, `driver.name`, `driver.store_id`, `driver.vehicle_type`, `driver.vehicle_number`, `driver.status`

## Acceptance Criteria

- List loads all partners visible to the user's role.
- Store Manager sees only partners from their store.
- Status and store filters narrow the list correctly.
- Add Partner button is hidden from Dispatcher.
- Clicking a row navigates to the partner detail page.
- Status badges reflect current `driver.status` values.
- Pagination controls are displayed below the table. Tapping page numbers or changing rows per page dropdown refetches the paginated data.
- Empty and error states render correctly.

---

# Figma Screen Specification

## Figma Frames

```text
Delivery Partners / List / Desktop — 1440×1024
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
Inherits top nav and sidebar shell.
```

### Main Content Area: x=240, y=64, padding=32px

### Page Header Row

```text
Heading: "Delivery Partners" — heading.32.bold, neutral.950, x=272, y=96
Add Partner button: x=1232, y=92, size=168×40, fill=primary.600, radius=radius.md
```

### Filters Row

```text
y=156, gap=16px
Search input: size=360×40
Status dropdown: size=160×40
Store dropdown: size=160×40 (hidden for Store Manager)
```

### Data Table

```text
x=272, y=216, width=1136
fill: white, radius: radius.lg, shadow: shadow.card

Header: height=48, fill=neutral.50, caption.14.medium, neutral.500
Rows: height=56, border-bottom=1px neutral.100

Columns:
  Name: 240px
  Store: 240px
  Vehicle: 200px
  Status: 160px
  Actions: 56px
```

### Status Badges

```text
Online:  fill=success.50,  text=success.600,  "● Online"
Busy:    fill=warning.50,  text=warning.500,  "● Busy"
Offline: fill=neutral.100, text=neutral.500,  "○ Offline"
radius: radius.full, padding: 4×12, type: caption.14.medium
```
