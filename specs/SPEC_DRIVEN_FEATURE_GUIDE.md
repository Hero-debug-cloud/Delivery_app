# Spec-Driven Feature Creation Guide
## Instructions for Future AI Agents

This file defines the required process for creating every new LogiRoute feature specification, wireframe, and Figma-ready screen document.

Future AI agents must follow this guide before creating or modifying feature specs.

---

## 1. Core Principle

Every feature must be created using **spec-driven development**.

That means each feature should have clear markdown specs before implementation begins:

1. Product intent
2. User roles
3. Routes/screens
4. Figma-ready visual layout
5. Field and component behavior
6. API/data requirements
7. Empty/loading/error states
8. Acceptance criteria

Do not jump directly into code or UI implementation without first creating the spec files.

---

## 2. Required Source References

Before creating a new feature spec, read and align with:

```text
product.md
mvp-v1.md
specs/design-system/README.md
specs/design-system/colors.md
specs/design-system/typography.md
specs/design-system/spacing.md
```

If the feature belongs to an existing module, also read the existing specs in that module folder.

Example:

```text
specs/wireframes/authentication/web/
```

---

## 3. Global Design System Rule

Never define a standalone page-specific color scheme.

All features must reference the global design system:

```text
specs/design-system/colors.md
specs/design-system/typography.md
specs/design-system/spacing.md
```

If a needed token does not exist:

1. Add it to the appropriate global design system file.
2. Explain why it is needed.
3. Reference it from the feature spec.

Do not scatter colors, typography rules, shadows, or spacing systems across feature folders.

---

## 4. Folder Structure Standard

Feature specs should live under:

```text
specs/wireframes/{feature-name}/{platform}/
```

Examples:

```text
specs/wireframes/authentication/web/
specs/wireframes/dashboard/web/
specs/wireframes/stores/web/
specs/wireframes/orders/web/
specs/wireframes/delivery-partner/mobile/
specs/wireframes/customer-tracking/web/
```

Use lowercase folder names and hyphens for multi-word features.

---

## 5. Required Files per Feature

Each feature folder should usually include:

```text
README.md
index.md
{screen-name}.md
```

Example:

```text
specs/wireframes/orders/web/
├── README.md
├── index.md
├── list.md
├── detail.md
└── assign-driver.md
```

### File Purpose

| File | Purpose |
| :--- | :--- |
| `README.md` | Feature overview, routes, user roles, screen list, source references. |
| `index.md` | Entry route behavior, redirects, default state, navigation rules. |
| `{screen}.md` | Figma-ready spec for a specific page/screen. |

For very small features, `README.md` can be optional, but prefer including it for consistency.

---

## 6. Required Sections in Every Screen Spec

Each screen markdown file must include these sections unless clearly not applicable.

```text
# Wireframe Spec: {Screen Name}

## Route / Screen
## Purpose
## MVP Source
## Supported Roles
## Primary User Goal
## Page Layout / Screen Layout
## Figma Screen Specification
## Fields
## Actions
## States
## Error States
## Loading States
## Empty States
## Component Checklist
## API / Data Requirements
## Acceptance Criteria
## Implementation Notes
```

For mobile screens, use `Screen` instead of `Route` when there is no URL.

---

## 7. Figma-Ready Requirements

Every visual screen spec must be detailed enough that a designer can recreate the screen in Figma without guessing.

Include:

1. Figma frame name
2. Frame size
3. Background color token
4. Layout grid
5. Major containers
6. Container positions
7. Container sizes
8. Padding
9. Gaps
10. Component dimensions
11. Typography tokens
12. Color tokens
13. Interaction states
14. Responsive/mobile version, when applicable

### Required Figma Frame Naming

Use this naming pattern:

```text
{Feature} / {Screen} / {Platform or Breakpoint}
```

Examples:

```text
Auth / Login / Desktop
Auth / Login / Mobile
Orders / List / Desktop
Orders / Detail / Desktop
Driver App / Active Delivery / Mobile
```

---

## 8. Standard Frame Sizes

Use the global sizes below unless the user requests otherwise.

| Target | Frame Size |
| :--- | :--- |
| Desktop | `1440 × 1024` |
| Laptop | `1280 × 832` |
| Tablet | `768 × 1024` |
| Mobile | `390 × 844` |

For MVP specs, always include at least:

- Desktop for web admin pages.
- Mobile for mobile app pages.
- Mobile responsive variant for public/customer web pages when needed.

---

## 9. Standard Web Layout Grid

### Desktop

```text
Columns: 12
Margin: 80px
Gutter: 24px
Content width: 1280px
```

### Mobile

```text
Columns: 4
Margin: 24px
Gutter: 16px
Content width: 342px
```

If a page needs a different grid, document why.

---

## 10. Wireframe Format

Each screen should include a simple text wireframe before the Figma details.

Example:

