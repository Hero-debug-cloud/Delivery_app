# Wireframe Spec: Shared Confirmation Modals

## Purpose

Define the global layouts, tokens, and interactions for confirmation modals. This covers **Delete Store Modals** (high-impact destructive CRUD) and **Deactivate Modals** (operational status updates) used throughout LogiRoute.

All delete and deactivate actions across the admin console must trigger modals matching these specifications.

---

## 1. Global Modal Overlay Shell

Every modal inherits this base visual scrim and card layout.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Background Content - Blurred & Dimmed]                                     │
│                                                                             │
│                    ┌───────────────────────────────────┐                    │
│                    │  Modal Header                 ✕  │  <- Height: 64px   │
│                    ├───────────────────────────────────┤                    │
│                    │                                   │                    │
│                    │  Modal Body Content               │  <- Padding: 24px  │
│                    │                                   │                    │
│                    ├───────────────────────────────────┤                    │
│                    │              [Cancel] [Action]    │  <- Height: 76px   │
│                    └───────────────────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Figma Specifications
- **Scrim (Overlay Background):**
  - Fill: `neutral.950` with 50% opacity.
  - Backdrop Filter: blur(4px) for premium glassmorphism focus.
  - Z-index: 1000 (above sidebar and top nav).
- **Modal Card Container:**
  - Width: 520px.
  - Height: Auto (fits content).
  - Position: Center of viewport (x=460, y=centered on a 1440×1024 frame).
  - Fill: `white`.
  - Radius: `radius.lg` (24px).
  - Shadow: `shadow.card` (deep elevation).
  - Padding: 32px.

---

## 2. Delete Store Confirmation Modal

Used for deleting a store. Since deleting a store is destructive and affects historical records, it requires typing the store's name to confirm.

```text
┌──────────────────────────────────────────────────────┐
│  ⚠️  Delete Store?                                 ✕  │
├──────────────────────────────────────────────────────┤
│  This action is permanent and cannot be undone. All  │
│  active deliveries and drivers will be disconnected. │
│                                                      │
│  To proceed, type the store name:                    │
│  Downtown Hub                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │ Downtown Hub                                   │  │  <- Input Field
│  └────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────┤
│              [Cancel]  [Delete Permanently]          │  <- Red Button
└──────────────────────────────────────────────────────┘
```

### Figma Visual Composition
- **Modal Header:**
  - Title: "Delete Store?" — `heading.20.semibold`, color=`error.600` (destructive).
  - Title Icon: alert-triangle outline, 24×24px, color=`error.600` (placed left of title, gap=8px).
  - Close Button: x-icon, 20×20px, color=`neutral.400` (top-right alignment).
- **Modal Body:**
  - Description: "This action is permanent and cannot be undone. All active deliveries and drivers will be disconnected." — `body.16.regular`, color=`neutral.600`.
  - Validation Text: "To proceed, type the store name: **Downtown Hub**" — `caption.14.regular`, color=`neutral.800`, margin-top=16px.
  - Input field: `size=456×48`, background=`white`, border=1px `neutral.300` (focus ring `error.600` if mismatch, `primary.600` if matches), radius=`radius.sm` (8px), margin-top=8px.
- **Action Buttons:**
  - Align: Right, gap=16px, margin-top=32px.
  - Cancel Button: `size=100×44`, variant=`outline`, fill=`white`, border=1px `neutral.300`, radius=`radius.md` (12px), text=`neutral.700` `body.16.medium`.
  - Delete Button: `size=180×44`, radius=`radius.md` (12px).
    - *Disabled State:* fill=`neutral.100`, text=`neutral.400`, cursor=not-allowed (when input text !== store.name).
    - *Active State:* fill=`error.600`, text=`white`, cursor=pointer.
    - *Loading State:* fill=`error.600` (opacity 70%), leading spinner 16×16px, text="Deleting...".

---

## 3. Deactivate Confirmation Modal

Used for deactivating stores or delivery partners. It disables entity operations safely without permanent data loss.

```text
┌──────────────────────────────────────────────────────┐
│  🚦 Deactivate Partner?                            ✕  │
├──────────────────────────────────────────────────────┤
│  Deactivating Marcus Williams will block them from   │
│  logging into the mobile app or receiving new order  │
│  assignments immediately.                            │
│                                                      │
│  Active orders (1) must be completed or reassigned   │
│  first.                                              │
├──────────────────────────────────────────────────────┤
│                     [Cancel]   [Confirm Deactivation]│
└──────────────────────────────────────────────────────┘
```

### Figma Visual Composition
- **Modal Header:**
  - Title: "Deactivate Store?" or "Deactivate Partner?" — `heading.20.semibold`, color=`neutral.950`.
  - Title Icon: warning-circle, 24×24px, color=`warning.500` (placed left of title, gap=8px).
  - Close Button: x-icon, 20×20px, color=`neutral.400` (top-right).
- **Modal Body:**
  - Description: "Deactivating [Name] will immediately block new order assignments and operations." — `body.16.regular`, color=`neutral.600`.
  - Context Warn: "Active orders (1) must be completed or reassigned first." — `caption.14.medium`, color=`warning.500`, background=`warning.50`, padding=10px 12px, radius=`radius.sm` (8px), margin-top=16px. (Only shown if active orders count > 0).
- **Action Buttons:**
  - Align: Right, gap=16px, margin-top=32px.
  - Cancel Button: `size=100×44`, variant=`outline`, fill=`white`, border=1px `neutral.300`, radius=`radius.md` (12px), text=`neutral.700` `body.16.medium`.
  - Deactivate Button: `size=190×44`, fill=`warning.500` (or `error.600` depending on severity), radius=`radius.md` (12px), text=`white` `body.16.medium`.
    - *Loading State:* fill=`warning.500` (opacity 70%), leading spinner 16×16px, text="Deactivating...".

---

## 4. API & Integration Requirements

### Delete Store
- Action triggers `DELETE /stores/:id`.
- On success: Show a Success Toast ("Store deleted successfully") and redirect back to `/stores`.
- On error: Keep modal open, show inline `Error Alert` at the bottom of the body.

### Deactivate Store / Partner
- Action triggers `PATCH /stores/:id` with `{ is_active: false }` or `PATCH /delivery-partners/:id` with `{ status: "offline", is_active: false }`.
- On success: Show Success Toast and refresh the current route.
- On error: Display inline `Error Alert` in modal body.
