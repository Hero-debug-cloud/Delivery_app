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
- **Bun Runtime** (v1.3.14+)
- **Flutter SDK** (v3.22.0+)
- Running instances of **PostgreSQL** (with PostGIS/TimescaleDB extensions enabled) and **Redis**.

### Spinning Up Services

1. **Backend Database & API Server**:
   ```bash
   cd server
   bun install
   # Configure environment variables in .env (copy from .env.example)
   bun run db:generate
   bun run db:migrate
   bun run dev       # Starts Hono on http://localhost:8000
   ```

2. **Web Admin Ops Dashboard**:
   ```bash
   cd client-admin
   bun install
   bun run dev       # Starts Next.js on http://localhost:3000
   ```

3. **Flutter Mobile Application**:
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
