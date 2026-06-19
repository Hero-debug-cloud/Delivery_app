# Wireframe Spec: Web Sign Up Page

## Route

```text
/auth/signup
```

## Purpose

Allows a new admin-side user to create an account on the LogiRoute web control panel. Super Admins can also create users from the admin panel, but this screen handles self-registration flows initiated from the login page.

## MVP Source

From `mvp-v1.md`:

- Phone/email login for admin users.
- Role-based dashboard/app routing.
- Basic session management.

## Supported Roles

- Super Admin
- Store Manager
- Dispatcher

## Primary User Goal

The user fills in their details, creates an account, and is redirected to the dashboard.

## Page Layout

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│  ┌──────────────────────────────┐   ┌──────────────────────────────────┐   │
│  │                              │   │                                  │   │
│  │          LogiRoute           │   │      Create your account         │   │
│  │                              │   │                                  │   │
│  │  Run last-mile delivery      │   │  Full name                       │   │
│  │  from one control room.      │   │  ┌────────────────────────────┐  │   │
│  │                              │   │  └────────────────────────────┘  │   │
│  │  • Live driver tracking      │   │                                  │   │
│  │  • Manual order dispatch     │   │  Email or phone                  │   │
│  │  • Store-level operations    │   │  ┌────────────────────────────┐  │   │
│  │                              │   │  └────────────────────────────┘  │   │
│  └──────────────────────────────┘   │                                  │   │
│                                     │  Password                        │   │
│                                     │  ┌────────────────────────────┐  │   │
│                                     │  └────────────────────────────┘  │   │
│                                     │                                  │   │
│                                     │  Confirm password                │   │
│                                     │  ┌────────────────────────────┐  │   │
│                                     │  └────────────────────────────┘  │   │
│                                     │                                  │   │
│                                     │  ┌────────────────────────────┐  │   │
│                                     │  │       Create Account        │  │   │
│                                     │  └────────────────────────────┘  │   │
│                                     │                                  │   │
│                                     │  Already have one? Sign in       │   │
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
│     Create your account      │
│                              │
│  Full name                   │
│  ┌────────────────────────┐  │
│  └────────────────────────┘  │
│                              │
│  Email or phone              │
│  ┌────────────────────────┐  │
│  └────────────────────────┘  │
│                              │
│  Password                    │
│  ┌────────────────────────┐  │
│  └────────────────────────┘  │
│                              │
│  Confirm password            │
│  ┌────────────────────────┐  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │     Create Account     │  │
│  └────────────────────────┘  │
│                              │
│  Already have one? Sign in   │
└──────────────────────────────┘
```

## Fields

| Field | Type | Required | Validation |
| :--- | :--- | :---: | :--- |
| Full name | text | Yes | Non-empty, max 100 chars. |
| Email or phone | text | Yes | Valid email or phone format. |
| Password | password | Yes | Minimum 8 characters. |
| Confirm password | password | Yes | Must match password field. |

## Actions

### Create Account

```text
User submits form
  -> validate all fields
  -> confirm passwords match
  -> call POST /auth/admin/signup (proposed)
  -> on success, receive session/token
  -> redirect to /dashboard by role
```

### Sign In Link

Navigates to:

```text
/auth/login
```

## Error States

### Email/Phone Already Registered

```text
An account with this email or phone already exists.
```

### Passwords Do Not Match

```text
Passwords do not match.
```

### Network Error

```text
Unable to create account right now. Please try again.
```

## Loading State

Button becomes disabled and shows:

```text
Creating account...
```

## Empty State

N/A — this is a form page.

## Component Checklist

- Logo/brand block
- Full name input
- Email/phone input
- Password input
- Confirm password input
- Create Account button
- Sign in link
- Inline validation messages
- Global error alert

## API / Data Requirements

Writes:
- `POST /auth/admin/signup` (proposed)

Required fields:
- `name`
- `email` or `phone`
- `password`

Returns:
- `user.id`
- `user.role`
- `token`

## Acceptance Criteria

- User cannot submit with empty required fields.
- Mismatched passwords show an inline error before submission.
- Duplicate email/phone shows a clear server error message.
- Successful signup redirects to `/dashboard`.
- Sign in link navigates to `/auth/login`.

---

# Figma Screen Specification

## Figma Frames

```text
Auth / Sign Up / Desktop — 1440×1024
Auth / Sign Up / Mobile — 390×844
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Desktop Visual Composition

### Frame: `Auth / Sign Up / Desktop`

```text
Frame size: 1440×1024
Background: neutral.50 (#F8FAFC)
Layout: horizontal, centered
Main container: 1120×760
Container position: x=160, y=132
Gap between panels: 80px
```

### Left Marketing Panel

```text
Position: x=160, y=132
Size: 560×760
Radius: radius.xl (32px)
Fill: gradient.brand.dark (#0F172A → #1D4ED8, 135°)
Padding: 56px
```

Content mirrors the login page left panel.

### Right Sign Up Card

```text
Position: x=800, y=152
Size: 480×660
Fill: white
Radius: radius.lg (24px)
Shadow: shadow.card
Padding: 48px
```

#### Card Content Coordinates

```text
Title:
  text: "Create your account"
  x=848, y=200
  width=384
  type: heading.32.bold
  color: neutral.950

Subtitle:
  text: "Join the LogiRoute admin control panel."
  x=848, y=248
  width=384
  type: body.16.regular
  color: neutral.500

Full name label: x=848, y=300
Full name input: x=848, y=332, size=384×48

Email/phone label: x=848, y=404
Email/phone input: x=848, y=436, size=384×48

Password label: x=848, y=508
Password input: x=848, y=540, size=384×48, trailing eye icon

Confirm password label: x=848, y=612
Confirm password input: x=848, y=644, size=384×48, trailing eye icon

Create Account button:
  x=848, y=716
  size=384×48
  fill: primary.600
  shadow: shadow.button.primary
  text: "Create Account"
  type: body.16.medium
  color: white

Sign in link:
  x=848, y=784
  text: "Already have an account?" + link "Sign in"
  type: caption.14.regular
  link color: primary.600
  centered within 384px
```

---

## Mobile Visual Composition

### Frame: `Auth / Sign Up / Mobile`

```text
Frame size: 390×844
Background: white
Padding: 24px
```

```text
Logo lockup:
  x=24, y=40
  icon: 36×36
  text: "LogiRoute" — heading.24.bold, neutral.950

Title:
  text: "Create your account"
  x=24, y=116
  type: heading.24.bold
  color: neutral.950

Subtitle:
  x=24, y=152
  type: body.16.regular
  color: neutral.500

Full name group: label y=204, input y=236, size=342×48
Email/phone group: label y=308, input y=340, size=342×48
Password group: label y=412, input y=444, size=342×48
Confirm password group: label y=516, input y=548, size=342×48

Create Account button:
  x=24, y=620
  size=342×48

Sign in text:
  x=24, y=692
  centered within 342
```

---

## Implementation Notes

- Maps to Next.js route `/auth/signup`.
- Use shadcn/ui `Input`, `Button`, `Card`, and `Alert` components.
- Password confirmation should be validated client-side before API call.