```text
┌──────────────────────────────────────────────┐
│ Header                                       │
├──────────────────────────────────────────────┤
│ Sidebar │ Main Content                       │
│         │ ┌──────────────┐ ┌──────────────┐ │
│         │ │ Card         │ │ Card         │ │
│         │ └──────────────┘ └──────────────┘ │
└──────────────────────────────────────────────┘
```

Then include exact Figma details below it.

---

## 11. Data and API Requirements

Every screen should list the data it needs.

Example:

```text
## API / Data Requirements

Reads:
- GET /orders
- GET /delivery-partners?status=online

Writes:
- POST /orders/:id/assign

Required data fields:
- order.id
- order.status
- order.customer_name
- order.delivery_address
- driver.id
- driver.name
- driver.status
```

If endpoints do not exist yet, mark them as proposed.

---

## 12. State Requirements

Every screen must document these states:

### Loading State

What appears while data is loading.

### Empty State

What appears when there is no data.

### Error State

What appears when API/data loading fails.

### Success State

What appears after a successful action, if applicable.

### Permission State

What appears if the user does not have access.

---

## 13. Acceptance Criteria

Each screen must end with testable acceptance criteria.

Bad:

```text
- Page works well.
```

Good:

```text
- Store Manager can view only orders belonging to their assigned store.
- Dispatcher can assign an order to an online driver.
- Assign button is disabled when no online drivers are available.
- Failed API requests show a retry action.
```

Acceptance criteria should be specific enough to drive implementation and QA.

---

## 14. Feature Creation Workflow

Follow this workflow for every new feature.

### Step 1: Understand Scope

Read:

```text
product.md
mvp-v1.md
```

Identify whether the feature is in MVP v1 or deferred.

### Step 2: Create Folder

Create:

```text
specs/wireframes/{feature}/{platform}/
```

### Step 3: Create Feature README

Include:

- Feature purpose
- User roles
- Screen list
- Routes
- MVP source references
- In-scope items
- Out-of-scope items

### Step 4: Create Screen Specs

For each page/screen, create a separate `.md` file.

### Step 5: Add Figma Details

Every screen spec must include:

- Frame name
- Frame size
- Coordinates
- Component sizing
- Token references
- States

### Step 6: Verify Against Global Design System

Check that no new local color scheme was invented.

### Step 7: Verify Completeness

Confirm each screen includes:

- Layout
- Fields
- Actions
- States
- API/data
- Acceptance criteria

---

## 15. Recommended Feature Order for MVP v1

After authentication, create specs in this order:

1. Dashboard
2. Stores
3. Delivery Partners
4. Orders
5. Dispatch / Assign Driver
6. Live Tracking
7. Customer Tracking
8. Delivery Partner Mobile App

---

## 16. Example Feature Folder

```text
specs/wireframes/dashboard/web/
├── README.md
├── index.md
└── overview.md
```

Example contents:

```text
# Wireframe Spec: Dashboard Overview

## Route
/dashboard

## Purpose
Show operational summary for active orders, available drivers, delivered orders, and failed orders.

## MVP Source
From mvp-v1.md: Admin dashboard with active orders, available drivers, delivered today, failed today, and active map.

## Figma Screen Specification
Frame: Dashboard / Overview / Desktop — 1440×1024
References:
- specs/design-system/colors.md
- specs/design-system/typography.md
- specs/design-system/spacing.md
```

---

## 17. Naming Conventions

### File Names

Use lowercase and hyphens:

```text
assign-driver.md
live-map.md
order-detail.md
```

### Routes

Use clean app routes:

```text
/dashboard
/stores
/stores/:id
/orders
/orders/:id
```

### Figma Frames

Use title case with slashes:

```text
Orders / List / Desktop
Orders / Detail / Desktop
```

---

## 18. Quality Checklist Before Finishing

Before saying the feature spec is complete, verify:

```text
[ ] Feature folder exists in specs/wireframes
[ ] README.md exists or omission is justified
[ ] Each screen has its own .md file
[ ] Each screen references global design system files
[ ] No local color scheme is invented
[ ] Wireframe text block exists
[ ] Figma frame sizes are included
[ ] Desktop/mobile variants are included where needed
[ ] Fields and validation are documented
[ ] Actions are documented
[ ] API/data requirements are documented
[ ] Loading/empty/error states are documented
[ ] Acceptance criteria are testable
```

---

## 19. Important Instruction for Future AI Agents

When the user asks to create a new feature, do not ask unnecessary follow-up questions if the feature is already described in `mvp-v1.md`.

Instead:

1. Read the relevant MVP section.
2. Create the correct folder structure.
3. Create Figma-ready markdown specs.
4. Reference global design tokens.
5. Verify the files.
6. Report back with the created paths and a short summary.

Only ask the user if the requested feature is ambiguous or conflicts with the MVP scope.
