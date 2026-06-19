# Wireframe Spec: Customer Phone OTP Login

## Screen

Customer App — Authentication (Phone Input & OTP Verification)

## Purpose

Provides a secure, frictionless onboarding flow for customers using SMS-based One-Time Password (OTP) verification.

## MVP Source

From `mvp-v1.md` Section 4.1:
- Phone OTP login for delivery partners and customers.
- Basic session management.

## Supported Roles

- Guest / Customer

## Primary User Goal

Enter their phone number, receive a 4-digit code via SMS, and verify it to access catalog features and place orders.

---

## Screen Layout — Step 1: Phone Input

```text
┌──────────────────────────────┐
│  LogiRoute Quick-Cart        │
│                              │
│  ┌────────────────────────┐  │
│  │ Welcome to Quick-Cart  │  │  <- heading.20.semibold
│  │ Enter your phone number │  │  <- caption.14.regular
│  │ to get started.        │  │
│  └────────────────────────┘  │
│                              │
│  Phone Number                │
│  ┌────────────────────────┐  │
│  │ +91 ▾ │ [ 98765 43210 ]│  │  <- Phone input box
│  └────────────────────────┘  │
│                              │
│  [x] I agree to the Terms of │  <- Checkbox
│      Service & Privacy Policy│
│                              │
│  [   Get OTP  ]              │  <- Primary button (disabled initially)
│                              │
└──────────────────────────────┘
```

## Screen Layout — Step 2: OTP Verification

```text
┌──────────────────────────────┐
│  ← Back                      │  <- Returns to Step 1
│                              │
│  ┌────────────────────────┐  │
│  │ Verify Phone Number    │  │  <- heading.20.semibold
│  │ Code sent to:          │  │  <- caption.14.regular
│  │ +91 98765 43210        │  │
│  └────────────────────────┘  │
│                              │
│  Enter 4-Digit OTP           │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │ 4 │ │ 2 │ │   │ │   │     │  <- 4 individual box inputs
│  └───┘ └───┘ └───┘ └───┘     │
│                              │
│  Resend code in 24s          │  <- Countdown text
│                              │
│  [ Verify & Continue ]       │  <- Primary success button
│                              │
└──────────────────────────────┘
```

---

## Component Checklist

### Step 1: Phone Input
- App header / Branding lockup.
- Country code selector dropdown (e.g. `+91`, `+1`).
- Phone number input field (type `tel`, filters non-digits, maxLength=10).
- Terms and conditions checkbox (must be ticked to enable button).
- Get OTP Button:
  - *Active:* fill=`theme.customer.primary.600` (success green), text=`white`, shadow=`shadow.button.customer`.
  - *Disabled:* fill=`neutral.200`, text=`neutral.400` (disabled state).

### Step 2: OTP Verification
- Back navigation header.
- Verification description showing masked phone.
- OTP digit code inputs (4 adjacent squares, automatic focus jumping to next box on key entry).
- Countdown timer (starts at 30s, swaps to clickable `[Resend OTP]` text button when elapsed).
- Verify & Continue Button:
  - *Active:* fill=`theme.customer.primary.600` (success green), text=`white`, shadow=`shadow.button.customer`.
  - *Disabled:* fill=`neutral.200`, text=`neutral.400` (until 4 digits are input).

---

## API Requirements

### Request OTP
- `POST /auth/otp/request`
  - Payload: `{ phone: "9876543210" }`

### Verify OTP
- `POST /auth/otp/verify`
  - Payload: `{ phone: "9876543210", code: "4201" }`
  - On Success: Returns user auth token, creates `customer` account if user is new, and navigates to the Home screen.

---

## Acceptance Criteria

- Phone input accepts only numerical values up to 10 digits.
- Get OTP button remains disabled until a valid 10-digit number is input and the Terms checkbox is checked.
- Tapping Get OTP calls request API, advances screen to Step 2, and focuses the first OTP digit box.
- OTP boxes only accept numerical digits 0–9. Entering a digit auto-focuses the next adjacent box. Tapping delete back-spaces and focuses the previous box.
- Verify & Continue button is enabled only when all 4 OTP digits are filled.
- If verification fails (wrong OTP), inputs flash red and show a toast error: "Invalid verification code. Please try again."
- Tapping Resend calls the request API and resets the countdown timer to 30s.
