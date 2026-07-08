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

## 3. Platform Features Breakdown

The platform consists of ten core modular components:

### 1. Secure Authentication & Session System
* **Dual-Role OTP Auto-Registration**: Initiates 6-digit verification challenges with a 5-minute Redis TTL. Dynamically creates Customer or Delivery Partner profiles on first verification.
* **Database Sessions**: Employs HttpOnly Lax session cookies for Next.js Admin Panel security.
* **Role-Based Guards**: Restricts APIs and client screens according to administrative levels (`super_admin`, `store_manager`, `dispatcher`), `delivery_partner`, or `customer`.

### 2. Catalog & Object Storage Management
* **Fuzzy Catalog Queries**: Supports server-side search (`ilike`), sorting, and multi-field filters (`categoryId`, `inStock`, `isVeg`).
* **Multi-Image Drag-and-Drop**: Web console form uploading up to 5 images with type/size validation and real-time progress indicators.
* **Dual S3/MinIO Setup**: Utilizes discrete signing connections for internal docker-to-docker operations (`minio:9000`) and external browser geolocations (`localhost:9000`).

### 3. Driver Onboarding Verification
* **Multi-Step Onboarding Form**: Mobile document upload flow (Selfie, Driving License, Identity Proof) built with Flutter `image_picker`.
* **Admin Verification Queue**: Visual document verification modal for approving or rejecting applications (saves rejection reasons for re-submission).
* **Manual Driver Creation**: Admin panel form creating driver profiles directly with OTP sign-in.

### 4. Stores & PostGIS Catchment Boundaries
* **Interactive Map Picker**: Leaflet and OpenStreetMap picker with reverse Nominatim geocoding and browser GPS geolocations.
* **Catchment Editors**: Boundary drawing tools on Leaflet allowing admins to draw custom service polygons or auto-generate 5km service hexagons.
* **PostGIS Serviceability Checks**: Backend Spatial containment check (`ST_Contains`) confirming if coordinates fall within active catchment polygons.

### 5. Flutter Customer Client
* **Smooth Catalog Navigation**: Category tabs, product search screens, and detail overlays.
* **Cart BLoC Cubit**: Implements reactive cart states calculating handling charges, tax rates, and free delivery thresholds.
* **Saved Addresses**: Coordinates and label options (Home, Work, Other) indicating default targets.

### 6. Staff & Customer Management
* **Staff Panel**: Paginated lists of store managers, dispatchers, and administrators.
* **Customer Panel**: Auditing registered users, contact info, and activity histories.
* **Glassmorphic Forms**: Modal editors using Zustand and React Hook Form validation.

### 7. Shift Management & Location Telemetry
* **Shift Association**: Geofenced go-live button requiring driver to be within 100m of their store hub before starting shifts.
* **GPS Telemetry Timer**: Periodic background scheduler (10-second intervals) logging location pings (speed, coords, battery levels) to Redis GEO indices and TimescaleDB.
* **Route Replay Playback**: Linear interpolation (LERP) rendering at 60fps, speed control multipliers (2x - 300x), and RDP path-simplification reducing data payload size by 90%.

### 8. Order Lifecycle & Geofenced Milestone Tracking
* **checkout & Dispatch**: Idempotent order checkouts, broadcast notifications, and dispatcher manual override assignment.
* **Geofenced Milestones**: GPS checks on pickup (`/reached-store`) and dropoff (`/reached-location`) locking controls if driver is >100m from coordinates.
* **Dropoff PIN Handshake**: Verifies correct recipient PIN code, uploads delivery proof photos to S3/MinIO, and generates public event timelines.

### 9. Per-Store Payroll & Settlement
* **Override Rates System**: Custom default parameters override global fallback configurations per hub.
* **Salary Calculations**: Weekly payout batches calculating base commission rates, mileage calculations from telemetry pings, night surge bonuses (10 PM to 6 AM), and SLA breach penalties.
* **Scale-Optimized UI**: Infinite scroll selectors and debounced search fields loading thousands of items efficiently.
* **Bankcsv Export**: Exports approved ledger groups directly as bank-clearing CSV files.
* **E2E Smoke Tests**: Automated testing suite (`smoke-test-payroll.sh`) runs 14 test cases.

---

## 4. Quick Start Guide

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
