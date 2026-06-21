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
│   │   ├── core/               # App theme and style tokens
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
│   │   └── screens/            # Driver screens (dashboard, onboarding, tracking, pin verify)
│   └── pubspec.yaml
│
├── scripts/                    # Dev scripts and automated tests
│   ├── smoke-test-auth.sh              # 16 core authentication checks
│   ├── smoke-test-products.sh          # 21 catalog and pagination checks
│   └── smoke-test-driver-onboarding.sh # 26 driver onboarding + manual creation checks
│
├── specs/                      # Product specifications and UI wireframes
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

### Module 4: Store / Warehouse Management ✅ Completed
- **Database Schema**:
  - `stores` table with fields: `id`, `name`, `address`, `latitude`, `longitude`, `phone`, `isActive`, `createdAt`, `updatedAt`.
- **Backend API** (`server/src/features/stores/`):
  - `GET /stores` — lists stores with server-side search (`ilike` on name/address), `isActive` filter, and metadata pagination. Public access.
  - `POST /stores` — create a new store. Requires `super_admin` role.
  - `GET /stores/:id` — fetch a single store by ID. Public access.
  - `PATCH /stores/:id` — update store details (name, phone, location, status). Requires `super_admin` or `store_manager`.
  - `DELETE /stores/:id` — soft-delete with active order/driver constraint checks. Requires `super_admin`.
  - Zod schema validation (`createStoreSchema`, `updateStoreSchema`) with role-based middleware guards.
- **Admin Panel UI** (`client-admin/src/features/stores/`):
  - Store list table with debounced search, status filter dropdown, toggle active switch, edit and delete actions.
  - `StoreModal.tsx` — full create/edit form with:
    - Store name and phone fields with validation.
    - Active status toggle.
    - **Leaflet + OpenStreetMap** interactive map coordinate picker (no API key required).
    - Real-time Nominatim geocoding search with autocomplete dropdown.
    - **"Locate Me"** button using browser `navigator.geolocation` → auto-pins current GPS location.
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

# Seed database with root super admin (admin@gmail.com / Admin@1234)
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
```
