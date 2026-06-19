# Wireframe Spec: Delivery Partner Login / OTP

## Screen

Delivery Partner App — Login / OTP

No web URL. Flutter mobile screen.

## Purpose

Allows a delivery partner to sign in using their registered phone number and a one-time PIN sent via SMS.

## MVP Source

From `mvp-v1.md` Section 4.1:

- Phone OTP login for delivery partners.
- Role-based dashboard/app routing.

## Supported Roles

- Delivery Partner

## Primary User Goal

Enter phone number, receive OTP, verify, and land on the home dashboard.

## Screen Flow

```text
Step 1: Enter Phone Number
Step 2: Enter OTP (6 digits)
Step 3: Redirect to Home Dashboard
```

---

## Step 1 — Phone Number Screen Layout

```text
┌──────────────────────────────┐
│                              │
│                              │
│       [LogiRoute Icon]       │
│         LogiRoute            │
│    Delivery Partner App      │
│                              │
│                              │
│   Enter your phone number    │
│   to receive a login code.   │
│                              │
│  ┌────────────────────────┐  │
│  │ +1  │  555 000 0000    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │    Send Login Code     │  │
│  └────────────────────────┘  │
│                              │
│                              │
└──────────────────────────────┘
```

## Step 2 — OTP Verification Screen Layout

```text
┌──────────────────────────────┐
│  ← Back                      │
│                              │
│   Enter the 6-digit code     │
│   sent to +1 555 000 0000    │
│                              │
│  ┌──┐  ┌──┐  ┌──┐  ┌──┐     │
│  │  │  │  │  │  │  │  │     │
│  └──┘  └──┘  └──┘  └──┘     │
│        ┌──┐  ┌──┐           │
│        │  │  │  │           │
│        └──┘  └──┘           │
│                              │
│   Resend code in 00:45       │
│                              │
│  ┌────────────────────────┐  │
│  │        Verify          │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

---

## Fields

### Step 1

| Field | Type | Required | Validation |
| :--- | :--- | :---: | :--- |
| Country code | select | Yes | Defaults to user locale |
| Phone number | tel | Yes | Valid phone number |

### Step 2

| Field | Type | Required | Validation |
| :--- | :--- | :---: | :--- |
| OTP | 6 separate digit inputs | Yes | Numeric only, auto-advance on each digit |

---

## Actions

### Send Login Code

```text
User enters phone → taps Send Login Code
  -> validate phone format
  -> call POST /auth/otp/request { phone }
  -> on success: navigate to OTP step
  -> on error: show error message
```

### Verify OTP

```text
User enters 6-digit OTP → taps Verify
  -> call POST /auth/otp/verify { phone, otp }
  -> on success: store token, navigate to Home
  -> on invalid OTP: show "Invalid code. Please try again."
  -> on expired OTP: show "Code has expired. Request a new one."
```

### Resend Code

Available after 60-second countdown:

```text
-> call POST /auth/otp/request { phone }
-> reset countdown
```

### Back (Step 2)

Navigates back to Step 1 to change phone number.

---

## Error States

### Invalid Phone

```text
Please enter a valid phone number.
```

### OTP Send Failed

```text
Unable to send login code. Please try again.
```

### Invalid OTP

```text
The code you entered is incorrect.
```

### Expired OTP

```text
This code has expired. Tap "Resend" to get a new one.
```

### Network Error

```text
No internet connection. Please check your network.
```

---

## Loading States

- Send Login Code button: "Sending..." + spinner, disabled.
- Verify button: "Verifying..." + spinner, disabled.

---

## Component Checklist

- App icon + brand name
- Phone input with country code selector
- Send Login Code button
- 6-box OTP input
- OTP resend countdown
- Resend Code link
- Verify button
- Back navigation
- Inline error messages

---

## API / Data Requirements

Writes:
- `POST /auth/otp/request` — send OTP
- `POST /auth/otp/verify` — verify OTP, returns token + user role

---

## Acceptance Criteria

- Phone number is validated before sending OTP.
- OTP digits auto-advance focus to the next box.
- Verify button is disabled until all 6 digits are entered.
- Successful OTP verification navigates to the Home screen.
- Wrong OTP shows inline error without clearing entered digits.
- Resend countdown starts at 60 seconds and re-enables after expiry.
- Back button on Step 2 returns to Step 1.

---

# Figma Screen Specification

## Figma Frames

```text
Driver App / Login Step 1 / Mobile — 390×844
Driver App / Login Step 2 OTP / Mobile — 390×844
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Step 1 — Phone Screen

```text
Frame: 390×844, fill=white, padding=24px

App icon: 64×64, radius=radius.xl, fill=gradient.brand.dark, centered, y=120
Brand text: "LogiRoute" — heading.24.bold, neutral.950, centered, y=200
Subtitle: "Delivery Partner App" — caption.14.regular, neutral.500, centered, y=232

Heading: "Enter your phone number" — heading.24.bold, neutral.950, x=24, y=320
Subheading: "We'll send a login code to your phone." — body.16.regular, neutral.500, x=24, y=360

Phone input:
  x=24, y=420, size=342×56
  Left section: country code, 80×56, fill=neutral.100, border-right=1px neutral.200
  Right section: phone number input, remaining width
  radius: radius.sm

Send Login Code button:
  x=24, y=500, size=342×52
  fill=primary.600, shadow=shadow.button.primary, radius=radius.md
  text: "Send Login Code" — body.16.medium, white
```

---

## Step 2 — OTP Screen

```text
Frame: 390×844, fill=white, padding=24px

Back button: x=24, y=52, size=40×40, icon=chevron-left, neutral.700

Heading: "Enter your code" — heading.24.bold, neutral.950, x=24, y=120
Subtext: "Sent to +1 555 000 0000" — body.16.regular, neutral.500, x=24, y=160

OTP boxes (6):
  y=236
  Each box: 44×56, fill=neutral.100, radius=radius.sm, border=1px neutral.300
  Active box: border=2px primary.600
  Filled box: fill=primary.50, border=1px primary.200
  Gaps: 8px between boxes
  Total row width = 6×44 + 5×8 = 304px, centered within 342

Resend row:
  x=24, y=320
  "Resend code in 00:45" — caption.14.regular, neutral.500
  After countdown: "Resend code" link — caption.14.medium, primary.600

Verify button:
  x=24, y=380, size=342×52
  Disabled (< 6 digits): fill=neutral.200, text=neutral.400
  Active (6 digits): fill=primary.600, shadow=shadow.button.primary
  text: "Verify" — body.16.medium
```
