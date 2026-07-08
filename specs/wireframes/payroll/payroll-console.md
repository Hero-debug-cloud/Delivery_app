# Screen Spec: Payroll Console & Overview
**Route:** `/payroll`  
**Figma Frame Size:** `Desktop / 1440 x 900`  
**Roles permitted:** `super_admin`, `store_manager`

---

## 1. Visual Layout Wireframe

```text
+-----------------------------------------------------------------------------------+
|  [Logo] LogiRoute                Search...                            [Bell] Admin|
+-----------------------------------------------------------------------------------+
|  (Nav)                           Payroll Console                                  |
|  - Dashboard                                                                      |
|  - Live Map      Generate payroll parameters and audit current weekly drafts.     |
|  - Orders                                                                         |
|  - Drivers       +------------------------------------+ +-------------------------+
|  - Stores        |  [Sparkles] Run Payroll Engine    | | Unapproved Payouts      |
|  - Products      |  Store Hub: [ Select store    [V] ] | | ₹42,500.00              |
|  - Users         |  Start Date: [ YYYY-MM-DD     [#] ] | +-------------------------+
|  - Payroll (Act) |  End Date:   [ YYYY-MM-DD     [#] ] | Drivers Accounted         |
|    - Console     |                                    | | 12 active drivers       |
|    - Ledger      |  [ Generate Store Payroll ]        | +-------------------------+
|    - Settings    +------------------------------------+ | Total Deliveries Billed |
|                                                         | | 240 completed orders    |
|                  +------------------------------------+ +-------------------------+
|                  | [Banner] Verify & Export Bank CSV  | | Total Distance Traveled |
|                  | Click to view ledgers -> [Go]      | | 1,240.5 km              |
|                  +------------------------------------+ +-------------------------+
+-----------------------------------------------------------------------------------+
```

---

## 2. Component & Field Behaviors

### Store Hub Selector
- **Super Admin**: Dropdown containing all active store locations in the monorepo.
- **Store Manager**: Non-interactive input, automatically locked to the store ID corresponding to their user profile.

### Date Inputs
- Selects the start and end dates for the billing run.
- Default: Automatically initialized to the current calendar week (Monday to Sunday).
- Validation: End Date cannot precede Start Date. Invalid range displays inline warning alert.

---

## 3. API & Data Requirements

- **GET `/stores`**: Resolves list of store hubs for selection.
- **GET `/payroll/ledgers`**: Retrieves current drafted payouts to compute cumulative overview statistics (Gross payout, Drivers, Deliveries, telemetry distance).
- **POST `/payroll/generate`**: Dispatches generation requests for selected Store ID and date parameters.

---

## 4. States & Acceptance Criteria

### Loading & Empty States
- Form submission displays spinner state on the CTA button ("Computing Salaries...").
- Empty states on metrics show `₹0.00` or `0` with helper text.

### Acceptance Criteria
1. Submitting the generation form triggers a database transaction that deletes existing drafts for that period before recreating new items (idempotence).
2. Payout calculations must correctly account for completed orders within the chosen period.
