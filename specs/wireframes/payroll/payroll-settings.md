# Screen Spec: Payroll Settings
**Route:** `/payroll/settings`  
**Figma Frame Size:** `Desktop / 1440 x 900`  
**Roles permitted:** `super_admin` (Managers have read-only visibility or restricted access)

---

## 1. Visual Layout Wireframe

```text
+-----------------------------------------------------------------------------------+
|  [Logo] LogiRoute                Search...                            [Bell] Admin|
+-----------------------------------------------------------------------------------+
|  (Nav)                           Payroll Settings                                 |
|  - Dashboard      Configure compensation rates, telemetric multipliers, and surges |
|  - Live Map                                                                       |
|  - Orders        +----------------------------------+ +---------------------------+
|  - Drivers       | Global Parameters (Fallback)    | | Configure Store Override  |
|  - Stores        | Base order rate:   [ ₹20.00 ]    | | Store Hub:  [Select store] |
|  - Products      | Per-km rate:       [ ₹5.00  ]    | | Base order: [ ₹22.00  ]  |
|  - Users         | Night surge rate:  [ ₹10.00 ]    | | Per-km:     [ ₹6.00   ]  |
|  - Payroll       | Weather surge rate:[ ₹15.00 ]    | |                           |
|    - Console     | Late SLA penalty:  [ ₹5.00  ]    | | [ Apply Store Overrides ] |
|    - Ledger      |                                  | +---------------------------+
|    - Settings    | [ Save Global Defaults ]         | Active Override Policies    |
|                                                       | - Downtown Store (Edit / Delete)
|                                                       | - North Hub Store (Edit / Delete)
+-----------------------------------------------------------------------------------+
```

---

## 2. Field & Validation Behaviors

### Parameter Pricing Values
- Inputs accept decimal float values corresponding to Indian Rupees (₹).
- Validation: Value must be non-negative.
- Database mapping: Values are multiplied by 100 on post to database schema (e.g. ₹20.50 -> 2050 paise/cents).

### Store override association
- Selects a target store location.
- Restricts selection to stores that do not currently have another override configured.
- Clicking Edit on an override card prepopulates the override form for modification.
- Clicking Delete prompts a confirmation popup to delete the override and revert the store's billing policies back to the global defaults.

---

## 3. API & Data Requirements

- **GET `/payroll/configurations`**: Resolves list of all active configurations.
- **POST `/payroll/configurations`**: Dispatches config payload. Global defaults pass `storeId: null`. Overrides pass `storeId: "store-uuid"`.
- **DELETE `/payroll/configurations/:id`**: Deletes a specific store override configuration.

---

## 4. Acceptance Criteria

1. Only users with the `super_admin` role can edit or delete the rates. Other roles receive read-only fields or restricted access.
2. Saving configurations invalidates React Query caches for `["payroll", "configurations"]` to trigger immediate update of active parameters.
3. Deleting a store override successfully reverts the store parameter calculations to the global default parameters.
