# Feature: Live Tracking

## Feature Purpose

Provides a real-time map view of all active delivery partners and their assigned orders. Dispatchers and admins use this screen to monitor ongoing deliveries and respond to issues.

## User Roles

| Role | Access |
| :--- | :--- |
| Super Admin | All stores, all drivers |
| Store Manager | Own store drivers only |
| Dispatcher | All stores, all drivers |

## Screen List

| File | Screen | Route |
| :--- | :--- | :--- |
| `index.md` | Live tracking map | `/tracking` |

## Routes

```text
/tracking
```

## MVP Source References

- `mvp-v1.md` — Section 4.6: Live Tracking
- `mvp-v1.md` — Section 5, Page 6: Live Tracking

## In-Scope Items

- Full-screen map of all active drivers
- Driver pins with status
- Click driver pin → driver + order detail side panel
- Auto-refresh every 10–15 seconds

## Out-of-Scope Items

- MQTT/WebSocket live streaming
- Route replay animation
- Anomaly detection alerts
- Adaptive sampling
- Kalman filtering
