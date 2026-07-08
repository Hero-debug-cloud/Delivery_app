# LogiRoute — Developer Context & Project Blueprint

This file serves as a single source of truth for the codebase architecture, technology stack, completed features, and commands. Refer to this file at the start of every session to understand the technology stack, project structure, operations, and coding standards.

---

## 1. Core Technology Stack

- **Monorepo Runtime**: Bun is preferred for backend and admin scripting.
- **Backend API**: Bun + Hono API framework (Runs on port `8000`).
- **Database**: PostgreSQL (via TimescaleDB + PostGIS) managed with **Drizzle ORM** (Runs on port `5432`).
- **Cache / Telemetry**: Redis (Runs on port `6379`).
- **Admin Panel**: Next.js 16 (Turbopack) + React 19 + Zustand + Tailwind CSS v4 + TanStack Query + React Hook Form (Runs on port `3010` mapped to `3000`).
- **Mobile App**: Flutter (BLoC / Cubit state management).
- **Routing Engine**: OSRM (Open Source Routing Machine) backend (Runs on port `5000`).

---

## 2. Directory Structure

```text
delivery_app/
├── server/                     # Hono Backend Services
│   ├── src/
│   │   ├── db/                 # DB connection and Drizzle schema
│   │   ├── redis/              # Redis configuration and telemetry keys
│   │   ├── features/           # Modular Domain Features
│   │   │   ├── auth/           # Module 1: Auth APIs (Login, Signup, OTP, Session, Logout, Profile update)
│   │   │   ├── products/       # Module 2: Catalog Management (Products, Categories, DB queries)
│   │   │   ├── upload/         # Module 2: S3 File Upload Router and Storage Signers
│   │   │   ├── delivery-partners/ # Module 3: Driver Onboarding and Management APIs
│   │   │   ├── stores/         # Module 4: Store/Warehouse CRUD, Location, Roles
│   │   │   ├── users/          # Module 6: Staff & Customer Management APIs
│   │   │   └── customer-addresses/ # Module 7: Saved Addresses APIs
│   │   └── index.ts            # Hono application entry point & CORS
│   └── package.json
│
├── client-admin/               # Next.js Admin Panel
│   ├── src/
│   │   ├── app/                # App router (dashboard, login, tracking, CRUD pages)
│   │   ├── components/         # Shared UI components (PaginationFooter, InfiniteSelect)
│   │   ├── features/           # Modular Domain Features
│   │   │   ├── auth/           # Login / Signup forms, store, hook state
│   │   │   ├── products/       # Products & Categories CRUD, forms, modals, queries
│   │   │   ├── upload/         # MultiImageUploadField drag & drop S3 client wrappers
│   │   │   ├── delivery-partners/ # Driver list, onboarding approval/rejection, status mgmt
│   │   │   ├── stores/         # Store CRUD, Leaflet map picker, hooks, modals
│   │   │   └── users/          # Staff & Customer CRUD, forms, modals, queries
│   │   └── lib/                # AuthGuard, QueryProvider client shell wrappers
│   └── package.json
│
├── client-app/                 # Flutter Mobile App (Dual-Role: Customer + Driver)
│   ├── lib/
│   │   ├── main.dart           # App entry: MultiBlocProvider + GoRouter role-based routing
│   │   ├── core/               # App theme, style tokens, and ShiftManager state listener
│   │   ├── features/           # Modular Domain Features
│   │   │   ├── auth/           # OTP auth flow, AuthCubit, AuthUser model, role-based signup
│   │   │   │   ├── data/       # AuthRemoteSource, AuthRepository
│   │   │   │   ├── domain/     # AuthUser model (id, name, phone, email, role, driverProfile)
│   │   │   │   └── presentation/ # PhoneInputScreen (role tabs), OtpVerifyScreen, AuthCubit
│   │   │   ├── products/       # Customer catalog screens and BLoC
│   │   │   │   ├── data/       # ProductRemoteSource, ProductRepository
│   │   │   │   ├── domain/     # Product, Category domain models
│   │   │   │   └── presentation/
│   │   │   │       ├── bloc/   # ProductCubit, ProductState
│   │   │   │       └── screens/
│   │   │   │           ├── customer_home_screen.dart   # Category tabs + product grid
│   │   │   │           ├── product_search_screen.dart  # Debounced live search
│   │   │   │           ├── product_detail_screen.dart  # Full product info + add-to-cart
│   │   │   │           └── customer_profile_screen.dart # Profile + logout
│   │   │   ├── cart/           # CartCubit + CartState (items, totals, delivery fee)
│   │   │   └── addresses/      # Module 7: Saved Addresses and forms BLoC
│   │   │       ├── data/       # AddressRemoteSource, AddressRepository
│   │   │       ├── domain/     # CustomerAddress model
│   │   │       └── presentation/ # SavedAddressesScreen, AddEditAddressScreen, AddressCubit
│   │   └── screens/            # Driver screens (dashboard, onboarding, go_live, tracking, pin verify)
│   └── pubspec.yaml
│
├── scripts/                    # Dev scripts and automated tests
│   ├── smoke-test-auth.sh              # 16 core authentication checks
│   ├── smoke-test-products.sh          # 21 catalog and pagination checks
│   ├── smoke-test-driver-onboarding.sh # 26 driver onboarding + manual creation checks
│   ├── smoke-test-orders.sh            # E2E customer order / driver dispatch checks
│   └── smoke-test-payroll.sh           # E2E per-store payroll & settlement checks
│
├── specs/                      # Product specifications and UI wireframes
│   └── wireframes/payroll/     # Specifications for payroll module console, ledger, settings
└── docker-compose.yml          # Dev & Prod container services manager
```

