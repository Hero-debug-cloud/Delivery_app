# Wireframe Spec: Web Login Page

## Route

```text
/auth/login
```

## Purpose

Allows admin-side users to sign in to the LogiRoute web control panel.

## MVP Source

From `mvp-v1.md`:

- Phone/email login for admin users.
- Role-based dashboard/app routing.
- Basic session management.
- Admin web users include Super Admin, Store Manager, and Dispatcher.

## Supported Roles

- Super Admin
- Store Manager
- Dispatcher

## Primary User Goal

The user enters credentials, signs in, and is redirected to the dashboard appropriate for their role.

## Page Layout

Desktop-first, responsive layout.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌──────────────────────────────┐   ┌──────────────────────────────────┐   │
│  │                              │   │                                  │   │
│  │          LogiRoute           │   │        Welcome back              │   │
│  │                              │   │                                  │   │
│  │  Last-mile delivery ops,     │   │  Email or phone                  │   │
│  │  dispatch, and live tracking │   │  ┌────────────────────────────┐  │   │
│  │  for modern logistics teams. │   │  │                            │  │   │
│  │                              │   │  └────────────────────────────┘  │   │
│  │  • Manage stores             │   │                                  │   │
│  │  • Assign orders             │   │  Password                        │   │
│  │  • Track drivers live        │   │  ┌────────────────────────────┐  │   │
│  │                              │   │  │                            │  │   │
│  └──────────────────────────────┘   │  └────────────────────────────┘  │   │
│                                     │                                  │   │
│                                     │  [ ] Remember me                 │   │
│                                     │                    Forgot?       │   │
│                                     │                                  │   │
│                                     │  ┌────────────────────────────┐  │   │
│                                     │  │          Sign In           │  │   │
│                                     │  └────────────────────────────┘  │   │
│                                     │                                  │   │
│                                     │  New admin? Create account       │   │
│                                     │                                  │   │
│                                     └──────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout

```text
┌──────────────────────────────┐
│          LogiRoute           │
│                              │
│        Welcome back          │
│                              │
│  Email or phone              │
│  ┌────────────────────────┐  │
│  └────────────────────────┘  │
│                              │
│  Password                    │
│  ┌────────────────────────┐  │
│  └────────────────────────┘  │
│                              │
│  [ ] Remember me   Forgot?   │
│                              │
│  ┌────────────────────────┐  │
│  │        Sign In         │  │
│  └────────────────────────┘  │
│                              │
│  New admin? Create account   │
└──────────────────────────────┘
```

## Fields

| Field | Type | Required | Validation |
| :--- | :--- | :---: | :--- |
| Email or phone | text | Yes | Must be valid email or phone format. |
| Password | password | Yes | Minimum 8 characters. |
| Remember me | checkbox | No | Extends session duration if checked. |

## Actions

### Sign In

```text
User submits form
  -> validate required fields
  -> call POST /auth/admin/login
  -> if success, store session/token
  -> call GET /auth/me or read returned user
  -> redirect by role
```

### Create Account Link

Navigates to:

```text
/auth/signup
```

### Forgot Password Link

Deferred for MVP. Link can show disabled message or route to a placeholder.

## Role Redirect Rules

```text
super_admin   -> /dashboard
store_manager -> /dashboard
// dashboard content is scoped by store/permissions
dispatcher    -> /dashboard
```

## Error States

### Invalid Credentials

```text
The email/phone or password is incorrect.
```

### Unauthorized Role

```text
This account does not have access to the admin web panel.
```

### Network Error

```text
Unable to sign in right now. Please check your connection and try again.
```

## Loading State

The Sign In button becomes disabled:

```text
Signing in...
```

## Component Checklist

- Logo/brand block
- Product value proposition panel
- Email/phone input
- Password input
- Remember me checkbox
- Forgot password link
- Sign In button
- Create account link
- Inline validation messages
- Global error alert

## Acceptance Criteria

- User cannot submit with empty required fields.
- User sees clear validation errors.
- Successful login redirects to `/dashboard`.
- Unauthorized mobile-only roles cannot access admin web.
- Login page is usable on desktop and mobile widths.

---

# Figma Screen Specification

## Figma Frames

Create two frames:

```text
Auth / Login / Desktop — 1440×1024
Auth / Login / Mobile — 390×844
```

Use shared tokens from:

```text
specs/wireframes/authentication/web/design-system.md
```

---

## Desktop Visual Composition

### Frame: `Auth / Login / Desktop`

