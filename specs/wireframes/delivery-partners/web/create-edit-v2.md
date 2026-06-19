# Wireframe Spec (v2): Create / Edit Delivery Partner

This is a revised (v2) specification for the delivery partner creation and editing screen. It focuses on logical grouping, clearer user onboarding, and safer actions, consistent with the `shadcn/ui` design system.

## Key Improvements in v2

*   **Structured Form:** The form is broken into logical `Card` sections: `Partner Profile`, `Account & Login`, and `Vehicle & Assignment`, making it less monolithic and easier to follow.
*   **Clear User Creation Flow:** The form now explicitly addresses the creation of a `user` account alongside the `delivery_partner` profile, including fields for setting an initial password, which was a gap in the original spec.
*   **Enhanced Edit Mode:** A "Danger Zone" is added for critical actions like deactivating or archiving a partner, preventing accidental changes to their status.
*   **Component-Driven Design:** Directly references `shadcn/ui` components like `Card`, `Input`, `Select`, and `Separator` for a consistent implementation.
*   **Improved Semantics:** Uses more descriptive labels and helper text to guide the admin.

---

## Page Layout (v2)

A single-column layout with stacked cards provides a clear, linear flow for creating a new partner.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  ← Delivery Partners / Create New Partner                       │
│             │                                                                 │
│             │  ┌──────────────────────────────────────────────────────────┐   │
│             │  │  👤 Partner Profile                                       │   │
│             │  │  ──────────────────                                       │   │
│             │  │  Full Name *                                              │   │
│             │  │  [Enter partner's full name... ]                          │   │
│             │  └──────────────────────────────────────────────────────────┘   │
│             │                                                                 │
│             │  ┌──────────────────────────────────────────────────────────┐   │
│             │  │  🔑 Account & Login                                       │   │
│             │  │  ──────────────────                                       │   │
│             │  │  Phone Number *          Email (Optional)                 │   │
│             │  │  [Partner's phone...]    [Partner's email...]             │   │
│             │  │  <Helper text: Used for OTP login.>                       │   │
│             │  │                                                           │   │
│             │  │  Initial Password *                                       │   │
│             │  │  [Generate & set a secure password...]   [👁]            │   │
│             │  │  <Helper text: Partner should change this on first login.>│   │
│             │  └──────────────────────────────────────────────────────────┘   │
│             │                                                                 │
│             │  ┌──────────────────────────────────────────────────────────┐   │
│             │  │  🏍️ Vehicle & Assignment                                 │   │
│             │  │  ───────────────────────                                 │   │
│             │  │  Assigned Store *                                         │   │
│             │  │  [Select a store...      ▾]                             │   │
│             │  │                                                           │   │
│             │  │  Vehicle Type *          Vehicle Number *                 │   │
│             │  │  [Motorcycle ▾]          [e.g., MH 01 AB 1234]            │   │
│             │  └──────────────────────────────────────────────────────────┘   │
│             │                                                                 │
│             │                                   [Cancel]  [Save Partner]      │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Enhanced Component Breakdown (v2)

1.  **Partner Profile Card:** `components/ui/card`
    *   **CardHeader:** "Partner Profile"
    *   **CardContent:**
        *   **Full Name:** `Input` with a `Label`.

2.  **Account & Login Card:** `components/ui/card`
    *   **CardHeader:** "Account & Login"
    *   **CardContent:**
        *   A grid for `Phone Number` and `Email` `Input` fields.
        *   `Phone Number` has helper text: "Used for OTP login."
        *   **Initial Password:** `Input` with a show/hide password toggle button. Includes helper text advising the partner to change it.

3.  **Vehicle & Assignment Card:** `components/ui/card`
    *   **CardHeader:** "Vehicle & Assignment"
    *   **CardContent:**
        *   **Assigned Store:** `Select` component populated by `GET /stores`.
        *   A grid for `Vehicle Type` (`Select`) and `Vehicle Number` (`Input`).

4.  **Page Actions:**
    *   `Cancel` and `Save Partner` `Button` components.

---

## Edit Mode Enhancements (v2)

For the `/delivery-partners/:id/edit` route:

*   **Data:** All fields are pre-populated. The password field can be left blank to keep the existing password.
*   **"Danger Zone" Card:** Added at the bottom.

```text
┌──────────────────────────────────────────────────────────┐
│  🔥 Danger Zone                                           │
│  ──────────────────                                       │
│  Deactivate Partner                                       │
│  This will prevent the partner from receiving new orders  │
│  and logging in.                                          │
│  [ Deactivate Partner ] (Button, variant: destructive)    │
└──────────────────────────────────────────────────────────┘
```

*   This provides a clear, intentional action for deactivation, backed by a confirmation dialog (detailed in [modals.md](file:///Users/me/Projects/delivery_app/specs/wireframes/shared/modals.md)), which is much safer than a simple toggle.

---

## Gaps Bridged by this Design

1.  **Incomplete User Onboarding:** The original wireframe lacked a flow for creating the partner's login credentials. This v2 design explicitly includes setting an initial password, bridging the gap between creating a "profile" and creating a "user."
2.  **Form Complexity:** The single, long form is now structured into logical, digestible sections, improving usability.
3.  **Safety of Critical Actions:** Moving the deactivation action to a "Danger Zone" in edit mode prevents admins from accidentally locking a partner out.
4.  **Clarity and Guidance:** Helper text for fields like Phone Number and Password provides important context for the admin performing the action.

This revised specification provides a more robust and user-friendly foundation for the delivery partner management feature.