---

## 3. Implemented Modules

### Module 1: Authentication System ✅ Completed
- **Database Sessions**: Custom `sessions` database table (HttpOnly Lax Session Cookie) for Next.js Admin Panel.
- **OTP Verification**: Redis-backed temporary OTP storage (5-minute TTL) printed to console in development.
- **Dual-Role OTP Auto-Registration**: `POST /auth/otp/verify` accepts an optional `role` field (`"delivery_partner"` | `"customer"`). If the phone number has no existing account, a new one is created for that role. Drivers also get a `delivery_partners` record with `onboardingStatus: pending`; customers get a plain `users` record.
- **Admin Roles**: Supports `super_admin`, `store_manager`, and `dispatcher`.
- **API Endpoints**:
  - `POST /auth/admin/login` (email/phone + password comparison via `Bun.password.verify`)
  - `POST /auth/admin/signup` (creates admin profile and starts session)
  - `POST /auth/otp/request` (initiates 6-digit verification code generation)
  - `POST /auth/otp/verify` (validates OTP, auto-creates account by role if new, returns session + driver profile)
  - `GET /auth/me` (retrieves session + driver profile with presigned document URLs)
  - `PATCH /auth/me` (updates user details/email/phone/password credentials)
  - `POST /auth/logout` (destroys active session)
- **Verification**:
  - Automated bash smoke tests (`./scripts/smoke-test-auth.sh`) run 19 checks and pass 100%.

---

### Module 2: Catalog & Storage Management ✅ Completed
- **Backend-Driven Catalog Operations**:
  - Moved all list search (`ilike`), sorting (`name`, `price`, `createdAt`), and filters (`storeId`, `categoryId`, `inStock`, `isVeg`) to the Hono backend.
  - Implemented server-side metadata pagination (`page`, `limit`, `totalItems`, `totalPages`, `hasNext`, `hasPrevious`).
  - Extended `products` table schema with detailed specs: `images` (jsonb array of strings for multiple image uploads), `brand` (text), `shelf_life` (text), `origin` (text), and `ingredients` (text).
