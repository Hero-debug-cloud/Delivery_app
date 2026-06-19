# Feature: Delivery Partner Mobile App

## Feature Purpose

The Flutter mobile app used by delivery partners to log in, go online, view assigned orders, accept or reject them, update delivery status through the full lifecycle, and submit proof of delivery.

## User Roles

| Role | Platform |
| :--- | :--- |
| Delivery Partner | Flutter mobile app (iOS and Android) |

## Screen List

| File | Screen |
| :--- | :--- |
| `login.md` | Login / OTP screen |
| `home.md` | Home dashboard (online/offline toggle, order summary) |
| `order-detail.md` | Assigned order detail with accept / reject |
| `active-delivery.md` | Active delivery screen with navigation and status updates |
| `delivery-complete.md` | Delivery completion — PIN entry and confirmation |
| `profile.md` | Driver profile screen |

## MVP Source References

- `mvp-v1.md` — Section 4.7: Delivery Workflow
- `mvp-v1.md` — Section 6: MVP Mobile App Screens

## In-Scope Items

- OTP login
- Go online / offline toggle
- View assigned order
- Accept or reject order
- Mark picked up
- Mark delivered with 4-digit customer PIN
- Background/foreground location sharing during active delivery

## Out-of-Scope Items

- Biometric login
- Barcode scanning
- Signature capture
- Delivery photo upload
- Geofenced pickup/dropoff validation
- Shift scheduling
