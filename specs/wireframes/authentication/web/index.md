# Wireframe Spec: Authentication Web Index

## Route

```text
/auth
```

## Purpose

Entry point for web authentication. This page does not show a full UI. It redirects users to the correct authentication or dashboard route based on session state.

## MVP Source

From `mvp-v1.md`:

- Admin web supports login.
- Role-based dashboard/app routing is required.
- Basic session management is required.

## User Types

- Super Admin
- Store Manager
- Dispatcher

Delivery Partners and Customers use mobile/OTP flows and are not the primary users of this web route.

## Redirection Rules

```text
IF user has no valid session:
  redirect to /auth/login

IF user has valid session AND role == super_admin:
  redirect to /dashboard

IF user has valid session AND role == store_manager:
  redirect to /dashboard

IF user has valid session AND role == dispatcher:
  redirect to /dashboard

IF user has valid session BUT role is not allowed on web:
  show access denied OR redirect to mobile app information page
```

## Page Wireframe

This page should only show a temporary loading state while session validation runs.

```text
┌──────────────────────────────────────────────┐
│                                              │
│                                              │
│                 LogiRoute                    │
│                                              │
│             Checking session...              │
│                                              │
│                  [spinner]                   │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

## UI Components

- Centered brand name: `LogiRoute`
- Loading text: `Checking session...`
- Spinner/loading indicator

## Empty/Error States

### Session Check Failed

```text
Unable to verify your session.
[Try Again] [Go to Login]
```

## Acceptance Criteria

- Visiting `/auth` redirects unauthenticated users to `/auth/login`.
- Authenticated web users are redirected to `/dashboard`.
- Delivery Partner or Customer roles are not allowed into the admin dashboard.
- Session validation shows a loading state before redirect.

---

# Figma Screen Specification

## Figma Frame

```text
Auth / Redirect / Desktop — 1440×1024
```

## Visual Composition

```text
Frame size: 1440×1024
Background: #F8FAFC
Content alignment: center both axes
```

## Center Loading Card

```text
Position: x=520, y=362
Size: 400×300
Fill: #FFFFFF
Radius: 24px
Shadow: Card Shadow
Padding: 48px
Alignment: center
```

## Elements

```text
Logo icon:
  x=692, y=410
  size=56×56
  radius=16px
  fill: linear gradient #2563EB -> #1D4ED8

Brand text:
  text: “LogiRoute”
  x=620, y=490
  width=200
  align=center
  type: Heading / 32
  color: #020617

Status text:
  text: “Checking session...”
  x=620, y=542
  width=200
  align=center
  type: Body / 16
  color: #64748B

Spinner:
  x=708, y=594
  size=24×24
  stroke: #2563EB
```

## Error Variant

Create variant:

```text
Auth / Redirect / Error / Desktop
```

Replace status section with:

```text
Title: “Unable to verify your session”
Description: “Please try again or return to login.”
Buttons:
  Primary: “Try Again”
  Secondary: “Go to Login”
```

## Implementation Notes

- This is a transient redirect page.
- It should usually display for less than 1 second.
- It still needs a polished state because slow networks may expose it.