- **Private Object Storage (MinIO / S3)**:
  - Setup `/upload` route with file-size validation (<5MB) and MIME-type restrictions.
  - Dual S3 Client Setup: Configured `s3Client` for internal container-to-container network queries (`minio:9000`) and a dedicated `signingS3Client` for local-host browser resolutions (`localhost:9000`).
  - Added URL parameter cleaner (`extractS3Key` in `s3.ts`) to extract raw keys (e.g. `uploads/uuid.png`) from presigned URLs, avoiding database pollution on edits.
- **Web Frontend Integration**:
  - Deleted all client-side array sorting/filters in `client-admin/src/app/(admin)/products/page.tsx`.
  - Configured infinite-scroll selectors (`InfiniteSelect`) for Category/Store associations.
  - Added standard `PaginationFooter` that binds directly to backend-provided metadata.
  - Added `MultiImageUploadField` drag-and-drop component to `ProductModal` supporting up to 5 images, size/type validations, main image highlight, and real-time upload progress.
- **Verification**:
  - Automated bash smoke tests (`./scripts/smoke-test-products.sh`) run 21 catalog checks and pass 100%.

---

### Module 3: Driver Onboarding & Management ✅ Completed
- **Database Schema**:
  - Extended `delivery_partners` table with onboarding statuses (`pending`, `submitted`, `approved`, `rejected`), rejection reason, license fields (number, expiry, front/back URLs), identity proof fields, and profile picture URL.
  - `vehicleType` and `vehicleNumber` are nullable to allow admin-created registrations without initial vehicle info.
- **Backend API** (`server/src/features/delivery-partners/`):
  - Added `/upload` permissions for `delivery_partner` role to support onboarding document uploads.
  - `PATCH /delivery-partners/me/onboard` — driver submits name, vehicle, license, and document S3 keys; status transitions to `submitted`.
  - `GET /delivery-partners` — admin lists drivers filtered by `onboardingStatus` / search, with full pagination metadata.
  - `POST /delivery-partners/:id/approve` — sets status to `approved`.
  - `POST /delivery-partners/:id/reject` — sets status to `rejected` and stores `rejectionReason`.
  - `POST /delivery-partners` (**manual creation**) — admin creates a driver directly (inserts `users` + `delivery_partners` in a transaction). Driver can then log in via OTP and complete onboarding.
- **Admin Panel UI** (`client-admin/src/features/delivery-partners/`):
  - Driver list organised into tabs: Verification Queue, Active Partners, Rejected, Draft Setup, All Drivers.
  - `DriverVerificationModal` — glassmorphic modal with document previews and approve/reject actions.
  - `CreateDriverModal` — form for manually creating a driver (name, phone, email, store, vehicle type/plate) using Zod + React Hook Form.
- **Flutter Driver App** (`client-app/lib/screens/`):
  - `DriverOnboardingScreen` — multi-step form (profile pic, vehicle, license, ID proof) with `image_picker` file uploads and a rejection banner for re-submissions.
  - `OnboardingReviewScreen` — waiting screen with a refresh-status button.
  - GoRouter redirects by status: `pending`/`rejected` → `/onboarding`, `submitted` → `/onboarding-review`, `approved` → `/dashboard`.
- **Verification**:
  - Automated bash smoke tests (`./scripts/smoke-test-driver-onboarding.sh`) run **26 checks** (full back-and-forth flow + manual creation + OTP login) and pass 100%.

---

### Module 4: Store / Warehouse Management & Spatial Boundaries ✅ Completed
- **Database Schema**:
  - `stores` table with fields: `id`, `name`, `address`, `latitude`, `longitude`, `phone`, `openingTime` (defaults to `"10:00"`), `closingTime` (defaults to `"19:00"`), `isActive`, `catchmentPolygon` (`geometry(Polygon, 4326)` custom type), `createdAt`, `updatedAt`.
