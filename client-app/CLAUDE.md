# Flutter Mobile App Coding Standards

This guide defines the engineering practices, directory structure, and code style for the unified Flutter mobile application.

---

## 1. Core Development Commands

- **Fetch packages**: `flutter pub get`
- **Run application**: `flutter run`
- **Analyze code**: `flutter analyze`
- **Check environment health**: `flutter doctor`

---

## 2. Directory Architecture (Feature-Wise Clean Architecture)

The mobile codebase utilizes a modular **Feature-Wise Clean Architecture** structure under `lib/features/`:

```text
client-app/
├── lib/
│   ├── main.dart               # App entrypoint and central routing (GoRouter)
│   │
│   ├── features/               # Feature Modules
│   │   └── <feature_name>/     # E.g. auth, tracking, orders, profile
│   │       ├── presentation/   # Presentation Layer (UI & State)
│   │       │   ├── screens/    # Feature page screens
│   │       │   ├── widgets/    # Smaller, specific sub-widgets
│   │       │   └── bloc/       # State management (BloC/Cubit or Providers)
│   │       │
│   │       ├── domain/         # Domain Layer (Pure business logic definitions)
│   │       │   ├── models/     # Serialization templates/data models
│   │       │   └── repositories/# Repository interfaces
│   │       │
│   │       └── data/           # Data Layer (Implementations & APIs)
│   │           ├── repositories/# Repository implementations
│   │           └── sources/    # API calls (Dio/Http) or Local storage
│   │
│   └── core/                   # Shared resources across features (theme, utils, constants)
```

---

## 3. Coding Guidelines

### Widget Size Limits
- **Max Build Method**: No single widget `build()` method should exceed **250 lines**.
- If a UI layout exceeds this limit, refactor its nested sub-trees into separate stateless/stateful widget classes inside the feature's `presentation/widgets/` folder. This keeps the main screen readable and improves rebuild performance.

### Separation of Logic & Views
- Never perform network requests or write complex calculations directly inside a widget's build function.
- UI elements should be reactive view templates that render states managed by a BloC, Cubit, or ChangeNotifier.
- Remote HTTP requests must go through remote data sources in the `data/sources/` directory.

### Maps & Live Telemetry
- Simulating or displaying live maps must use the `google_maps_flutter` package wrapping map lifecycle events.
- Telemetry location pings must be collected using the `geolocator` package, sampling locations periodically only during active orders (every 10s) and stopping when offline to preserve battery life.

### Reusable UI Controls
- Maintain consistency by using custom theme tokens (`ColorScheme`, `ThemeData`) defined in `main.dart`.
- Do not hardcode typography, sizes, or border radii. Reference core styles and tokens to maintain app-wide branding.
