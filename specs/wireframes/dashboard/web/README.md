# Feature: Dashboard

## Feature Purpose

The dashboard is the home screen for all web admin roles after login. It provides an at-a-glance operational overview of the logistics operation, including active orders, available drivers, delivery performance, and a live map of active partners.

## User Roles

| Role | Access |
| :--- | :--- |
| Super Admin | Full dashboard, all stores |
| Store Manager | Dashboard scoped to their assigned store |
| Dispatcher | Full dashboard, focus on order queue and live map |

## Screen List

| File | Screen | Route |
| :--- | :--- | :--- |
| `index.md` | Dashboard entry / redirect | `/dashboard` |
| `overview.md` | Dashboard overview with cards and map | `/dashboard` |

## Routes

```text
/dashboard
```

## MVP Source References

- `mvp-v1.md` — Section 5, Page 2: Dashboard
- `mvp-v1.md` — Section 4.6: Live Tracking

## In-Scope Items

- Active orders count card
- Available drivers count card
- Orders delivered today count card
- Failed orders today count card
- Live map showing active delivery partners and active orders
- Role-scoped data (Store Manager sees only their store)

## Out-of-Scope Items

- Historical analytics charts
- SLA scoring
- Payroll or shift widgets
- Route replay
- Anomaly alerts