- **Backend API** (`server/src/features/stores/`):
  - `GET /stores` — lists stores with server-side search (`ilike` on name/address), `isActive` filter, and metadata pagination. Public access.
  - `POST /stores` — create a new store with optional catchment WKT polygon. Requires `super_admin` role.
  - `GET /stores/:id` — fetch a single store by ID. Public access.
  - `PATCH /stores/:id` — update store details (name, phone, location, status, catchment polygon WKT). Requires `super_admin` or `store_manager`.
  - `DELETE /stores/:id` — soft-delete with active order/driver constraint checks. Requires `super_admin`.
  - `POST /stores/check-serviceability` — check if customer coordinates lie within any active store's catchment polygon boundary using PostGIS `ST_Contains` spatial query.
  - Zod schema validation (`createStoreSchema`, `updateStoreSchema`) with role-based middleware guards.
- **Admin Panel UI** (`client-admin/src/features/stores/`):
  - Store list table with debounced search, status filter dropdown, toggle active switch, edit and delete actions.
  - `StoreModal.tsx` — full create/edit form with:
    - Store name, phone, and operating timings (openingTime, closingTime time pickers) with validation.
    - Active status toggle.
    - **Leaflet + OpenStreetMap** interactive map coordinate picker (no API key required).
    - Real-time Nominatim geocoding search with autocomplete dropdown.
    - **"Locate Me"** button using browser `navigator.geolocation` → auto-pins current GPS location.
    - **Catchment Area Editor**: Interactive boundary drawing mode allowing admins to draw custom service polygons on the map canvas, with a one-click **"Auto 5km Zone"** hexagon generator.
    - Reverse geocoding on every map click / locate action to auto-fill address field.
    - Confirm Location flow locks in `latitude`, `longitude`, and `address` before form submission.
  - TanStack Query hooks for create, update, delete, toggle mutations with automatic cache invalidation.
- **Admin Layout**:
  - Added persistent **global footer** to `client-admin/src/app/(admin)/layout.tsx` with copyright, version badge, Docs/API Health links, and animated system status indicator.
  - Refactored sidebar navigation to support collapsible layouts, floating popover account options, administrative profile settings, and status cycling controls.
- **Verification**:
  - TypeScript compilation (`bun x tsc --noEmit`) passes with 0 errors on both server and client-admin.

---

### Module 5: Flutter Customer App ✅ Completed
- **Role-Based Authentication**:
  - `PhoneInputScreen` — dual-tab UI: **Customer** vs **Delivery Partner** role selector.
  - `OtpVerifyScreen` — receives role via GoRouter `state.extra` (supports both plain `String` phone and `Map<String, dynamic>` with `phone`+`role`); passes it to `POST /auth/otp/verify`.
  - `AuthUser` model extended with optional `email` field.
- **GoRouter Role Guards** (`client-app/lib/main.dart`):
  - `MultiBlocProvider` at app root: `AuthCubit` + `ProductCubit` + `CartCubit`.
  - `authState is! AuthAuthenticated` smart-cast eliminates redundant variable declarations.
  - Customers are redirected to `/home` and blocked from all driver/admin routes.
  - Approved drivers are redirected to `/dashboard` and blocked from all customer routes (`/home`, `/search`, `/products/*`, `/customer-profile`).
- **Customer Screens** (`features/products/presentation/screens/`):
  - `CustomerHomeScreen` — animated category tab bar, product grid, `BottomCartSheet`, search shortcut.
  - `ProductSearchScreen` — debounced live search (300ms) with inline add-to-cart controls.
  - `ProductDetailScreen` — full product info (name, price, discount, unit, veg badge), quantity stepper, add-to-cart CTA.
  - `CustomerProfileScreen` — displays name, phone, email; logout action.
