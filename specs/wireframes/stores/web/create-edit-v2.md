# Wireframe Spec (v2): Create / Edit Store

This is a revised (v2) specification for the store creation and editing screen, incorporating UI/UX enhancements for clarity, efficiency, and better user feedback.

## Key Improvements in v2

*   **Logical Field Grouping:** Form fields are grouped into `Card` components with clear headings (`Store Identity`, `Location`, `Status`) to guide the user.
*   **Enhanced Map Interaction:** The map UI provides clearer feedback with distinct states for `selecting`, `confirming`, and `confirmed` location.
*   **Explicit Component Naming:** Refers to `shadcn/ui` components (`Card`, `Input`, `Separator`, `Switch`) to align with the specified tech stack.
*   **Dedicated "Danger Zone":** In "Edit" mode, critical actions like deactivation are moved to a clearly marked "Danger Zone" for safety.
*   **Improved Button States:** More descriptive button text and states (e.g., "Save and Continue") to manage user expectations.
*   **Clearer Status Control:** Uses a `Switch` component for `Active/Inactive` status, which is more direct than radio buttons for a binary choice.

---

## Page Layout (v2)

The two-column layout is retained, but the content within the cards is more structured.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  ← Stores / Create New Store                                    │
│             │                                                                 │
│             │  ┌─────────────────────────┐  ┌───────────────────────────┐     │
│             │  │ 📂 Store Identity       │  │  📍 Store Location        │     │
│             │  │  ──────────────         │  │  ──────────────           │     │
│             │  │  Store Name *           │  │                           │     │
│             │  │  [LogiRoute Downtown]   │  │   [Embedded Map]          │     │
│             │  │                         │  │                           │     │
│             │  │  Contact Phone *        │  │   [Search for address... ]│     │
│             │  │  [(+1) 555-123-4567]    │  │                           │     │
│             │  └─────────────────────────┘  │      (Map Interaction)      │     │
│             │                               │                           │     │
│             │  ┌─────────────────────────┐  │   [✔ Location Confirmed!] │     │
│             │  │  🚦 Status              │  │   123 Main St, New York   │     │
│             │  │  ──────────────         │  └───────────────────────────┘     │
│             │  │  Store is Active        │                                    │
│             │  │  [ On/Off Switch ]      │                                    │
│             │  └─────────────────────────┘                                    │
│             │                                                                 │
│             │                                [Cancel]  [Save Store]           │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Enhanced Component Breakdown (v2)

### Left Column: Form Details

1.  **Breadcrumb:** `components/ui/breadcrumb`
    *   Path: `Stores / Create New Store`

2.  **Store Identity Card:** `components/ui/card`
    *   **CardHeader:** "Store Identity"
    *   **CardContent:**
        *   **Store Name:** `components/ui/input` with a `components/ui/label`.
        *   **Contact Phone:** `components/ui/input` (type `tel`) with a `components/ui/label`.

3.  **Status Card:** `components/ui/card`
    *   **CardHeader:** "Status"
    *   **CardContent:**
        *   A `div` containing a `components/ui/label` ("Store is Active") and a `components/ui/switch`. Default to `on`.

### Right Column: Map

1.  **Store Location Card:** `components/ui/card`
    *   **CardHeader:** "Store Location"
    *   **CardContent:** Contains the map component.
    *   **Map Search:** An `Input` with a search icon, overlaid on the map.
    *   **Map State Feedback:**
        *   **Initial:** An overlay prompts "Search or click the map to set a location."
        *   **Pin Dropped:** A "Confirm Location" `Button` appears.
        *   **Confirmed:** The button is replaced with a success message (`Alert` component): "✔ Location Confirmed!" displaying the address. The main form's hidden `lat`/`lng` fields are now populated.

### Page Actions

*   **Cancel Button:** `components/ui/button` (variant: `outline`).
*   **Save Button:** `components/ui/button` (default variant).
    *   **State:** Disabled until all required fields (including confirmed location) are filled.
    *   **While Saving:** Shows a spinner and text "Saving...".

---

## Edit Mode Enhancements (v2)

For the `/stores/:id/edit` route:

*   **Breadcrumb:** `Stores / {store.name} / Edit`
*   **Data:** All fields and the map are pre-populated with the store's current data.
*   **Save Button Text:** "Save Changes".
*   **New "Danger Zone" Card:** Add a new `Card` at the bottom of the left column.

```text
┌─────────────────────────┐
│  🔥 Danger Zone         │
│  ──────────────         │
│  Deactivate Store       │
│  This will prevent new  │
│  orders from being assigned.│
│  [ Deactivate ]         │
└─────────────────────────┘
```
*   This removes the `Status` `Switch` from its own card and handles activation/deactivation as a distinct, critical action, preventing accidental changes. The button here would trigger a confirmation modal.

---
## Gaps Bridged by this Design

1.  **Accidental Deactivation:** Separating the active/inactive status toggle into a "Danger Zone" in edit mode prevents users from accidentally flipping a switch while creating or editing other fields.
2.  **Unclear Map State:** The enhanced map interaction provides clear, step-by-step feedback, so the user knows if their chosen location is temporary or has been locked in.
3.  **Form Overwhelm:** Grouping fields into cards reduces cognitive load and makes the form easier to scan and complete.
4.  **Alignment with Design System:** Explicitly referencing `shadcn/ui` components ensures the final implementation will be consistent with the project's chosen aesthetics and components.

This revised wireframe provides a more detailed and user-centric blueprint for development. I will now update the `STORES-IMPROVEMENTS.md` file with these details.