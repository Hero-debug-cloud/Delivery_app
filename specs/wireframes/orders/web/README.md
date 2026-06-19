# Feature: Orders

## Feature Purpose

The Orders section is the operational core of LogiRoute. It allows admins and dispatchers to view the order queue, manually create orders, assign drivers, and track each order through its full lifecycle.

## User Roles

| Role | Access |
| :--- | :--- |
| Super Admin | Full access, all stores |
| Store Manager | View and manage orders for their store |
| Dispatcher | View all orders, assign/reassign drivers |

## Screen List

| File | Screen | Route |
| :--- | :--- | :--- |
| `index.md` | Order queue / list | `/orders` |
| `create.md` | Create manual order | `/orders/new` |
| `detail.md` | Order detail and timeline | `/orders/:id` |
| `assign-driver.md` | Assign / reassign driver modal | Modal on `/orders/:id` |

## Routes

```text
/orders
/orders/new
/orders/:id
```

## MVP Source References

- `mvp-v1.md` — Section 4.4: Order Management
- `mvp-v1.md` — Section 4.5: Dispatch
- `mvp-v1.md` — Section 5, Page 5: Orders

## In-Scope Items

- Order queue with status and store filters
- Manual order creation
- Order detail view with full status timeline
- Assign / reassign driver from online partners
- Mark order failed

## Out-of-Scope Items

- Automatic batching and algorithmic dispatch
- SLA scoring
- Returns workflow
- Inventory and product sync
- API ingestion UI (backend endpoint exists but no admin UI needed in MVP)

## Location Input Rule

Delivery address and coordinates are always captured via the map picker component — not via raw lat/lng text inputs. See `stores/web/create-edit.md` for the map picker interaction spec.
