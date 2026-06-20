# Hono Backend API Server Coding Standards

This guide defines the engineering practices, directory structure, and code style for the Bun + Hono API server.

---

## 1. Core Development Commands

- **Run Dev Server**: `bun run dev`
- **Start Production Server**: `bun run start`
- **Drizzle Schema Generate**: `bun run db:generate`
- **Drizzle Schema Migrate**: `bun run db:migrate`

---

## 2. Directory Architecture (Feature-Wise)

The backend code is organized into modular **Features** directories under `src/features/`.

```text
server/
├── drizzle/                    # Generated SQL migrations
├── src/
│   ├── db/                     # DB client configuration
│   │   ├── index.ts            # Client initialization
│   │   └── schema.ts           # Drizzle database tables
│   │
│   ├── redis/                  # Redis client initialization and cache keys
│   │   └── index.ts
│   │
│   ├── features/               # Backend Features (Domain division)
│   │   └── <feature_name>/     # E.g. auth, orders, stores, locations
│   │       ├── router.ts       # Hono route endpoints and schema validators
│   │       ├── controller.ts   # Route handlers (HTTP layer parsing)
│   │       ├── service.ts      # Business logic & DB query execution (Drizzle/Redis)
│   │       ├── types.ts        # TypeScript typings
│   │       └── index.ts        # Public API exports
│   │
│   └── index.ts                # Application Entrypoint (cors, logger, route binding)
```

---

## 3. Coding Guidelines

### Separating Controllers and Services
- **Controllers** (`controller.ts`) handle the HTTP translation layer: parsing query parameters/headers/request body, executing validation, and returning standard JSON payloads. They should not write SQL or connect to Redis directly.
- **Services** (`service.ts`) execute business workflows, database operations (via Drizzle ORM), and caching states (via Redis). Controllers must call Services to get data.
- Keep Hono endpoints clean by outsourcing logic to controllers:
  ```typescript
  // router.ts
  orders.post("/:id/assign", orderController.assignDriver);
  ```

### File Size Limits
- **Max File Length**: No single controller or service file should exceed **500 lines**.
- If logic gets complex, divide the service into sub-services (e.g., `location-service.ts`, `telemetry-processor.ts`) or create helper modules.

### Database Operations (Drizzle & Redis)
- Keep PostGIS operations wrapped inside spatial helper functions to keep schemas clean.
- Implement telemetry pings with a TimescaleDB-compatible time-series format (recorded timestamps).
- Use database transactions (`db.transaction()`) for all multi-table query blocks where consistency is critical.
- Put ephemeral, real-time caching logic (like driver geospatial keys) inside Redis helper namespaces (`src/redis/index.ts`).

### Request Validation & Safety
- Use request parameter validation on all incoming payload bodies before passing data to services.
- Always implement clean error catches in controllers and pass unexpected errors down to Hono's global `onError` middleware.

### Standardized API Responses & Pagination
- **Envelope Wrapping**: All success responses must wrap data inside `{ success: true, message: string, data: T }`.
- **Validation Errors**: For parsing/validation errors, return HTTP `400` with `{ success: false, message: "Validation Failed", errors: { [field]: string } }`.
- **Paginated Tables & Dropdowns**: Every paginated table/dropdown API must return standard pagination metadata block:
  ```json
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 45,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
  ```
- **Controller Responsibilities**: Fetch parameters like `page`, `limit`, `search`, `sortBy`, `sortOrder` from queries, perform count queries inside services, and compute pagination metadata directly in controllers.

---

## 4. Module Smoke Tests

Run after starting the API server (`bun run dev`):

```bash
# Authentication Smoke Tests (16 checks)
./scripts/smoke-test-auth.sh [BASE_URL]

# Products, Categories & Stores Smoke Tests (21 checks)
./scripts/smoke-test-products.sh [BASE_URL]
```

### Module 1 — Authentication (`src/features/auth/`)

| # | Test | Expected |
|---|---|---|
| 1 | `POST /auth/admin/login` valid creds | `200` + session cookie set |
| 2 | `POST /auth/admin/login` wrong password | `401` |
| 3 | `POST /auth/admin/login` unknown user | `401` |
| 4 | `GET /auth/me` with valid cookie | `200` + `user.id` in body |
| 5 | `GET /auth/me` without cookie | `401` |
| 6 | `POST /auth/admin/signup` valid new user | `201` + session cookie |
| 7 | `POST /auth/admin/signup` duplicate email | `409` |
| 8 | `POST /auth/admin/signup` password mismatch | `400` |
| 9 | `POST /auth/otp/request` valid phone | `200` |
| 10 | `POST /auth/otp/verify` wrong OTP | `401` |
| 11 | `POST /auth/otp/request` invalid phone (too short) | `400` |
| 12 | `POST /auth/logout` with valid session | `200` |
| 13 | `GET /auth/me` after logout | `401` |

**OTP Dev Note**: In development, OTPs are printed to the server console log:
```
[DEV OTP] phone: +91XXXXXXXXXX code: 123456
```
No real SMS is sent. For production, integrate Twilio/MSG91 inside `src/features/auth/service.ts#requestOtp`.