- **Cart** (`features/cart/`):
  - `CartCubit` manages `Map<String, CartItem>` in-memory; exposes `addItem`, `removeItem`, `clearCart`.
  - `CartState` computes `itemCount`, `itemTotal`, `deliveryFee` (free above ₹199), `handlingCharge`, `grandTotal`.
  - `BottomCartSheet` — floating persistent bar; opens order summary modal with bill breakdown.
- **Remaining (future)**:
  - Order placement API + checkout flow.
  - Real-time delivery tracking (OSRM / WebSocket).
  - Push notification integration.

---

### Module 6: Staff & Customer Management ✅ Completed
- **Backend APIs** (`server/src/features/users/`):
  - Added `/users` route containing robust filtering (`type` selector for staff vs customer vs driver, active status filter), search (`ilike` queries on name/email/phone), sorting (`name`, `role`, `createdAt`), and backend-driven pagination.
  - Implemented secure user creation via `POST /users` (hashes passwords for staff with bcrypt) and update operations via `PATCH /users/:id`.
  - Added constraint-guarded soft deletions via `DELETE /users/:id` (blocks deleting user if active orders or delivery partner profiles exist).
- **Admin UI Panels** (`client-admin/src/app/(admin)/`):
  - Created `/users` page for Staff Management displaying active status, joined dates, and formatted administrative role badges (`super_admin`, `store_manager`, `dispatcher`).
  - Created `/customers` page for Customer Management displaying active profiles, contact info, and registration details.
  - Embedded customizable glassmorphic `UserModal` (combining Zod and React Hook Form validation) for profile editing/creation.
  - Added interactive active-status toggling and delete confirmation warning gates.

---

### Module 7: Saved Addresses System ✅ Completed
- **Database Schema**:
  - `customer_addresses` table: Added `recipientName` and `recipientPhone` columns to support custom delivery contacts or gifting orders.
- **Backend APIs** (`server/src/features/customer-addresses/`):
  - `GET /customer-addresses` — fetches list of saved customer addresses, ordered with active default address first.
  - `POST /customer-addresses` — creates a new address record. Automatically promotes the first created address to default, and clears old defaults if `isDefault` is set.
  - `PATCH /customer-addresses/:id` — updates label, address text, coordinates, default status, and recipient info.
  - `DELETE /customer-addresses/:id` — removes address. Automatically promotes the next most recent address to default if the deleted address was default.
- **Flutter Customer Client App** (`client-app/lib/features/addresses/`):
  - Setup modular architecture with `AddressRemoteSource`, `AddressRepository`, and state management managed via `AddressCubit` and `AddressState`.
  - `SavedAddressesScreen` — displays saved addresses with intuitive visual default indicator and swift deletion/navigation links.
  - `AddEditAddressScreen` — beautiful form utilizing location pinning, recipient credentials (name/phone), label selector (Home, Work, Other), and default selection switch.

---

### Module 8: Driver Shift Management & Geofenced Activation ✅ Completed
- **State Sync & Telemetry Backend APIs** (`server/src/features/delivery-partners/` and `server/src/features/telemetry/`):
  - `PATCH /delivery-partners/me/status` — updates active driver duty status (`online` / `offline`) and updates the `storeId` they are currently active at. Cleans up Redis cache and sends WebSocket offline events.
  - Profile sync `/auth/me` resolves store configuration dynamically including details and operating hours.
  - `GET /delivery-partners/me/profile` — retrieves the driver's full profile details (vehicle records, license, active warehouse/store, S3 presigned document URLs).
  - `PATCH /delivery-partners/me/profile` — updates driver name, email, or profile picture URL key.
  - `POST /locations/ping` — REST endpoint to receive coordinates, velocity, and battery levels from active drivers. Updates Redis GEO index, sends real-time coordinates to WebSocket clients tracking that driver, and asynchronously logs coordinate histories to the PostgreSQL `location_pings` table without blocking.
  - `GET /locations/ws` — Bun Hono WebSocket upgrade route supporting subscription payloads (`subscribe`/`unsubscribe`) to selectively stream telemetry.
  - `GET /locations/live` — Fetches current online drivers from Redis GEO index, filters out inactive sessions (>60s since last ping), and supports pagination (`page`, `limit`) and `search` query parameters. Mounts `/locations/online` as a fallback alias.
  - `GET /locations/replay/drivers` — Fetches a paginated, searchable list of drivers with active/logged shifts on a specific date (timezone-safe, Drizzle-native operators).
  - `GET /locations/replay/pings` — Fetches the compressed historical track coordinates (`[ [lat, lng, timestamp, speed, battery], ... ]`) for route playback. Performs on-the-fly path simplification using Ramer-Douglas-Peucker (RDP) algorithm and stationary log pre-filtering to reduce payload size by 80–90% without loss of route shape or timing accuracy. Accepts optional `epsilon` query parameter (defaulting to `0.00015`).
