# Wireframe Spec: Delivery Complete / PIN Entry

## Screen

Delivery Partner App — Delivery Complete

## Purpose

The final step of the delivery workflow. The driver asks the customer for their 4-digit PIN to confirm receipt, enters it in the app, and completes the order.

## MVP Source

From `mvp-v1.md` Section 4.7:

8. Mark Delivered.
9. Upload proof of delivery.

Proof of delivery method for MVP: **4-digit customer PIN**.

## Supported Roles

- Delivery Partner

## Primary User Goal

Enter the customer's 4-digit PIN to confirm delivery and close out the order.

---

## Screen Layout — PIN Entry

```text
┌──────────────────────────────┐
│  ← Back                      │
│                              │
│       ✅ Almost there!        │
│                              │
│   Ask the customer for       │
│   their 4-digit delivery PIN │
│                              │
│  ┌──────┐┌──────┐┌──────┐┌──────┐│
│  │      ││      ││      ││      ││
│  └──────┘└──────┘└──────┘└──────┘│
│                              │
│  ┌────────────────────────┐  │
│  │   Confirm Delivery     │  │
│  └────────────────────────┘  │
│                              │
│  Can't get PIN?              │
│  Contact dispatcher          │
│                              │
└──────────────────────────────┘
```

## Screen Layout — Success

```text
┌──────────────────────────────┐
│                              │
│                              │
│          🎉                  │
│                              │
│   Delivery Complete!         │
│                              │
│   Order #ORD-5021 delivered  │
│   to Priya Sharma.           │
│                              │
│   You are back online        │
│   and ready for new orders.  │
│                              │
│  ┌────────────────────────┐  │
│  │     Back to Home       │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

---

## Fields

| Field | Type | Required | Validation |
| :--- | :--- | :---: | :--- |
| Customer PIN | 4 separate digit inputs | Yes | Numeric, auto-advance, exactly 4 digits |

---

## Actions

### Confirm Delivery

```text
Driver enters 4-digit PIN → taps Confirm Delivery
  -> call POST /orders/:id/delivered { pin }
  -> on success:
       - show success screen
       - driver status updated to "online" (available)
  -> on incorrect PIN: show "Incorrect PIN. Please ask the customer again."
  -> on error: show toast error
```

### Back to Home

From success screen:

```text
Navigate to Home screen
```

### Contact Dispatcher

```text
Tapping "Contact dispatcher" opens phone dialler or a support contact method.
This is a fallback for when customer is unresponsive.
(Deferred: actual dispatcher contact flow — for MVP, show a phone number)
```

---

## Error States

### Incorrect PIN

```text
"That PIN is incorrect. Please ask the customer for their 4-digit delivery code."
PIN boxes clear and allow re-entry.
```

### API Error

```text
Toast: "Unable to complete delivery. Please try again."
```

---

## Loading State

Confirm Delivery button shows "Verifying..." spinner and disables during API call.

---

## Component Checklist

- Back navigation
- Instructional heading and subtext
- 4-digit PIN input boxes (auto-advance focus)
- Confirm Delivery button (disabled until 4 digits entered)
- Incorrect PIN error message
- Contact Dispatcher fallback link
- Success screen with completion message
- Back to Home button

---

## API / Data Requirements

Writes:
- `POST /orders/:id/delivered` with `{ proof_pin: "1234" }`

Returns:
- Updated order with `status=delivered`, `delivered_at`

---

## Acceptance Criteria

- PIN digits auto-advance focus to the next box on input.
- Confirm Delivery is disabled until all 4 digits are entered.
- Correct PIN marks order as delivered and shows success screen.
- Incorrect PIN clears boxes and shows an error message without navigating away.
- Success screen shows order ID and customer name.
- Back to Home navigates to the Home screen with driver in online/available state.
- Driver status is set back to `online` after delivery completion.

---

# Figma Screen Specification

## Figma Frames

```text
Driver App / Delivery Complete / PIN Entry / Mobile — 390×844
Driver App / Delivery Complete / Success / Mobile — 390×844
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## PIN Entry Screen

```text
Frame: 390×844, background=white, padding=24px

Nav bar: height=56px, back icon left, fill=white, border-bottom=1px neutral.200

Checkmark icon: 48×48, success.600, centered, y=140

Heading: "Almost there!" — heading.24.bold, neutral.950, centered, y=208
Subtext: "Ask the customer for their 4-digit delivery PIN"
  body.16.regular, neutral.500, centered, y=248, width=280

PIN boxes (4):
  y=324, centered within 342
  Each box: 64×72, fill=neutral.100, border=1px neutral.300, radius=radius.sm
  Active box: border=2px primary.600, fill=primary.50
  Filled box: fill=white, border=1px neutral.200, text=heading.32.bold neutral.950
  Gap: 12px between boxes
  Total width: 4×64 + 3×12 = 292px

Confirm Delivery button:
  x=24, y=432, size=342×52
  Disabled: fill=neutral.200, text=neutral.400
  Active: fill=primary.600, shadow=shadow.button.primary
  text: "Confirm Delivery" — body.16.medium

Error message (below button when wrong PIN):
  y=500
  "Incorrect PIN. Please ask the customer again."
  caption.14.regular, error.600, centered

Dispatcher fallback:
  y=560
  "Can't get the PIN?" — caption.14.regular, neutral.500, centered
  "Contact dispatcher" — caption.14.medium, primary.600, centered
```

---

## Success Screen

```text
Frame: 390×844, background=white, padding=24px, all centered

Celebration icon or checkmark:
  64×64, success.600, y=240, centered

Heading: "Delivery Complete!" — heading.24.bold, neutral.950, y=328, centered
Body: "Order #ORD-5021 delivered to Priya Sharma."
  body.16.regular, neutral.700, y=368, centered, width=300

Divider: 1px neutral.200, y=428

Ready text: "You are back online and ready for new orders."
  caption.14.regular, neutral.500, y=452, centered

Back to Home button:
  x=24, y=524, size=342×52
  fill=primary.600, shadow=shadow.button.primary, radius=radius.md
  text: "Back to Home" — body.16.medium, white
```
