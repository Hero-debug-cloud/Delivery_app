# Feature: Delivery Partners

## Feature Purpose

Allows admins to manage delivery partner profiles, view their current status, assign them to stores, and track basic vehicle and availability information.

## User Roles

| Role | Access |
| :--- | :--- |
| Super Admin | Full CRUD on all partners |
| Store Manager | View and manage partners assigned to their store |
| Dispatcher | Read-only, view all partners and current status |

## Screen List

| File | Screen | Route |
| :--- | :--- | :--- |
| `index.md` | Delivery partner list | `/delivery-partners` |
| `create-edit.md` | Create or edit a delivery partner | `/delivery-partners/new` and `/delivery-partners/:id/edit` |
| `detail.md` | Delivery partner detail | `/delivery-partners/:id` |

## Routes

```text
/delivery-partners
/delivery-partners/new
/delivery-partners/:id
/delivery-partners/:id/edit
```

## MVP Source References

- `mvp-v1.md` — Section 4.3: Delivery Partner Management
- `mvp-v1.md` — Section 5, Page 4: Delivery Partners

## In-Scope Items

- Delivery partner list with search and status filter
- Create delivery partner profile
- Edit delivery partner profile
- Assign partner to a store
- View current availability status (offline / online / busy)
- Vehicle type and number

## Out-of-Scope Items

- Background checks
- Digital contracts
- License scan uploads
- Driver bidding for shifts
