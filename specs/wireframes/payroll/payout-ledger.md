# Screen Spec: Payout Ledger
**Route:** `/payroll/payouts`  
**Figma Frame Size:** `Desktop / 1440 x 900`  
**Roles permitted:** `super_admin`, `store_manager`, `dispatcher`

---

## 1. Visual Layout Wireframe

```text
+-----------------------------------------------------------------------------------+
|  [Logo] LogiRoute                Search...                            [Bell] Admin|
+-----------------------------------------------------------------------------------+
|  (Nav)                           Payout Ledger                                    |
|  - Dashboard      Audit driver payouts, view compensation breakdowns, export CSV.  |
|  - Live Map                                                                       |
|  - Orders        [ Search driver...    ]  [ Store: All  [V] ]   [ Export CSV ]    |
|  - Drivers                                                                        |
|  - Stores        +-------------------------------------------------------------+  |
|  - Products      | [Drafts]  [Approved]  [On Hold]  [Settled]                  |  |
|  - Users         +-------------------------------------------------------------+  |
|  - Payroll       | Driver Name     | Hub Store | Period     | Orders | Payout  |  |
|    - Console     |-----------------|-----------|------------|--------|---------|  |
|    - Ledger      | John Doe        | Downtown  | 07/01-07/07| 20     | ₹4,500  |  |
|    - Settings    | Jane Smith      | Uptown    | 07/01-07/07| 18     | ₹3,950  |  |
|                  +-------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Drawer/Modal View: Salary Breakdown
Clicking on a driver row opens a slide-over modal detailing the calculation details:
- **Header**: Driver details, active store hub, and dates.
- **Delivery Commission**: Gross deliveries count $\times$ per-order base configuration rate.
- **Distance Pay**: Telemetric mileage (Sum of sequential location pings) $\times$ distance parameter.
- **Surge Additions**: Cumulative Night Surge and Weather Surge payouts.
- **Deductions**: SLA penalties (e.g. delivery elapsed time exceeded 30 minutes).
- **Payment Reference**: Input field for Super Admins to save transaction IDs on settlement.

---

## 3. API & Data Requirements

- **GET `/payroll/ledgers`**: Query parameters `storeId`, `status`, `startDate`, `endDate`, `page`, `limit`.
- **PATCH `/payroll/ledgers/:id`**: Accepts `{ status: 'approved' | 'hold' | 'paid', paymentReference: string }`.
- **GET `/payroll/ledgers/export`**: Triggers CSV generation containing all matching approved statements for bank uploading.

---

## 4. Acceptance Criteria

1. Non-admin managers can only view ledgers matching their store ID.
2. Clicking "Export Approved CSV" compiles only records with `status: 'approved'`.
3. Settle transaction form validates that reference code is not empty before updating ledger status to `paid`.
