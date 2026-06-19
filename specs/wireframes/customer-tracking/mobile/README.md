# Feature: Customer Tracking

## Feature Purpose

Allows customers to track their order status and see the delivery partner's live location on a map. Accessed via a secure tracking link — no account or login required.

## User Roles

| Role | Platform |
| :--- | :--- |
| Customer | Mobile browser (responsive web page) or Flutter app screen |

For MVP, this is a lightweight responsive web page served from the tracking link. It can also be embedded in the Flutter app.

## Screen List

| File | Screen |
| :--- | :--- |
| `lookup.md` | Order lookup (enter phone or order ID) |
| `status.md` | Order status view |
| `map.md` | Live map view |

## Routes / Access

```text
/track/:trackingToken          (status + map, accessed via secure link)
/track                         (lookup fallback if no token)
```

## MVP Source References

- `mvp-v1.md` — Section 4.8: Customer Tracking
- `mvp-v1.md` — Section 6: Customer Screens

## In-Scope Items

- Secure tracking link with token
- Current order status
- Assigned driver name and optional phone
- Live driver location on map
- Estimated status text

## Out-of-Scope Items

- Customer account / login
- Order history
- Cart and checkout
- Payments
- Support tickets
