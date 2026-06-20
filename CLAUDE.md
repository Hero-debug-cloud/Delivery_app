# LogiRoute — Developer Context & AI Guidelines (CLAUDE.md)

This file serves as the root-level developer guidelines and system context for AI coding assistants. Refer to this file at the start of every session to understand the technology stack, project structure, operations, and coding standards.

---

## 1. Core Technology Stack

- **Monorepo Runtime**: Bun is preferred for backend and admin scripting.
- **Backend API**: Bun + Hono API framework (Runs on port `8000`).
- **Database**: PostgreSQL (with PostGIS & TimescaleDB extensions) managed via **Drizzle ORM** (Runs on port `5432`).
- **Caching & OTPs**: Redis (Runs on port `6379`).
- **Operations Dashboard**: Next.js 15+ + React 19 + Zustand + Tailwind CSS v4 + TanStack Query + React Hook Form + shadcn/ui (Runs on port `3010` mapped to `3000`).
- **Mobile Client**: Flutter (BLoC / Cubit state management).
- **Routing Engine**: OSRM (Open Source Routing Machine) backend (Runs on port `5000`).

---

## 2. Directory Structure

```text
delivery_app/
├── server/                     # Bun + Hono Backend API
│   ├── drizzle/                # Generated SQL migrations
│   └── src/
│       ├── db/                 # DB connections & Drizzle schemas
│       ├── redis/              # Redis Client & configuration
│       └── features/           # Modular Domain Features (e.g., auth)
│
├── client-admin/               # Next.js Web Operations Dashboard
│   └── src/
│       ├── app/                # App Router Pages (routing shells only)
│       ├── features/           # Feature Modules (state, hooks, components)
│       ├── components/         # Shared UI components (shadcn/ui)
│       └── lib/                # Configs & core client utilities
│
├── client-app/                 # Flutter Mobile App (Unified driver/customer)
│   └── lib/
│       ├── core/               # Shared theme, assets, constants
│       └── features/           # Clean Architecture Feature Modules
│
├── scripts/                    # Dev scripts & automated tests
├── specs/                      # Requirements, PRDs & design tokens
└── docker-compose.yml          # Container configuration (Dev/Prod)
```

---

## 3. Core Development Commands

### Docker Compose
```bash
# Start all developer containers (DB, Redis, OSRM, Backend, Admin)
docker compose -f docker-compose.dev.yml up -d --build

# View logs for all or a specific service
docker compose logs -f [service_name]
```

### Backend (`server/`)
```bash
# Run backend with hot-reloading (port 8000)
bun run dev

# Generate Drizzle migration files
bun run db:generate

# Execute migration files against PostgreSQL
bun run db:migrate

# Seed database with super admin (admin@gmail.com / Admin@1234)
bun run db:seed
```

### Next.js Operations Dashboard (`client-admin/`)
```bash
# Run local dev server (port 3010)
npm run dev

# Run linting checks
bun run lint

# TypeScript compilation checks
bun x tsc --noEmit
```

### Flutter Mobile App (`client-app/`)
```bash
# Get Flutter dependencies
flutter pub get

# Run application on emulator/device
flutter run

# Run codebase analyzer
flutter analyze
```

### Automated Testing
```bash
# Run 16-point backend authentication smoke tests
./scripts/smoke-test-auth.sh

# Run 21-point backend products/categories smoke tests
./scripts/smoke-test-products.sh
```

---

## 4. Coding Standards & Guidelines

Refer to subdirectory specific rules:
- [client-admin/CLAUDE.md](file:///Users/me/Projects/delivery_app/client-admin/CLAUDE.md) (React / Next.js)
- [server/CLAUDE.md](file:///Users/me/Projects/delivery_app/server/CLAUDE.md) (Hono / Drizzle / DB)
- [client-app/CLAUDE.md](file:///Users/me/Projects/delivery_app/client-app/CLAUDE.md) (Flutter / BLoC)

### Key Architectural Guidelines:
1. **Modular Folders**: Put code into domain-specific features (e.g., `features/auth/`, `features/orders/`). Avoid giant global utility files.
2. **File Size Limits**: Max 500 lines for backend files and frontend components. Max 250 lines for Flutter widget build functions. Split code if it exceeds limits.
3. **Separation of Concerns**:
   - **Backend**: Keep route controllers (`controller.ts`) separate from business logic / queries (`service.ts`).
   - **Web Frontend**: Never put API request fetch code directly in React component files. Wrap queries/mutations in custom hooks inside `features/<name>/hooks/`.
   - **Mobile Client**: Views should be reactive. Encapsulate business logic in Cubits/BLoCs. Wrap network requests in data repositories inside `data/`.
4. **Backend-Driven Pagination & Filtering**:
   - All filtering, search, sorting, and pagination calculations must live on the backend.
   - Every paginated response must return a standardized JSON structure with a `pagination` metadata block.
   - The frontend must never perform calculations (like totals, total pages, page slicing, or next/prev availability) client-side.
   - Search text input filters must be debounced client-side to prevent keystroke-by-keystroke API spam.

---

## 5. Current Implementation Status

- **Module 1: Authentication System (Completed)**
  - Admin login/signup with custom session table and HTTP-only cookies.
  - Driver & customer phone OTP login. Dev OTPs are printed to the backend console: `[DEV OTP] phone: +91... code: 123456`.
  - All 16 automated checks pass 100% on the backend.
- **Module 2: Catalog & Storage Management (Completed)**
  - Created product categories management and linked products features.
  - Integrated local private MinIO object storage with auto-signed presigned URLs.
  - Standardized all catalog table/dropdown APIs to follow standardized envelope formats with server-side pagination, sorting, search, and filtering.
  - Verified with 21/21 backend products smoke checks.
- **Next Module in Queue**: Module 3: Active Store & Driver Association (See [mvp-v1.md](file:///Users/me/Projects/delivery_app/mvp-v1.md) for specs).
