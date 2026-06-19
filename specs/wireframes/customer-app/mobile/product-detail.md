# Wireframe Spec: Customer Product Details

## Screen

Customer App — Product Details Screen

## Purpose

Provides details for a single product, showing unit sizes, ingredients, shelf-life, and images. Allows adding/modifying order quantity directly.

## MVP Source

From `product.md` Section 6, Screen C1:
- Product details and catalog browsing.

## Supported Roles

- Guest / Customer

## Primary User Goal

Review product descriptions and specifications before deciding to purchase, and add the product to their cart.

---

## Screen Layout

```text
┌──────────────────────────────┐
│  ← Back                [📤] 🛒│  <- Back button + Share + Cart Icon
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │   [IMAGE CAROUSEL]     │  │  <- Swipeable images
│  │      o  •  o  o        │  │  <- Indicator dots
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  Amul Salted Butter          │  <- Product Title (heading.24.bold)
│  500g                        │  <- Unit size (caption.14.regular)
│                              │
│  $3.49                       │  <- Pricing
│  ⚡ Delivery in 10 mins      │  <- Delivery Speed Badge
│                              │
│  ┌────────────────────────┐  │
│  │      [  -  1  +  ]     │  │  <- Large counter button
│  └────────────────────────┘  │
│                              │
│  Product Details             │  <- Section Heading
│  Shelf Life: 9 Months        │
│  Origin: India               │
│  Ingredients: Milk Fat, Salt │
│                              │
└──────────────────────────────┘
```

---

## Component Checklist

### Floating Header Bar
- **Back Button:** Navigates back to the previous screen (Home storefront or Search results).
- **Share Icon:** Triggers system native sharing modal.
- **Cart Icon:** Icon button in top-right. Displays a red badge showing total cart count. Tapping navigates to `/cart`.

### Image Carousel
- **Layout:** Size=390×260px, centered.
- **Indicators:** Dots overlay at the bottom-center. Active dot = `theme.customer.primary.600` (green), inactive = `neutral.300`. Supports swipe gesture.

### Details & Pricing Card
- **Product Title:** `heading.20.semibold`, `neutral.950`.
- **Unit weight:** `caption.14.regular`, `neutral.500`.
- **Price Block:** "$3.49" — `heading.24.bold`, `neutral.950` (or `error.600` if on discount).
- **Delivery Speed Badge:** `tiny.12.medium`, fill=`theme.customer.primary.50`, text=`theme.customer.primary.600` (success green).
- **Add to Cart CTA:**
  - *Default State:* Size=342×52, fill=`theme.customer.primary.600` (green), text=`white` "Add to Cart", shadow=`shadow.button.customer`.
  - *Active State:* Size=342×52, fill=`theme.customer.primary.600` (green), text=`white`, displays counter: `[ -  1  + ]` with bold digits.

### Information Checklist
- **Details Heading:** `heading.20.semibold`, `neutral.950`, border-top=1px `neutral.200`, padding-top=20px.
- **Specs List:** Key-value lines, gap=12px.
  - Key: `caption.14.medium`, `neutral.500`.
  - Value: `body.16.regular`, `neutral.800`.

---

## API Requirements

### Reads
- `GET /products/:id` -> returns product info (title, description, price, image links, specifications).

---

## Acceptance Criteria

- Map carousel supports horizontal touch swipe gestures.
- Add to Cart button matches the current item count in the cart.
- Tapping `+` or `-` triggers immediate cart count updates and updates the header Cart Badge.
- Details specifications table is populated correctly from product properties.
- Back button returns to the exact previous view (preserving search query and list scroll position).
