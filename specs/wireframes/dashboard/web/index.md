# Wireframe Spec: Dashboard Index

## Route

```text
/dashboard
```

## Purpose

Entry route for authenticated admin users. Loads the dashboard overview screen. No redirect logic is needed here beyond confirming the session is valid and the user has an admin web role.

## MVP Source

From `mvp-v1.md`:

- Admin users are redirected to `/dashboard` after login.

## Supported Roles

- Super Admin
- Store Manager
- Dispatcher

## Redirection Rules

```text
IF user has valid admin session:
  render /dashboard → overview.md content

IF session is expired or invalid:
  redirect to /auth/login

IF user role is not allowed on web (delivery_partner, customer):
  redirect to /auth/login with error message
```

## Loading State

```text
┌──────────────────────────────────────────────┐
│ [sidebar skeleton]  [content skeleton]       │
│                     ████████████ ███████     │
│                     ████ ████ ████ ████      │
│                                              │
│                     [map placeholder]        │
└──────────────────────────────────────────────┘
```

## Acceptance Criteria

- Authenticated users land on `/dashboard` and see the overview.
- Unauthenticated users are redirected to `/auth/login`.
- Non-web roles are not allowed in.
