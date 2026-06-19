# LogiRoute — Last-Mile Delivery Operations Platform

LogiRoute is an enterprise-grade last-mile delivery operations platform designed for dispatchers, store managers, customers, and delivery partners.

This repository is structured as a **monorepo** containing the backend services, the web operations dashboard, and the mobile application.

---

## 1. Project Repository Structure

- **[`server/`](file:///Users/me/Projects/delivery_app/server/)** — Bun + Hono + Drizzle ORM API backend. Coordinates orders, store settings, driver telemetry tracking, and authentication.
- **[`client-admin/`](file:///Users/me/Projects/delivery_app/client-admin/)** — Next.js 15+ + Tailwind CSS v4 + shadcn/ui admin operations dashboard. Handles dispatcher queues, store creations, and live fleet maps.
- **[`client-app/`](file:///Users/me/Projects/delivery_app/client-app/)** — Flutter mobile application. A single unified app codebase with dedicated workflows for **Delivery Partners** (online duty, GPS pings, order accepts, PIN completions) and **Customers** (live tracking lookup).
- **[`specs/`](file:///Users/me/Projects/delivery_app/specs/)** — Product wireframe requirements and global design system tokens (colors, typography scales, spaces).

---

## 2. Technology Stack Overview

| Component | Layer | Core Technologies |
| :--- | :--- | :--- |
| **Backend** | Runtime / API | Bun, Hono API Framework, CORS, Logger |
| | Database / ORM | PostgreSQL + Drizzle ORM |
| | Extensions | PostGIS (spatial routes/catchments), TimescaleDB (driver telemetry logs) |
| | Cache / Geo | Redis (ephemeral GPS keys, TTL sessions) |
| **Admin Web** | UI / Layout | Next.js (App Router), Tailwind CSS v4, shadcn/ui |
| | State / Queries | Zustand (storage cache), TanStack Query (server caching), Zod |
| **Mobile App** | Engine | Flutter (Unified Android/iOS/Web) |
| | Architecture | BLoC, GoRouter, Geolocator (10s telemetry pings), Google Maps |

---

## 3. Quick Start Guide

Detailed setup steps are located inside each subdirectory's `README.md`. Below is a quick overview to spin up the development environment.

### Pre-requisites
- **Docker Desktop** (or Docker Engine + Compose plugin)
- **Bun Runtime** (optional, for local development outside Docker)
- **Flutter SDK** (for the mobile application)

### Spinning Up Services (Single Command)

You can spin up the production or development environments using Docker:

#### 1. Production Mode
Runs the backend API, DB, Redis, OSRM, and the compiled Next.js admin frontend:
```bash
docker-compose up --build
```

#### 2. Local Development Mode (with Live Reload / Hot Reload)
Runs all services (DB, Redis, OSRM, API Backend, and Admin Frontend) in local development mode. Any changes you make to the backend files in `server/` or frontend files in `client-admin/` will trigger instant hot-reload/recompilation:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

This command will:
1. Initialize the Postgres container and automatically enable PostGIS + TimescaleDB.
2. Spin up Redis on port 6379.
3. Run the Hono API server in hot-reload watch mode (`bun run dev`) on http://localhost:8000.
4. Run the Next.js admin frontend in development mode (`next dev`) on http://localhost:3010.
5. Bind-mount the source folders so any code changes sync instantly to the containers.
6. Mount the OSRM container on port 5000.

#### Setting up OSRM road map data:
By default, the OSRM container looks for a map file in `./osrm-data/map.osrm`. To load your city's routing map:
1. Download an OSM PBF file (e.g. `bangalore.osm.pbf`) from [Geofabrik](https://download.geofabrik.de/).
2. Place the file inside a folder named `./osrm-data/` in the project root.
3. Run the processing commands:
   ```bash
   docker run -t -v "${PWD}/osrm-data:/data" osrm/osrm-backend osrm-extract -p /opt/car.lua /data/bangalore.osm.pbf
   docker run -t -v "${PWD}/osrm-data:/data" osrm/osrm-backend osrm-partition /data/bangalore.osrm
   docker run -t -v "${PWD}/osrm-data:/data" osrm/osrm-backend osrm-customize /data/bangalore.osrm
   # Rename bangalore.osrm to map.osrm
   mv osrm-data/bangalore.osrm osrm-data/map.osrm
   ```
4. Restart OSRM: `docker-compose restart osrm`.

### Running Client Dashboards

1. **Web Admin Ops Dashboard**:
   ```bash
   cd client-admin
   bun install
   bun run dev       # Starts Next.js on http://localhost:3000
   ```

2. **Flutter Mobile Application**:
   ```bash
   cd client-app
   flutter pub get
   flutter run       # Runs on emulator or connected device
   ```

---

## 4. Development & AI Agent Guidelines
Each workspace contains a `CLAUDE.md` file detailing command syntax, folder architectures, and coding standards. If you are developing with agentic coding assistants (like Antigravity or Claude), ensure they respect these files:
- [client-admin/CLAUDE.md](file:///Users/me/Projects/delivery_app/client-admin/CLAUDE.md)
- [server/CLAUDE.md](file:///Users/me/Projects/delivery_app/server/CLAUDE.md)
- [client-app/CLAUDE.md](file:///Users/me/Projects/delivery_app/client-app/CLAUDE.md)
