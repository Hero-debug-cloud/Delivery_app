# Wireframe Spec: Driver Profile

## Screen

Delivery Partner App — Profile

## Purpose

Shows the delivery partner's own profile information, vehicle details, and assigned store. Provides a logout action.

## MVP Source

From `mvp-v1.md` Section 6:

- Delivery Partner Screens: 6. Profile

## Supported Roles

- Delivery Partner

## Primary User Goal

View personal details and log out of the app.

---

## Screen Layout

```text
┌──────────────────────────────┐
│  ← Back          Profile     │
│                              │
│       [Avatar]               │
│      Marcus Williams         │
│      ● Online                │
│                              │
│  ┌────────────────────────┐  │
│  │  Personal Info         │  │
│  │  Phone   +1 555-0091   │  │
│  │  Email   marcus@...    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Work Info             │  │
│  │  Store   Downtown Hub  │  │
│  │  Vehicle Moto  MH01    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  Today's Activity      │  │
│  │  Deliveries: 3         │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │       Log Out          │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

---

## Fields Displayed

### Profile Header

| Element | Data |
| :--- | :--- |
| Avatar | Initials-based |
| Name | `user.name` |
| Status badge | `driver.status` |

### Personal Info Card

| Field | Data |
| :--- | :--- |
| Phone | `user.phone` |
| Email | `user.email` |

### Work Info Card

| Field | Data |
| :--- | :--- |
| Store | `store.name` |
| Vehicle | `driver.vehicle_type` + `driver.vehicle_number` |

### Today's Activity Card

| Field | Data |
| :--- | :--- |
| Deliveries | Count of delivered orders today |

---

## Actions

### Log Out

```text
Driver taps Log Out
  -> confirmation: "Log out of LogiRoute Delivery?"
  -> [Cancel] [Log Out]
  -> call POST /auth/logout
  -> clear local token
  -> navigate to Login screen
```

---

## Error States

### Logout Failed

```text
Toast: "Unable to log out. Please try again."
```

---

## Loading State

Profile screen shows skeleton on first load.

---

## Component Checklist

- Navigation bar with back button
- Avatar (initials)
- Name + status badge
- Personal info card
- Work info card
- Today's activity card
- Log Out button
- Logout confirmation bottom sheet

---

## API / Data Requirements

Reads:
- `GET /auth/me` — user identity
- `GET /delivery-partners/me` or `/delivery-partners/:id` — vehicle, store, status

Writes:
- `POST /auth/logout`

---

## Acceptance Criteria

- Profile screen shows correct name, phone, email, store, and vehicle.
- Status badge reflects current online/offline/busy status.
- Log Out requires a confirmation bottom sheet.
- After logout, token is cleared and user is sent to the Login screen.

---

# Figma Screen Specification

## Figma Frames

```text
Driver App / Profile / Mobile — 390×844
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Visual Composition

```text
Frame: 390×844, background=neutral.50, padding=0
Content padding: 24px
```

### Navigation Bar

```text
Height: 56px, fill=white, border-bottom=1px neutral.200
Back icon: chevron-left, 24×24, neutral.700, x=24
Title: "Profile" — body.16.medium, neutral.950, centered
```

### Profile Header

```text
y=80, centered

Avatar: 72×72, radius=radius.full
  fill=primary.100, text=primary.600
  initials, heading.24.bold

Name: "Marcus Williams" — heading.20.semibold, neutral.950, y=164
Status badge: "● Online" — success.50, success.600, radius=radius.full, y=196
```

### Personal Info Card

```text
x=24, y=232, size=342×104
fill=white, radius=radius.lg, shadow=shadow.card, padding=20px

Section label: "Personal Info" — caption.14.medium, neutral.500
Rows, gap=14px:
  Phone: key=caption.14.regular neutral.500, value=body.16.regular neutral.950
  Email: same
```

### Work Info Card

```text
x=24, y=352, size=342×104
Same card styling.

Section label: "Work Info"
Rows: Store, Vehicle
```

### Today's Activity Card

```text
x=24, y=472, size=342×72
Same card styling.

Section label: "Today's Activity"
Deliveries count: body.16.medium, neutral.950
```

### Log Out Button

```text
x=24, y=572, size=342×52
fill=white
border=1px error.300
radius=radius.md
text: "Log Out" — body.16.medium, error.600
```
