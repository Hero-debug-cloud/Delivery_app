# Wireframe Spec: Shared Feedback States

## Purpose

Define global visual states and components for **Loading Skeletons**, **Empty States**, **Error Banners**, **Success/Failure Toasts**, and **Search/Filter Interactions** across the LogiRoute web and mobile interfaces. 

This file is a shared reference. Feature-specific pages must link to these components to ensure visual consistency and reduce redundancy.

---

## 1. Loading Skeletons

To avoid layout shifts (CLS) and provide smooth transitions, pages show pulsing skeleton frames while fetching data.

### 1.1 Data Table Skeleton (Desktop Web)

Used on list pages (`/stores`, `/orders`, `/delivery-partners`) while loading tabular data.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
40px │ [  Search Skeleton  ]  [ Filter Skeleton ]                              │
     ├─────────────────────────────────────────────────────────────────────────────┤
48px │ Column 1        Column 2        Column 3        Column 4        Actions     │
     ├─────────────────────────────────────────────────────────────────────────────┤
56px │ ░░░░░░░░░       ░░░░░░░░░░░░░   ░░░░░░░░        ░░░░░░          [░░░]       │
56px │ ░░░░░░░░░░░     ░░░░░░░░░░      ░░░░░░░░        ░░░░░░          [░░░]       │
56px │ ░░░░░░░░        ░░░░░░░░░░░░    ░░░░░░░░        ░░░░░░          [░░░]       │
     └─────────────────────────────────────────────────────────────────────────────┘
```

#### Figma Specifications
- **Pulsing Animation:** Infinite transition from `neutral.100` to `neutral.200` back to `neutral.100` (duration: 1.5s, ease-in-out).
- **Header Row:** height=48px, background=`neutral.50`, text=`caption.14.medium`, color=`neutral.500`.
- **Skeleton Rows (5 rows baseline):**
  - Height: 56px per row.
  - Border-bottom: 1px `neutral.100`.
  - Cells contain rounded rectangles: height=16px, radius=`radius.sm` (8px), width=relative to column (40% to 70% cell width), color=pulsing `neutral.100`.
- **Row Actions Column:** Contains a fixed pulsing square: size=24×24px, radius=`radius.sm` (8px).

---

### 1.2 Card Skeleton (Desktop Web)

Used on detail pages (`/stores/:id`, `/orders/:id`, `/delivery-partners/:id`) while loading block info.

```text
┌──────────────────────────────────────────┐
│  ░░░░░░░░░░░░░                           │  <- Card Title (24px high)
│  ──────────────────────────────────────  │  <- Separator
│  ░░░░░░    ░░░░░░░░░░░░░░░               │  <- Key-Value Row 1
│  ░░░░░░    ░░░░░░░░░                     │  <- Key-Value Row 2
│  ░░░░░░    ░░░░░░░░░░░░                  │  <- Key-Value Row 3
└──────────────────────────────────────────┘
```

#### Figma Specifications
- **Card Container:** Match target card size (e.g., 480×200px), fill=`white`, radius=`radius.lg` (24px), shadow=`shadow.card`, padding=24px.
- **Title Block:** height=24px, width=160px, radius=`radius.sm` (8px), color=pulsing `neutral.100`.
- **Separator:** height=1px, background=`neutral.200`, margin-top=16px, margin-bottom=16px.
- **Form Rows (3 rows baseline):**
  - Key Label: height=16px, width=80px, radius=`radius.sm` (8px), color=pulsing `neutral.50`.
  - Value Field: height=16px, width=180px, radius=`radius.sm` (8px), color=pulsing `neutral.100`.
  - Gap: 16px between rows.

---

## 2. Empty States

Displayed when there is no data to show, directing the user toward a clear action.

### 2.1 List Empty State (Desktop Web)

```text
┌────────────────────────────────────────────────────────┐
│                                                        │
│                          🗳️                            │  <- Large Slate Icon
│                    No stores yet                       │  <- Heading
│      Add your first store to start managing routes.    │  <- Body Text
│                                                        │
│                     [+ Add Store]                      │  <- Primary CTA
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Figma Specifications
- **Container:** Width=1136px, height=400px, background=`white`, radius=`radius.lg` (24px), border=1px dashed `neutral.200`, flex-column, centered.
- **Icon:** 48×48px outline icon (e.g., store, package, or user-plus), color=`neutral.300`.
- **Heading:** `heading.20.semibold`, color=`neutral.950`, margin-top=16px.
- **Body Text:** `body.16.regular`, color=`neutral.500`, margin-top=8px, text-align=center, max-width=400px.
- **CTA Button:** `size=160×40`, fill=`primary.600`, radius=`radius.md` (12px), text=white `body.16.medium`, margin-top=24px.

---

### 2.2 Search / Filter Empty State (Desktop Web)

Displayed when search results or active filters yield zero records.

```text
┌────────────────────────────────────────────────────────┐
│                          🔍                            │
│                 No matching records                    │
│      Try adjusting your search terms or filters to     │
│      find what you're looking for.                     │
│                                                        │
│                   [Clear Filters]                      │  <- Secondary CTA
└────────────────────────────────────────────────────────┘
```

#### Figma Specifications
- **Container:** Same card dimensions, flex-column, centered.
- **Icon:** 40×40px search-off icon, color=`neutral.300`.
- **Heading:** `heading.20.semibold`, color=`neutral.950`, margin-top=16px.
- **Body Text:** `body.16.regular`, color=`neutral.500`, margin-top=8px, text-align=center, max-width=440px.
- **Clear Button:** `size=144×40`, fill=`white`, border=1px `neutral.300`, radius=`radius.md` (12px), text=`neutral.700` `body.16.medium`, margin-top=20px.

---

## 3. Error States

