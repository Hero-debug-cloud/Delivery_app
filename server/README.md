# LogiRoute Backend API Services

Hono API server running on **Bun** with **Drizzle ORM** (mapping Postgres/PostGIS/TimescaleDB tables) and **Redis** cache.

---

## 1. Development Commands

### Installation & Run (Local)
- `bun install` — Fetch package dependencies.
- `bun run dev` — Launch Hono live reload server on port 8000 (`src/index.ts`).
- `bun run start` — Run API server in production mode.

### Installation & Run (Docker)
- `docker build -t logiroute-api .` — Build Bun/Hono image.
- Refer to the root [docker-compose.yml](file:///Users/me/Projects/delivery_app/docker-compose.yml) to launch the full container stack (API, DB, Redis, OSRM).

### Database Migrations
- `bun run db:generate` — Generate SQL migration schemas from schemas defined in typescript.
- `bun run db:migrate` — Execute migrations against the target Postgres instance.

### Database Initialization Script
- **[`init.sql`](file:///Users/me/Projects/delivery_app/server/init.sql)**: Placed in the server directory and mounted inside the PostgreSQL container to automatically load `postgis` and `timescaledb` extensions.

---

## 2. Environment Variables (`.env`)

Copy the template [.env.example](file:///Users/me/Projects/delivery_app/server/.env.example) to `.env` and adjust the variables:
```ini
PORT=8000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/logiroute
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

## 3. Directory Layout

- **`src/index.ts`** — Root entry point. Binds CORS, Logger, and hooks up the router groups.
- **`src/db/`** — Database client initialization ([`index.ts`](file:///Users/me/Projects/delivery_app/server/src/db/index.ts)) and tables/relations schema mapping ([`schema.ts`](file:///Users/me/Projects/delivery_app/server/src/db/schema.ts)).
- **`src/redis/`** — Redis connection wrapper ([`index.ts`](file:///Users/me/Projects/delivery_app/server/src/redis/index.ts)) providing namespacing for driver location keys and user sessions.
- **`src/features/`** — Isolated modules mapping the core services (Auth, Stores, Delivery Partners, Orders, Location tracking, Customer links).

---

## 4. API Endpoints Map

### Authentication
- `POST /auth/admin/login` — Sign in dispatcher/manager.
- `POST /auth/otp/request` — Ask for OTP ping (delivery partners).
- `POST /auth/otp/verify` — Validate OTP token.
- `GET  /auth/me` — Retrieve active profile.

### Stores
- `GET    /stores` — Query configured stores.
- `POST   /stores` — Add a new dispatch store.
- `PATCH  /stores/:id` — Edit store parameters.
- `DELETE /stores/:id` — Deactivate/delete store.

### Delivery Partners
- `GET   /delivery-partners` — Query driver list.
- `POST  /delivery-partners/:id/status` — Modify duty status (`online`, `offline`, `busy`).

### Orders
- `POST /orders` — Add manual order.
- `POST /orders/ingest` — Ingest external order feeds.
- `POST /orders/:id/assign` — Dispatch driver assignment.
- `POST /orders/:id/accept` — Accept order (driver).
- `POST /orders/:id/picked-up` — Confirm pickup (driver).
- `POST /orders/:id/delivered` — Confirm delivery using customer 4-digit PIN verification.

### Telemetry & Tracking
- `POST /locations/ping` — Record GPS telemetry ping (lat/lng, speed, battery).
- `GET  /locations/drivers/:driverId/latest` — Fetch last coordinate.
- `GET  /locations/orders/:orderId/history` — Query order travel path.
- `GET  /track/:trackingToken` — Customer tracking status page details.