- **Flutter App Architecture**:
  - `ShiftManager` (`client-app/lib/core/shift_manager.dart`) — singleton state manager notifying subscribers of changes to active driver duty status and coordinates. Houses the **10-second periodic telemetry Timer** that pings `/locations/ping` using real-time `Geolocator` coordinates and real device battery level via the `battery_plus` package.
  - `GoLiveScreen` (`client-app/lib/screens/go_live.dart`) — lists active stores sorted by distance relative to the driver's current coordinates using Haversine calculation. Enforces a 100m geofence limit to transition online. Includes a simulated location toggle for testing near the chosen hub.
  - `DashboardScreen` (`client-app/lib/screens/dashboard.dart`) — bottom tabbed layout containing three navigation targets:
    1. **Dashboard Tab**: Displays shift control card (offline button to start shift or online telemetry banner with dynamic location status) and announcements list.
    2. **Tasks Tab**: Displays assignments list (currently empty placeholder).
    3. **Profile Tab**: Renders driver's personal and vehicle profile details using `ProfileScreen`.
  - `ProfileScreen` (`client-app/lib/screens/profile.dart`) — Renders driver details, verified documents section (tappable cards opening fullscreen image dialog previews), and:
    - **Initials Fallback**: Displays the uppercase first and last letters of the driver's name in the avatar circle if `profilePictureUrl` is empty/null.
    - **Camera Overlay & Upload**: Camera button on avatar launches camera/gallery sheet, compresses, uploads via `POST /upload` multipart form, updates via `PATCH /delivery-partners/me/profile`, and calls `checkAuth()` for state sync.
- **Admin Tracking Panel UI & Sub-Navigation** (`client-admin/src/app/(admin)/tracking/`):
  - `layout.tsx` — Persistent sidebar navigation containing a dynamic right-side fixed-positioned flyout popover for the **Live** and **Replay** sub-modules, styled with the project's clean light theme. Click events on the parent menu item are intercepted (`e.preventDefault()`) to prevent accidental page resets, and the parent item retains its hover highlight state (`isFlyoutOpen`) while the flyout menu is active.
  - `/tracking/page.tsx` (Live sub-module) — Cleaned live fleet monitoring dashboard, with page-level tabs and conditional submodule rendering blocks removed.
  - `/tracking/replay/page.tsx` (Replay sub-module) — Fully implemented route playback engine including date picking (with next/prev day navigation arrows), infinite scroll sidebar, Leaflet map canvas rendering bounds/paths/pins, speed multipliers (2x - 300x), linear interpolation (LERP) rendering at 60fps via `requestAnimationFrame` with binary search playhead seekers, and performance optimization directly bypassing React re-renders using elements ref node updates.
  - `TrackingMap.tsx` — Interactive OpenStreetMap canvas utilizing Leaflet to display driver pins, pan/zoom to selected drivers, and trigger popup details on click.

---