Displayed when an API call fails or the network is disconnected.

### 3.1 Inline Error Alert (Shared Web/Mobile)

Used inside cards, modals, or forms to show submission or loading failures.

```text
┌────────────────────────────────────────────────────────┐
│  ⚠️  Unable to load details. Please check your         │
│      connection and try again.              [Retry]    │
└────────────────────────────────────────────────────────┘
```

#### Figma Specifications
- **Container:** width=full (to fit parent card/modal padding), height=auto (min-height=56px), padding=12px 16px, background=`error.50`, border=1px `error.300`, radius=`radius.sm` (8px), flex-row, vertical-center, space-between.
- **Icon:** alert-triangle, 20×20px, color=`error.600`.
- **Error Text:** `caption.14.regular`, color=`error.600`, flex-grow=1, margin-left=12px.
- **Retry Action:** Text button: "Retry", type=`caption.14.medium`, color=`error.600`, text-decoration=underline, cursor=pointer.

---

## 4. Success States (Toast Feedback)

Toasts slide in from the top-right (desktop) or top-center (mobile) and auto-dismiss after 5 seconds. They confirm successful mutations.

```text
┌──────────────────────────────────────────┐
│  ✅  Store saved successfully!       ✕   │  <- Success Toast
├──────────────────────────────────────────┤
│  ======================================  │  <- Progress timer bar (shrinks left)
└──────────────────────────────────────────┘
```

### 4.1 Success Toast Specs
- **Dimensions:** width=360px, height=64px, background=`white`, radius=`radius.md` (12px), shadow=`shadow.card`, border-left=4px `success.600`, padding=16px, position=fixed, top=32px, right=32px.
- **Icon:** check-circle, 20×20px, color=`success.600`.
- **Text:** `body.16.medium`, color=`neutral.950`, margin-left=12px.
- **Close Button:** x-icon, 16×16px, color=`neutral.400`, right-aligned, cursor=pointer.
- **Progress Bar:** height=3px, background=`success.600`, absolute at bottom, animating width from 100% to 0% over 5s.

### 4.2 Error Toast Specs
- Same dimensions and layout, except:
  - Border-left: 4px `error.600`.
  - Icon: x-circle, 20×20px, color=`error.600`.
  - Progress Bar: height=3px, background=`error.600`.
  - Text: "Failed to save store. Please check errors."

---

## 5. Filters & Search Interactions

Ensures search boxes and dropdown filters provide active feedback and are easy to clear.

```text
  Search Field:                     Active Filter Chips Row:
  ┌─────────────────────────┐       ┌─────────────────┐ ┌─────────────────┐
  │ 🔍  Search...        ⏳ │       │ Status: Active ✕│ │ Store: East  ✕  │ [Clear All]
  └─────────────────────────┘       └─────────────────┘ └─────────────────┘
```

### 5.1 Search Input with Loader
- **Idle State:** Background=`white`, border=1px `neutral.300`, placeholder=`neutral.400` ("Search...").
- **Searching State (Debounced):**
  - Triggered after typing stops (300ms debounce).
  - Trailing icon changes from empty/clear to an animated spinner: 16×16px, color=`primary.600`.
- **Cleared State:**
  - If text is present, trailing icon becomes `✕` (clear button, 16×16px, `neutral.400`), clicking clears input immediately and refetches.

### 5.2 Active Filter Chips Row
Placed directly below the filters row when one or more filters are active.
- **Chip Container:** Height=32px, background=`primary.50`, border=1px `primary.200`, radius=`radius.full` (999px), padding=4px 12px, gap=8px, flex-row, vertical-center.
- **Chip Text:** "Category: Value" (e.g., "Status: Active") — `tiny.12.medium`, color=`primary.600`.
- **Remove Icon:** `✕` icon, 12×12px, color=`primary.600`. Hover state changes color to `primary.700`. Clicking removes this filter.
- **Clear All Button:** Text button "Clear All", type=`tiny.12.medium`, color=`neutral.500` (hover: `error.600`), placed at the end of the chips row.

---

## 6. Pagination Controls Component

Provides standardized navigation and size bounds for large collections, reducing server-side database load.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Showing 1 to 20 of 142 entries     Show: [ 20 ▾ ] rows    [◀] [1] 2 3 [▶]   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.1 Layout & Visual Specs
- **Height & Spacing:** height=56px, background=`white`, border-top=1px `neutral.200`, padding=12px 24px, flex-row, vertical-center, space-between, placed at the footer of the data table.
- **Entries Summary (Left):** "Showing {start} to {end} of {total} entries" — `caption.14.regular`, color=`neutral.500`.

### 6.2 Rows-per-Page Controller (Center)
- **Label:** "Show: " — `caption.14.regular`, color=`neutral.500`.
- **Dropdown Trigger:** `Select` component, size=80×36px, border=1px `neutral.300`, radius=`radius.sm` (8px), text=`body.16.regular` `neutral.950`. Options: `10`, `20`, `50`, `100`.

### 6.3 Page Navigation (Right)
- **Previous/Next Buttons:** size=36×36px, radius=`radius.sm` (8px), border=1px `neutral.300` (disabled border: `neutral.200`), flex-row, centered, cursor=pointer.
  - *Active:* fill=`white`, text=`neutral.700` (hover: background=`neutral.100`).
  - *Disabled:* fill=`white`, text=`neutral.300`, cursor=not-allowed.
- **Page Numbers:** size=36×36px, radius=`radius.sm` (8px), flex-row, centered, cursor=pointer.
  - *Active Page:* fill=`primary.50`, border=1px `primary.200`, text=`primary.600` `body.16.medium` (bold).
  - *Inactive Page:* fill=`white`, text=`neutral.600` (hover: background=`neutral.100`).
- **Gap:** 4px between navigation buttons.

