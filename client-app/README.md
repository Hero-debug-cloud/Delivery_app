# LogiRoute Mobile Application

Unified mobile application codebase built with **Flutter**, serving both **Delivery Partners** (riders) and **Customers**.

---

## 1. Development Commands

- `flutter pub get` — Resolve and download package dependencies.
- `flutter run` — Run application on a connected device/emulator.
- `flutter analyze` — Run static code analysis checks.
- `flutter test` — Run widget unit tests.
- `flutter doctor` — Inspect local development environment health.

---

## 2. Directory Architecture (Feature-Wise Clean Architecture)

Code resides under `lib/features/` split into features (`auth/`, `orders/`, `tracking/`, `profile/`):
- **`presentation/`** — Screens UI code and state managers (BLoC/Cubit).
- **`domain/`** — Serialization models and abstract repository contracts.
- **`data/`** — Repository concrete implementations and API datasources (Dio/Http).
- **`lib/core/`** — Shared resources like themes, assets, and utility helpers.

---

## 3. UI Theme & Design Tokens

Typography, colors, and layout components are configured inside [`lib/core/theme.dart`](file:///Users/me/Projects/delivery_app/client-app/lib/core/theme.dart):
- **Font Family**: Google Font **Inter** mapped globally.
- **Colors**: Hex tokens representing design system specifications (Primary blues, neutral slates, and semantic success/warning/error colors).
- **Logistics Status Colors**: Global variables matching Order & Driver states (e.g. `AppColors.statusInTransit`, `AppColors.statusDelivered`).
- **Radii**: `AppRadius.sm` (8.0), `AppRadius.md` (12.0), `AppRadius.lg` (24.0) for standard Material 3 components.

---

## 4. Navigation & Screens Map

Navigation is managed via GoRouter inside [`lib/main.dart`](file:///Users/me/Projects/delivery_app/client-app/lib/main.dart):
- `/login` — OTP phone number request and code validation.
- `/dashboard` — Duty status toggle (online/offline) and list cards of assigned jobs.
- `/orders/:id` — Assigned job summary, package details, and Accept/Reject buttons.
- `/delivery/:id` — Live transit tracking showing OSRM routes, navigation banners, and progress toggles.
- `/delivery/:id/complete` — Secure customer 4-digit PIN verification.
- `/profile` — License details, ratings/stats, and sign-out.