### Module 9: Ordering, Driver Dispatch & Public Tracking ✅ Completed
- **Database Schema**:
  - `orders` table: Tracks `externalOrderId` (idempotency key), `storeId`, `customerId`, `assignedDriverId`, coordinates, payment type, `status` (`created`, `assigned`, `accepted`, `picked_up`, `in_transit`, `delivered`, `failed`), `trackingToken`, `proofPin`, and `deliveryProofImageKey` (text).
  - `order_items` and `order_events` tables: Manage ordered products and state transition logging.
- **Backend API** (`server/src/features/orders/`):
  - `POST /orders` — Idempotent order placement (checks if order with `externalOrderId` already exists and returns it).
  - `GET /orders/broadcasts` — Lists active pending dispatches in range of driver's active hub.
  - `POST /orders/:id/ignore` — Excludes a broadcast order for a specific driver; flag `ignoredByAll` automatically toggles if no online drivers accept.
  - `POST /orders/:id/assign` — Admin manual override driver assignment.
  - `GET /orders/active` — Retrieves current active driver assignment.
  - `POST /orders/:id/reached-store` / `picked-up` / `out-for-delivery` / `reached-location` — Transition milestones.
    - **Geofenced Milestone Validation**: `/reached-store` and `/reached-location` require current driver coordinates (`latitude` / `longitude` inside body). The server calculates distance from target using Haversine algorithm and throws `DRIVER_NOT_NEARBY` if the distance is > 100m.
  - `POST /orders/:id/complete` — Secure OTP verification comparing client PIN with `proofPin` to finalize dropoff. Accepts optional `deliveryProofImageKey` parameter to store delivery photo reference.
  - `GET /track/:trackingToken` — Public endpoint returning real-time status, historical event timeline, and delivery confirmation photo URL.
- **Admin Panel UI** (`client-admin/src/app/(admin)/orders/page.tsx`):
  - Active Orders table with live dispatch queue, details drawer, dynamic actions, driver selection override list, and status filtering.
- **Flutter Customer/Driver App**:
  - Customer screens: `/customer/orders` (history list) and `/customer/track/:trackingToken` (interactive map tracking driver pin moving in real time with event details).
  - Driver Active Delivery: `/active-delivery` with maps routing, GPS updates, milestone buttons (Reached Store $\rightarrow$ Picked Up $\rightarrow$ Out For Delivery $\rightarrow$ Reached Location), and secure PIN entry dropoff.
    - **Geofence GPS verification**: Automatically retrieves current location via `Geolocator` when advancing milestones, passing coords to backend. Displays error SnackBars on boundary validation failures.
    - **Delivery Proof Photo Upload**: Integrated camera capture (`ImagePicker`) and upload to S3/MinIO via `/upload` multipart forms directly inside `PinEntryScreen`, passing S3 key upon dropoff completion.
- **Verification**:
  - Automated smoke test (`./scripts/smoke-test-orders.sh`) validating all 17 milestones (checkout $\rightarrow$ ignore $\rightarrow$ assign $\rightarrow$ delivery $\rightarrow$ pin $\rightarrow$ tracking) including geofenced coordinates and photo uploads runs and passes 100%.

---

### Module 10: Per-Store Payroll & Financial Settlement ✅ Completed
- **Database Schema**:
  - `payroll_configurations` table: Stores global defaults and store-specific overrides for pricing parameters.
  - `payroll_ledgers` table: Manages weekly settlement summaries, completed deliveries count, telemetry distance, base order earnings, mileage earnings, night surge bonuses, late delivery penalties, and clearing status.
- **Compensation & Surge Calculations**:
  - **Base Pay**: `perOrderRate` $\times$ completed orders.
  - **Distance Pay**: `perKmRate` $\times$ mileage covered. Distances are calculated by taking the Haversine formula sum between sequential driver location pings. If telemetry data is sparse (<2 pings), it falls back to the direct geodetic path between store coordinates and customer address coordinates.
  - **Night Surge**: Dynamic surge bonus applied if the order's `deliveredAt` timestamp hour is between 10 PM ($\ge 22$) and 6 AM ($< 6$).
  - **Weather Surge**: Applied based on order status modifiers.
  - **SLA Breach Penalty**: Deductions subtracted if delivery takes $>30$ minutes from order placement to customer handoff.
