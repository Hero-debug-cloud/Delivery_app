# Next.js Admin Coding Standards & Guidelines

This guide defines the engineering practices, directory structure, and code style for the Next.js admin frontend.

---

## 1. Core Development Commands

- **Start dev server**: `bun run dev`
- **Build production bundle**: `bun run build`
- **Run linter**: `bun run lint`

---

## 2. Directory Architecture (Feature-Wise)

We employ a **Feature-Wise** modular layout to keep modules self-contained. All code should reside under these boundaries:

```text
client-admin/
├── src/
│   ├── app/                    # Next.js App Router (Routing only)
│   │   ├── layout.tsx          # Global template shell
│   │   ├── page.tsx            # App root (redirect to login)
│   │   ├── login/
│   │   │   └── page.tsx        # Login route entrypoint
│   │   └── (admin)/            # Admin Ops shell group
│   │       ├── dashboard/
│   │       │   └── page.tsx    # Dashboard route entrypoint
│   │       ├── stores/
│   │       │   └── page.tsx    # Stores route entrypoint
│   │       └── ...
│   │
│   ├── features/               # Feature Modules (All logic lives here)
│   │   └── <feature_name>/     # E.g. orders, stores, tracking
│   │       ├── components/     # UI elements specific to this feature
│   │       ├── hooks/          # Custom hooks handling logic & API calls
│   │       ├── api.ts          # API query handlers (Fetch/Axios)
│   │       ├── types.ts        # TypeScript typings
│   │       └── index.ts        # Public API exports for other modules
│   │
│   ├── components/             # Global Shared Components
│   │   ├── ui/                 # Atomic design components (shadcn/ui)
│   │   └── shared/             # Custom cross-feature templates
│   │
│   ├── lib/                    # Core library initializations (utils, configurations)
│   └── styles/                 # Custom global stylesheets
```

*Rule: The `src/app/` folder should only act as route routing handlers. All business logic, state rendering, and custom hooks should be imported from `src/features/`.*

---

## 3. Coding Guidelines

### Component Size Limits
- **Max Component Length**: No single React component file should exceed **500 lines**.
- If a component grows larger than 500 lines, extract its nested sub-elements into standalone files within its feature's `components/` subfolder.

### Separation of Concerns (API & Hooks)
- Never invoke API requests (`fetch`, `axios`) directly inside a React component's body.
- Encapsulate all state orchestration, validation, and API fetch executions in **custom hooks** inside the feature's `hooks/` folder (e.g., `useStores.ts`, `useActiveDrivers.ts`).
- React components must remain purely declarative view layers that read from hooks and trigger actions.

### State & Storage Management (Zustand)
- Use **Zustand** for lightweight global state and client-side storage cache.
- Apply Zustand's `persist` middleware for states that need to persist across page reloads (e.g., user sessions, layout settings, local caching preferences).
- Ensure store states are cleanly isolated under `src/features/<feature>/store.ts` or `src/lib/store.ts` for global variables.

### Form Validation (React Hook Form + Zod)
- Use **React Hook Form** combined with **Zod Schema validation** (`zodResolver`) for all forms and interactive inputs.
- Always declare Zod schemas explicitly (e.g., `const storeSchema = z.object({...})`) and validate data on submit.
- Avoid raw state-controlled forms for complex operational screens to prevent redundant page re-renders.

### Server Cache Synchronization (TanStack Query)
- Use **TanStack Query** (`useQuery`, `useMutation`) to cache backend API responses, manage loading states, and handle background syncs.
- Wrap TanStack hooks inside custom hooks to shield components from raw query details.
- Validate API responses using Zod schemas during query execution to enforce data integrity.

### Styling & Theme Tokens
- Refer to variables defined inside `src/app/globals.css` rather than hardcoding colors.
- Use Tailwind CSS v4 design tokens (`bg-primary-600`, `text-neutral-950`, `shadow-card`, etc.) to match the brand specifications.
- Maintain responsive layout designs focusing on Desktop templates for operations screens and Mobile-responsiveness for public pages.

---

## 4. Module Smoke Tests

### Module 1 — Authentication (Manual UI Verification)

After running the dev server (`bun run dev` in `client-admin/`):

| # | Test | Expected |
|---|---|---|
| 1 | Visit `/login` unauthenticated | Login page renders, no redirect loop |
| 2 | Submit empty form | Inline validation errors shown, no API call |
| 3 | Submit wrong password | Red error banner: "Invalid email/phone or password" |
| 4 | Login with `admin@gmail.com` / `Admin@1234` | Redirect to `/dashboard`, session persists on refresh |
| 5 | Visit `/dashboard` without cookie | Redirected to `/login` |
| 6 | User name/role visible in sidebar footer after login | Sidebar shows real user name and role |
| 7 | Click Sign Out | Clears session, redirects to `/login` |
| 8 | Visit `/auth/signup`, fill form, submit | Creates account, redirects to `/dashboard` |
| 9 | Signup with duplicate email | Shows "An account with this email already exists" |
| 10 | Signup with mismatched passwords | Inline error shown before API call |

**Auth Store**: User session is persisted in `localStorage` via Zustand `persist` middleware (`logiroute-auth` key). Clear it to test unauthenticated state.
