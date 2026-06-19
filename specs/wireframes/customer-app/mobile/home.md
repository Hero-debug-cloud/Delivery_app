# Wireframe Spec: Customer Home / Storefront

## Screen

Customer App — Home Page

## Purpose

The central shopping storefront. Customers can see delivery ETA, select their address, search for products, browse promotional offers, click product categories, and add items directly to their cart.

## MVP Source

From `product.md` Section 6, Screen C1:
- Browse product catalog, checkout, and address selection.

## Supported Roles

- Guest / Customer

## Primary User Goal

Find and add items to their cart quickly, and monitor their delivery address and ETA at a glance.

---

## Screen Layout

```text
┌──────────────────────────────┐
│  ⚡ 10 MINS            👤     │  <- Speed delivery ETA & Profile avatar
│  Delivering to: Home ▾       │  <- Address picker dropdown
│  45 Park Ave, New York       │
│                              │
│  ┌────────────────────────┐  │
│  │ 🔍 Search "milk", "egg"│  │  <- Search Bar (tappable input)
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │   [ BANNER CAROUSEL ]  │  │  <- Flat 50% Off promotions
│  └────────────────────────┘  │
│                              │
│  Shop by Category            │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │🍓 │ │🥛 │ │🍪 │ │🧼 │     │  <- Category Grid (Fruits, Dairy, Snacks)
│  └───┘ └───┘ └───┘ └───┘     │
│                              │
│  Trending Items              │
│  ┌───────────┐ ┌───────────┐ │  <- Horizontal Scroll Shelf
│  │  [Image]  │ │  [Image]  │ │
│  │  Fresh    │ │  Brown    │ │
│  │  Milk 1L  │ │  Bread    │ │
│  │  $1.99    │ │  $2.49    │ │
│  │  [ Add ]  │ │  [- 1 +]  │ │  <- Add-to-cart buttons
│  └───────────┘ └───────────┘ │
│                              │
│ ┌──────────────────────────┐ │  <- Floating Cart Bar (Appears when cart > 0)
│ │ 2 Items | $4.48  Cart 🛒 │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

---

## Component Checklist

### Header Area
- **Speed Delivery Badge:** `tiny.12.medium`, fill=`theme.customer.primary.900` (dark green), text=`white`. Shows estimated store delivery travel time (e.g. "⚡ 10 MINS").
- **Address Picker Trigger:** `body.16.medium`, `neutral.950` with a chevron-down icon. Displays selected label (e.g., "Home"). Tapping opens the address selector modal.
- **Sub-Address:** `caption.14.regular`, `neutral.500`. Shows resolved street address.
- **Profile Icon:** avatar initials placeholder, y=top right. Tapping navigates to profile/order history.

### Search Entry Bar
- **Input box:** `size=342×44`, fill=`neutral.100`, border=1px `neutral.200`, placeholder=`neutral.400` ("Search 'milk', 'bread', 'eggs'..."). Leading search icon. Tapping opens the `/search` screen.

### Promotional Banner Carousel
- **Horizontal Swipe:** `size=342×120`, radius=`radius.md` (12px), background=`gradient.brand.dark`. Auto-swipes promotions.

### Category Grid
- **Layout:** Grid, 4 columns, gap=12px.
- **Category Card:** `size=72×96`, fill=`neutral.50`, radius=`radius.sm` (8px), vertical centering. Displays icon (e.g., milk carton, apple) and category label (`tiny.12.medium`, `neutral.800`). Tapping filters and navigates to the `/search` screen.

### Horizontal Product Shelf
- **Shelf Title:** `heading.20.semibold`, `neutral.950`.
- **Product Card:** `size=140×200`, background=`white`, radius=`radius.md` (12px), border=1px `neutral.100`.
  - Image: upper 100px.
  - Title: "Fresh Banana" — `caption.14.medium`, `neutral.950`.
  - Price: "$1.99" — `caption.14.medium` (bold), `neutral.950`.
  - Add to Cart Button:
    - *Default State:* `size=108×36`, border=1px `theme.customer.primary.600` (green), text=`theme.customer.primary.600` "Add", fill=`white`.
    - *Active State:* `size=108×36`, fill=`theme.customer.primary.600` (green), text=`white`, displays counter: `[- 1 +]`.

### Floating Cart Tray (Success Green)
- **Position:** Floating at `bottom=24px` from screen edge, width=342px, height=56px.
- **Fill:** `theme.customer.primary.600` (success green), radius=`radius.md` (12px), shadow=`shadow.button.customer`.
- **Left Side:** "X Items | $Y.00" — `body.16.medium`, `white`.
- **Right Side:** "View Cart 🛒" — `body.16.medium`, `white`. Tapping navigates to `/cart`.

---

## API Requirements

### Reads
- `GET /stores/nearest` -> gets closest active store based on user GPS to calculate ETA.
- `GET /products/featured` -> populates the trending scroll shelves.

---

## Acceptance Criteria

- Stores nearest user GPS are calculated on load. If no stores are nearby, header displays "Deliveries unavailable in this area".
- Tapping the search bar navigates the user directly to the `/search` screen with keyboard focused.
- Tapping a category navigates to `/search` with that category pre-selected as a filter.
- Product shelves can be scrolled horizontally.
- Tapping the `[Add]` button immediately increments cart state by 1 and transforms the button into a counter button `[- 1 +]`.
- Counter inputs allow incrementing (`+`) or decrementing (`-`). If count reaches 0, the button reverts back to the `[Add]` label.
- The Floating Cart Tray is hidden when cart is empty. It immediately appears with a slide-up animation when items count >= 1.
- Tapping the Floating Cart Tray navigates the user to the Cart & Checkout page `/cart`.
