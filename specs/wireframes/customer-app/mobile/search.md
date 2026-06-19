# Wireframe Spec: Customer Product Search & Results

## Screen

Customer App — Search & Results

## Purpose

Enables customers to search the store's product catalog. Displays instant keyword suggestions as they type, and a filterable grid of matching products once searched.

## MVP Source

From `product.md` Section 6, Screen C1:
- Browse product catalog, search products, add items to cart.

## Supported Roles

- Guest / Customer

## Primary User Goal

Find specific products by typing keywords, filter the search results, and add items directly to their cart.

---

## Screen Layout — Step 1: Typing / Suggestions

```text
┌──────────────────────────────┐
│  ← [ Search products...   ] ✕│  <- Back + active search input + clear button
│                              │
│  Recent Searches             │
│  🕐 milk                     │  <- Tapping re-runs search
│  🕐 organic eggs             │
│                              │
│  Popular Suggestions         │
│  📈 fresh fruits             │
│  📈 soft drinks              │
│                              │
└──────────────────────────────┘
```

## Screen Layout — Step 2: Results Grid

```text
┌──────────────────────────────┐
│  ← [ milk                 ] ✕│
│                              │
│  ┌────────┐ ┌────────┐ ┌────┐│  <- Horizontal filter chips
│  │ Price ▾│ │ Veg    │ │In  ││
│  └────────┘ └────────┘ └────┘│
│                              │
│  Showing 12 results for "milk"│
│  ┌───────────┐ ┌───────────┐ │  <- 2-Column Product Grid
│  │  [Image]  │ │  [Image]  │ │
│  │  Organic  │ │  Amul     │ │
│  │  Milk 1L  │ │  Butter   │ │
│  │  $1.99    │ │  $3.49    │ │
│  │  [ Add ]  │ │  [- 1 +]  │ │
│  └───────────┘ └───────────┘ │
│                              │
│ ┌──────────────────────────┐ │  <- Floating Cart Bar (Appears when cart > 0)
│ │ 2 Items | $4.48  Cart 🛒 │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## Component Checklist

### Active Search Header
- **Back Button:** navigates back to Home storefront.
- **Search Input:** size=302×44, auto-focuses on screen load.
- **Clear Button:** `✕` trailing icon, visible when input text length >= 1. Tapping clears text and resets screen state to Step 1.

### Autocomplete List (Step 1)
- **Recent Searches:** List of last 5 queries with clock icons. Tapping populates search and runs query.
- **Popular Keywords:** List of trending search terms with trending icons.

### Filters Row (Step 2)
- **Filter Chips:** Height=32px, radius=`radius.full`, background=`white`, border=1px `neutral.300`. Tapping toggles filter (active state changes to green background, white text).

### Products Grid (Step 2)
- **Layout:** Grid, 2 columns, gap=16px.
- **Product Card:** (Matches storefront card specs in [home.md](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/home.md)). Displays image, title, unit size, price, and Add Button/Counter.
- **Tapping Card Body:** navigates to `/products/:id` (`product-detail.md`).

### Empty Results State
Replaces product grid if no matches are found:
- **Empty Graphic:** search-off icon.
- **Error Title:** "No results found for '{query}'" — `body.16.medium`, `neutral.950`.
- **Subtitle:** "Check spelling or browse featured categories instead." — `caption.14.regular`, `neutral.500`.

---

## API Requirements

### Reads
- `GET /products/search?query=:query` -> returns autocomplete list (typeahead).
- `GET /products?search=:query&category=:category` -> returns matching items.
- *Pagination:* `GET /products?search=:query&page=:page&limit=20` (optimized to prevent heavy database loads).

---

## Acceptance Criteria

- Keyboard is automatically focused in the search input on page load.
- Clear `✕` button appears when the user types, and disappears when input is empty.
- Autocomplete matches search terms dynamically (300ms debounce).
- Tapping autocomplete items, recent searches, or popular suggestions immediately submits query and renders the Results Grid.
- Filter chips narrow the results list.
- If search yields zero results, displays a clean empty state card.
- Floating Cart Bar appears instantly if user adds any item to their cart.
