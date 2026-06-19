# LogiRoute Operations Dashboard

Next.js 15+ App Router web portal integrated with **Tailwind CSS v4** and **shadcn/ui** components. Used by dispatchers, store managers, and admins to orchestrate last-mile logistics.

---

## 1. Development Commands

- `bun install` — Fetch package dependencies.
- `bun run dev` — Launch hot-reload dev server on port 3000.
- `bun run build` — Compile production static build outputs (compiles TS and runs ESLint).
- `bun run lint` — Lint files.

---

## 2. Global State & Validation Architecture

This project is built around modern React libraries:
- **Zod**: Used to construct schema definitions and validate form inputs.
- **Zustand**: Lightweight client storage manager. Keeps global settings and caching variables persisted in `localStorage`.
- **React Hook Form**: Manages complex form states with optimized input re-renders.
- **TanStack Query (React Query)**: Handles backend API synchronizations, query mutations, cache invalidations, and HTTP error states.

---

## 3. Directory Layout

- **`src/app/`** — Routing boundaries only. Contains route segments (`login/`, `(admin)/dashboard/`, `(admin)/stores/`, `(admin)/orders/`).
- **`src/app/globals.css`** — Main Tailwind CSS file. Defines custom theme variables (colors, border radii, card shadows) matching the design system specifications.
- **`src/components/ui/`** — Reusable, atomic shadcn/ui components (buttons, inputs, cards, tables).
- **`src/features/`** — Contains all actual business logic, split by feature name (e.g., `orders/`, `stores/`, `tracking/`). Each feature folder houses its specific UI components, data hooks, types, and api.ts queries.

---

## 4. UI Design Tokens

Refer to `src/app/globals.css` to use configured brand variables:
- **Primary Blues**: `bg-primary-600` for main CTAs, `text-primary-900` for branding, `bg-primary-50` for highlight backgrounds.
- **Neutral slates**: `bg-neutral-50` for main body background, `text-neutral-950` for headings, `border-neutral-200` for dividers.
- **Logistics Status**: Custom status color tokens (e.g. `bg-status-assigned`, `bg-status-delivered`, `bg-status-failed`).
- **Radii**: `rounded-md` (12px), `rounded-lg` (24px) for cards.
- **Shadows**: `shadow-card` for floating cards, `shadow-button-primary` for action buttons.
