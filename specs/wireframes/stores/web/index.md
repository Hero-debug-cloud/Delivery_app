# Wireframe Spec: Store List

## Route / Screen

```text
/stores
```

## Purpose

Display a searchable, filterable list of all stores. Super Admins can create new stores and manage any store. Dispatchers and Store Managers have read-only access.

## MVP Source

From `mvp-v1.md` Section 4.2:

- Create, edit, and deactivate stores.
- Store fields: name, address, lat/lng, contact number, active/inactive status.

## Supported Roles

- Super Admin (full access)
- Store Manager (read-only, sees only their store)
- Dispatcher (read-only, sees all stores)

## Primary User Goal

Find a specific store quickly and either view details, edit it, or change its active status.

## Page Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Stores                          [+ Add Store]                │
│             │                                                               │
│             │  ┌─────────────────────────┐  [Status: All ▼]                │
│             │  │ 🔍  Search stores...    │                                  │
│             │  └─────────────────────────┘                                 │
│             │                                                               │
│             │  ┌──────────────────────────────────────────────────────┐    │
│             │  │ Name          Address          Contact    Status  ⋮  │    │
│             │  ├──────────────────────────────────────────────────────┤    │
│             │  │ Downtown Hub  12 Main St       555-0001   ● Active  ⋮│    │
│             │  │ East Depot    45 River Rd      555-0002   ● Active  ⋮│    │
│             │  │ West Branch   8 Park Ave       555-0003   ○ Inactive⋮│    │
│             │  │ ...                                                   │    │
│             │  └──────────────────────────────────────────────────────┘    │
│             │                                                               │
│             │  Showing 12 of 12 stores                                     │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

## Fields Displayed

| Column | Data |
| :--- | :--- |
| Name | `store.name` |
| Address | `store.address` |
| Contact | `store.phone` |
| Status | `store.is_active` → Active / Inactive badge |
| Actions menu `⋮` | View, Edit, Activate/Deactivate, Delete |

## Actions

- **Add Store** → navigate to `/stores/new` (Super Admin only)
- **Search** → filters list with debouncer and clear button (see [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md))
- **Status filter** → All / Active / Inactive
- **Filter Chips Row** → Shows active filters as chips (e.g. "Status: Active") with inline clear icons and a "Clear All" button below the filters row.
- **Row click** → navigate to `/stores/:id`
- **⋮ menu → View** → navigate to `/stores/:id`
- **⋮ menu → Edit** → navigate to `/stores/:id/edit`
- **⋮ menu → Deactivate / Activate** → triggers deactivate confirmation modal (details in [modals.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/modals.md))
- **⋮ menu → Delete** → triggers delete store confirmation modal (Super Admin only; details in [modals.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/modals.md))

## States

Refer to [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md) for detailed visual layouts of shared states.

### Loading State

Table shows 5 Data Table Skeleton rows.

### Empty State

List Empty State centered card with store outline icon.

### Empty Search State

Search/Filter Empty State card with clear filters action.

### Error State

Inline Error Alert at the top of the data table.

## Component Checklist

- Page heading
- Add Store button (Super Admin only)
- Search input
- Status filter dropdown
- Data table with sortable columns
- Status badge (Active / Inactive)
- Row actions menu
- Confirmation dialog for deactivate
- Pagination controls (see [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md))
- Skeleton loaders

## API / Data Requirements

Reads:
- `GET /stores?page=:page&limit=:limit` — returns paginated store list (default limit=20)
- `GET /stores?status=active&page=:page&limit=:limit` — filtered and paginated list

Writes:
- `PATCH /stores/:id` → `{ is_active: false }` for deactivate/activate

Required fields:
- `store.id`
- `store.name`
- `store.address`
- `store.phone`
- `store.is_active`

## Acceptance Criteria

- Store list loads with all stores visible to the user's role.
- Store Manager sees only their own store.
- Search filters stores by name in real-time or on submit.
- Status filter narrows results to active or inactive stores.
- Add Store button is visible only to Super Admin.
- Deactivating a store requires confirmation dialog.
- After deactivation, status badge updates immediately.
- Pagination controls are displayed below the table. Tapping page numbers or changing rows per page dropdown refetches the paginated data.
- Empty state is shown when no stores exist.
- Error state is shown with retry when API fails.

---

# Figma Screen Specification

## Figma Frames

```text
Stores / List / Desktop — 1440×1024
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Desktop Visual Composition

### Frame: `Stores / List / Desktop`

```text
Frame size: 1440×1024
Background: neutral.50
```

Inherits top nav bar (h=64) and sidebar (w=240) from the global shell.

### Main Content Area

```text
Position: x=240, y=64
Padding: 32px
```

### Page Header Row

```text
Heading: "Stores" — heading.32.bold, neutral.950, x=272, y=96
Add Store button:
  x=1264, y=92
  size=144×40
  fill: primary.600
  text: "+ Add Store" — body.16.medium, white
  radius: radius.md
  shadow: shadow.button.primary
  Visible to: Super Admin only
```

### Filters Row

```text
Position: x=272, y=156
Gap: 16px

Search input:
  size=360×40
  placeholder: "Search stores..."
  leading icon: search, 16×16, neutral.400

Status dropdown:
  size=160×40
  text: "Status: All ▾"
  fill: white
  border: 1px neutral.300
  radius: radius.sm
```

### Data Table

```text
Position: x=272, y=216
Width: 1136px
Fill: white
Radius: radius.lg (24px)
Shadow: shadow.card

Header row:
  height: 48px
  fill: neutral.50
  border bottom: 1px neutral.200
  text: caption.14.medium, neutral.500

Data rows:
  height: 56px
  border bottom: 1px neutral.100
  hover fill: neutral.50
  text: body.16.regular, neutral.950

Column widths:
  Name: 240px
  Address: 320px
  Contact: 160px
  Status: 120px
  Actions: 56px
```

### Status Badge

```text
Active:
  fill: success.50
  text: success.600
  text: "Active"
  radius: radius.full
  padding: 4×12
  type: caption.14.medium

Inactive:
  fill: neutral.100
  text: neutral.500
  text: "Inactive"
  same sizing
```

### Row Actions Menu

```text
Trigger: icon-button, 3-dot vertical, 32×32, neutral.400
Menu:
  width: 160px
  fill: white
  shadow: shadow.card
  radius: radius.md
  Items: View, Edit, Deactivate/Activate
  Item height: 40px
  Destructive item (Deactivate): error.600
```