```text
Frame size: 1440×1024
Background: #F8FAFC
Layout: horizontal, centered
Main container: 1120×720
Container position: x=160, y=152
Gap between panels: 80px
```

### Left Marketing Panel

```text
Position: x=160, y=152
Size: 560×720
Radius: 32px
Fill: Linear gradient
  Start: #0F172A
  End: #1D4ED8
Padding: 56px
```

#### Left Panel Content

```text
Logo lockup:
  x=216, y=208
  icon 40×40
  text “LogiRoute”
  color white

Headline:
  text: “Run last-mile delivery from one control room.”
  x=216, y=332
  width=420
  type: Display / 48
  color: #FFFFFF

Description:
  text: “Manage stores, dispatch orders, and track delivery partners live with an operations-first logistics platform.”
  x=216, y=468
  width=400
  type: Body / 16
  color: #DBEAFE

Feature list:
  x=216, y=572
  row gap=18
  items:
    • Live driver tracking
    • Manual order dispatch
    • Store-level operations
  icon: 20×20 check circle
  text color: #FFFFFF
```

#### Decorative Elements

Add subtle route-map decoration:

```text
Polyline route path:
  stroke: #FFFFFF
  opacity: 12%
  width: 2px
  position: behind text

Three location dots:
  size: 10×10
  fill: #60A5FA
  outer ring: #FFFFFF / 24%
```

---

### Right Login Card

```text
Position: x=800, y=222
Size: 480×580
Fill: #FFFFFF
Radius: 24px
Shadow: Card Shadow
Padding: 48px
```

#### Card Content Coordinates

```text
Title:
  text: “Welcome back”
  x=848, y=270
  width=384
  type: Heading / 32
  color: #020617

Subtitle:
  text: “Sign in to the LogiRoute admin control panel.”
  x=848, y=318
  width=384
  type: Body / 16
  color: #64748B

Email/phone label:
  x=848, y=374
  type: Body Medium / 16

Email/phone input:
  x=848, y=406
  size: 384×48
  placeholder: “admin@company.com or +1 555 000 0000”

Password label:
  x=848, y=478

Password input:
  x=848, y=510
  size: 384×48
  placeholder: “Enter password”
  trailing icon: eye, 20×20

Remember me checkbox:
  x=848, y=582
  checkbox size: 16×16
  text: “Remember me”

Forgot password link:
  x=1126, y=580
  text: “Forgot?”
  color: #2563EB

Sign In button:
  x=848, y=630
  size: 384×48
  text: “Sign In”

Divider/support text:
  x=848, y=702
  text: “New admin?”
  link: “Create account”
```

---

## Mobile Visual Composition

### Frame: `Auth / Login / Mobile`

```text
Frame size: 390×844
Background: #FFFFFF
Padding: 24px
```

### Mobile Content

```text
Logo lockup:
  x=24, y=40
  icon: 36×36
  text: “LogiRoute”

Title:
  text: “Welcome back”
  x=24, y=132
  width=342
  type: Heading / 24

Subtitle:
  text: “Sign in to manage delivery operations.”
  x=24, y=172
  width=342
  type: Body / 16
  color: #64748B

Email/phone input group:
  label x=24, y=236
  input x=24, y=268, size=342×48

Password input group:
  label x=24, y=340
  input x=24, y=372, size=342×48

Remember + forgot row:
  x=24, y=444
  width=342

Sign In button:
  x=24, y=500
  size=342×48

Create account text:
  x=24, y=580
  centered within width 342
```

Mobile removes the marketing panel entirely.

---

## Figma Variants / States

Create component variants for:

### Input States

```text
Default
Focused
Error
Disabled
```

### Button States

```text
Default
Hover
Pressed
Loading
Disabled
```

### Screen States

```text
Default
Validation error
Invalid credentials error
Network error
Loading after submit
```

---

## Error State Visuals

### Global Error Alert

```text
Position desktop: x=848, y=350
Size: 384×44
Fill: #FEF2F2
Border: #FCA5A5
Radius: 8px
Text color: #DC2626
Icon: alert-circle 18×18
```

When visible, push form fields down by 56px.

### Field Error

```text
Border: #DC2626
Helper text: #DC2626, Caption / 14
Gap below input: 6px
```

---

## Implementation Notes

- This screen maps to Next.js route `/auth/login`.
- Use shadcn/ui `Card`, `Input`, `Button`, `Checkbox`, and `Alert` equivalents.
- The Figma form card should match implementation spacing exactly.
