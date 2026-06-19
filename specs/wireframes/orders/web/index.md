# Wireframe Spec: Order Queue

## Route / Screen

```text
/orders
```

## Purpose

Display the live order queue. Dispatchers and managers can scan order statuses, filter by store or status, and jump to any order for action.

## MVP Source

From `mvp-v1.md` Section 4.4:

- View order queue.
- Filter by status and store.
- Assign/reassign driver.
- Mark order failed.

## Supported Roles

- Super Admin (all stores)
- Store Manager (own store only)
- Dispatcher (all stores)

## Primary User Goal

See what orders need attention right now — especially unassigned or stalled orders.

## Page Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  Orders                                  [+ Create Order]     │
│             │                                                               │
│             │  ┌──────────────────────┐  [Status: All ▼]  [Store: All ▼]   │
│             │  │ 🔍  Search orders... │                                     │
│             │  └──────────────────────┘                                    │
│             │                                                               │
│             │  ┌──────────────────────────────────────────────────────┐    │
│             │  │ Order ID   Customer    Store     Driver   Status  ⋮  │    │
│             │  ├──────────────────────────────────────────────────────┤    │
│             │  │ #ORD-5021  Priya S.    Downtown  Marcus   In Transit ⋮│   │
│             │  │ #ORD-5020  Ravi T.     East Hub  —        Created   ⋮│    │
│             │  │ #ORD-5019  Anika P.    Downtown  Priya    Delivered ⋮│    │
│             │  └──────────────────────────────────────────────────────┘    │
│             │                                                               │
│             │  Showing 48 orders                                           │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

## Fields Displayed

| Column | Data |
| :--- | :--- |
| Order ID | `order.external_order_id` |
| Customer | `order.customer_name` |
| Store | `store.name` |
| Assigned Driver | `driver.name` or `—` if unassigned |
| Status | `order.status` badge |
| Actions `⋮` | View, Edit, Assign Driver, Mark Failed |

## Actions

- **Create Order** → `/orders/new` (Super Admin, Store Manager)
- **Search** → filter by order ID or customer name (debounced input with clear icon, see [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md))
- **Status filter** → All / Created / Assigned / Accepted / Picked Up / In Transit / Delivered / Failed
- **Store filter** → All / specific store
- **Filter Chips Row** → Shows active filters as chips (e.g., "Status: Created") with inline clear icons and a "Clear All" button below the filters row.
- **Row click** → `/orders/:id`
- **⋮ → View** → `/orders/:id`
- **⋮ → Edit** → `/orders/:id/edit` (visible only when status = `created`)
- **⋮ → Assign Driver** → opens Assign Driver modal (if unassigned or assigned/accepted)
- **⋮ → Mark Failed** → triggers deactivation/failed confirmation modal, then `POST /orders/:id/failed`

## States

Refer to [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md) for visual details of shared states.

### Loading State

Table shows 5 Data Table Skeleton rows.

### Empty State

List Empty State centered card with package outline icon.

### Empty Filter State

Search/Filter Empty State card with clear filters action.

### Error State

Inline Error Alert at the top of the data table.

## Component Checklist

- Page heading + Create Order button
- Search input (with debouncer & clear icon, see [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md))
- Status filter dropdown
- Store filter dropdown
- Active filter chips row with clear buttons
- Data table with sortable columns
- Order status badges
- Unassigned driver indicator (`—`)
- Row actions menu (View, Edit, Assign Driver, Mark Failed)
- Mark Failed confirmation dialog (details in [modals.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/modals.md))
- Assign Driver modal trigger
- Pagination controls (see [feedback-states.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/feedback-states.md))

## API / Data Requirements

Reads:
- `GET /orders?page=:page&limit=:limit` — paginated order queue list (default limit=25)
- `GET /orders?status=created&page=:page&limit=:limit` — filtered and paginated list
- `GET /orders?store_id=:id&page=:page&limit=:limit` — store filtered and paginated list

Writes:
- `POST /orders/:id/failed`
- `POST /orders/:id/assign` (via modal)

Required fields:
- `order.id`, `order.external_order_id`, `order.customer_name`, `order.store_id`, `order.assigned_driver_id`, `order.status`
- `store.name`, `driver.name`

## Acceptance Criteria

- Order queue loads all orders visible to the user's role.
- Store Manager sees only their store's orders.
- Status and store filters work independently and together.
- Unassigned orders show `—` in the Driver column.
- Mark Failed requires a confirmation dialog before calling the API.
- After marking failed, the status badge updates immediately.
- Pagination controls are displayed below the table. Tapping page numbers or changing rows per page dropdown refetches the paginated data.
- Empty and error states render correctly.

---

# Figma Screen Specification

## Figma Frames

```text
Orders / List / Desktop — 1440×1024
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
Main content: x=240, y=64, padding=32px
```

### Page Header Row

```text
Heading: "Orders" — heading.32.bold, neutral.950, x=272, y=96
Create Order button: x=1220, y=92, size=184×40, fill=primary.600, radius=radius.md
```

### Filters Row

```text
y=156, gap=16px
Search input: size=320×40
Status dropdown: size=200×40
Store dropdown: size=160×40
```

### Data Table

```text
x=272, y=216, width=1136
fill: white, radius: radius.lg, shadow: shadow.card

Header: height=48, fill=neutral.50, caption.14.medium, neutral.500
Rows: height=56, border-bottom=1px neutral.100, hover=neutral.50

Columns:
  Order ID: 140px
  Customer: 200px
  Store: 200px
  Driver: 200px
  Status: 180px
  Actions: 56px
```

### Order Status Badges

```text
Created:    fill=neutral.100,    text=neutral.500    (status.pending)
Assigned:   fill=primary.50,     text=primary.600    (status.assigned)
Accepted:   fill=#F5F3FF,        text=#7C3AED        (status.accepted)
Picked Up:  fill=#ECFEFF,        text=#0891B2        (status.picked_up)
In Transit: fill=warning.50,     text=warning.500    (status.in_transit)
Delivered:  fill=success.50,     text=success.600    (status.delivered)
Failed:     fill=error.50,       text=error.600      (status.failed)
radius: radius.full, padding: 4×12, type: caption.14.medium
```
