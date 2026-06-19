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