- **Backend API** (`server/src/features/payroll/`):
  - `GET /payroll/configurations` — fetches overrides list with server-side pagination (`page`, `limit`) and fuzzy store-name query searches.
  - `GET /payroll/configurations/:storeId` — retrieves configurations for a specific hub (returns custom overrides if present, falling back to global settings).
  - `POST /payroll/configurations` — creates/updates fallback defaults (`storeId: null`) or store overrides.
  - `DELETE /payroll/configurations/:id` — removes store override policies, reverting that store's billing queries back to global default rates.
  - `POST /payroll/generate` — generates weekly payroll ledger entries for a store hub.
  - `GET /payroll/ledgers` — retrieves paginated ledgers list filtered by status and store hubs, with backend search matching driver name, phone, or ledger record ID.
  - `PATCH /payroll/ledgers/:id` — updates settlement state (`draft`, `approved`, `hold`, `paid`) and logs bank payment reference IDs.
  - `GET /payroll/ledgers/export` — exports approved ledgers list as a bank-compliant CSV clearing file.
- **Admin Panel UI** (`client-admin/src/features/payroll/`):
  - Collapsible sidebar integration mapping Console, Ledger, and Settings sub-folders.
  - **Console Dashboard** (`/payroll`): selector form to generate payroll batches, and grid cards showing gross stats (payouts, active drivers, mileage, deliveries) for draft ledgers.
  - **Audit Ledger** (`/payroll/payouts`): displays paginated list of settlement records with inline detail modal breakdown, status toggling, bank CSV export trigger, and `<InfiniteSelect>` scroll-dropdown filter.
  - **Rates Settings** (`/payroll/settings`): global defaults configuration form, and backend-paginated custom store overrides list with live debounced name search and `<InfiniteSelect>` Target Hub picker.
- **Verification**:
  - Automated smoke test (`./scripts/smoke-test-payroll.sh`) validating all 14 milestones (get configurations, global defaults update, store override creation, override deletion, weekly payroll calculations, hold quarantine, and bank export clearing) runs and passes 100%.

---

## 4. Operational Commands

### Docker Compose Services
```bash
# Rebuild and start database, redis, osrm, backend, and admin containers
docker compose -f docker-compose.dev.yml up -d --build

# View container logs
docker compose -f docker-compose.dev.yml logs -f [service_name]
```

### Backend (`server/`)
```bash
# Start backend in watch-reload mode
bun run dev

# Run migrations on database
bun run db:migrate

# Seed database with root super admin (admin@gmail.com / Herovinay1@)
bun run db:seed

# Run TypeScript compilation checks
bun x tsc --noEmit
```

### Next.js Admin Panel (`client-admin/`)
```bash
# Start development server
npm run dev

# Run TypeScript compilation checks
bun x tsc --noEmit
```

### Flutter App (`client-app/`)
```bash
# Get packages
flutter pub get

# Run Flutter compiler check & code analyzer
flutter analyze
```

### Automated Smoke Tests
```bash
# Runs 16 core authentication test cases against http://localhost:8000
./scripts/smoke-test-auth.sh

# Runs 21 core catalog and pagination test cases against http://localhost:8000
./scripts/smoke-test-products.sh

# Runs 26 driver onboarding + manual creation test cases against http://localhost:8000
./scripts/smoke-test-driver-onboarding.sh

# Runs 17 E2E customer order, dispatch override, and tracking milestones against http://localhost:8000
./scripts/smoke-test-orders.sh

# Runs 14 E2E per-store payroll settlement and override rules checks against http://localhost:8000
./scripts/smoke-test-payroll.sh
```

