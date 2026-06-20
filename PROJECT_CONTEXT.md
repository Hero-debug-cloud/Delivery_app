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
│   │   │   ├── auth/           # Module 1: Auth APIs (Login, Signup, OTP, Session, Logout)
│   │   │   ├── products/       # Module 2: Catalog Management (Products, Categories, DB queries)
│   │   │   ├── upload/         # Module 2: S3 File Upload Router and Storage Signers
│   │   │   └── delivery-partners/ # Module 3: Delivery Partners Onboarding and Management
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
│   │   │   └── upload/         # ImageUploadField drag & drop S3 client wrappers
│   │   └── lib/                # AuthGuard, QueryProvider client shell wrappers
│   └── package.json
│
├── client-app/                 # Flutter Mobile App
│   ├── lib/
│   │   ├── core/               # App theme and style tokens
│   │   ├── features/           # Modular Domain Features
│   │   │   └── auth/           # remote client repositories, state managers, OTP screens
│   │   └── screens/            # Dashboards, simulated active tracking, pin verify
│   └── pubspec.yaml
│
├── scripts/                    # Dev scripts and automated tests
│   ├── smoke-test-auth.sh      # Bash script running 16 auth checks against API
│   └── smoke-test-products.sh  # Bash script running 21 catalog checks against API
│
├── specs/                      # Product specifications and UI wireframes
└── docker-compose.yml          # Dev & Prod container services manager
```

---

## 3. Implemented Modules

### Module 1: Authentication System (Completed)
- **Database Sessions**: Custom `sessions` database table (HttpOnly Lax Session Cookie) for Next.js Admin Panel.
- **OTP Verification**: Redis-backed temporary OTP storage (5-minute TTL) printed to console in development.
- **Admin Roles**: Supports `super_admin`, `store_manager`, and `dispatcher`.
- **API Endpoints**:
  - `POST /auth/admin/login` (email/phone + password comparison via `Bun.password.verify`)
  - `POST /auth/admin/signup` (creates admin profile and starts session)
  - `POST /auth/otp/request` (initiates 6-digit verification code generation)
  - `POST /auth/otp/verify` (validates OTP, deletes Redis key, returns session)
  - `GET /auth/me` (retrieves session profiles)
  - `POST /auth/logout` (destroys active session)
- **Verification**: 
  - Automated bash smoke tests (`./scripts/smoke-test-auth.sh`) run 16 checks and pass 100%.

### Module 2: Catalog & Storage Management (Completed)
- **Backend-Driven Catalog Operations**:
  - Moved all list search (`ilike`), sorting (`name`, `price`, `createdAt`), and filters (`storeId`, `categoryId`, `inStock`, `isVeg`) to the Hono backend.
  - Implemented server-side metadata pagination (`page`, `limit`, `totalItems`, `totalPages`, `hasNext`, `hasPrevious`).
- **Private Object Storage (MinIO / S3)**:
  - Setup `/upload` route with file-size validation (<5MB) and MIME-type restrictions.
  - Dual S3 Client Setup: Configured `s3Client` for internal container-to-container network queries (`minio:9000`) and a dedicated `signingS3Client` for local-host browser resolutions (`localhost:9000`).
  - Added URL parameter cleaner (`extractS3Key` in `s3.ts`) to extract raw keys (e.g. `uploads/uuid.png`) from presigned URLs, avoiding database pollution on edits.
- **Web Frontend Integration**:
  - Deleted all client-side array sorting/filters in `client-admin/src/app/(admin)/products/page.tsx`.
  - Configured infinite-scroll selectors (`InfiniteSelect`) for Category/Store associations.
  - Added standard `PaginationFooter` that binds directly to backend-provided metadata.
- **Verification**:
  - Automated bash smoke tests (`./scripts/smoke-test-products.sh`) run 21 catalog checks and pass 100%.

### Module 3: Driver Onboarding & Management (In Progress)
- **Database Schema**:
  - Extended `drivers` schema to support onboarding statuses (`pending`, `submitted`, `approved`, `rejected`), rejection reasons, license details (number, expiry, front/back URLs), identity proofs (type, number, image), and profile pictures.
- **Onboarding API**:
  - Added `/upload` permissions for `delivery_partner` to support onboarding uploads.
  - Implemented `PATCH /delivery-partners/me/onboard` endpoint for driver details submission.
  - Implemented admin control routes: `GET /delivery-partners`, `POST /delivery-partners/:id/approve`, and `POST /delivery-partners/:id/reject`.

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
```
