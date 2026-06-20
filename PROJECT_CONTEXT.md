# LogiRoute — Developer Context & Project Blueprint

This file serves as a single source of truth for the codebase architecture, technology stack, completed features, and commands. Read this file first in any new session to avoid scanning the entire project.

---

## 1. Core Technology Stack

- **Backend**: Bun + Hono API framework (Runs on port `8000`).
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
│   │   │   └── auth/           # Module 1: Auth APIs (Login, Signup, OTP, Session, Logout)
│   │   └── index.ts            # Hono application entry point & CORS
│   └── package.json
│
├── client-admin/               # Next.js Admin Panel
│   ├── src/
│   │   ├── app/                # App router (dashboard, login, tracking, CRUD pages)
│   │   ├── features/           # Modular Domain Features
│   │   │   └── auth/           # Login / Signup forms, store, hook state
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
│   └── smoke-test-auth.sh      # Bash script running 16 auth checks against API
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
  - Fully integrated with `AuthGuard` client shells in Next.js Admin and Cubits in the Flutter mobile app.

---

## 4. Operational Commands

### Docker Compose Services
```bash
# Rebuild and start database, redis, osrm, backend, and admin containers
docker compose up -d --build

# View container logs
docker compose logs -f [service_name]
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
```
