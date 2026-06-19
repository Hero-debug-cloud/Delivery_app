# Feature: Stores

## Feature Purpose

Allows Super Admins and authorized managers to create, view, edit, and deactivate stores. Stores are the operational hubs that delivery partners are assigned to and from which orders originate.

## User Roles

| Role | Access |
| :--- | :--- |
| Super Admin | Full CRUD on all stores |
| Store Manager | Read-only on their own store |
| Dispatcher | Read-only on all stores |

## Screen List

| File | Screen | Route |
| :--- | :--- | :--- |
| `index.md` | Store list | `/stores` |
| `create-edit.md` | Create or edit a store | `/stores/new` and `/stores/:id/edit` |
| `detail.md` | Store detail view | `/stores/:id` |

## Routes

```text
/stores
/stores/new
/stores/:id
/stores/:id/edit
```

## MVP Source References

- `mvp-v1.md` — Section 4.2: Store Management
- `mvp-v1.md` — Section 5, Page 3: Stores

## In-Scope Items

- Store list with search and status filter
- Create store form
- Edit store form
- Activate / deactivate store toggle
- Store detail view

## Out-of-Scope Items

- Polygon geofence editor
- Multi-region hierarchy
- Store inventory sync
