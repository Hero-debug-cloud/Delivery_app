# Module Spec: Customer Mobile App (Quick Commerce)

## Module Purpose

The customer-facing portion of the single LogiRoute mobile application (or a standalone customer app). Modeled after modern quick-commerce services like **Zepto** or **Blinkit**, it enables customers to authenticate, browse/search products, add items to a cart, input delivery addresses, place prepaid or COD orders, and track deliveries end-to-end.

---

## Supported Roles

- **Customer** (app user)
- **Guest** (unauthenticated catalog browsing)

---

## Route & Screen Flow

```text
               ┌────────────────────────┐
               │    Guest / Login       │
               │      (auth.md)         │
               └───────────┬────────────┘
                           ▼
               ┌────────────────────────┐
               │      Home Page         │◄────────────────┐
               │      (home.md)         │                 │
               └─────┬───────────┬──────┘                 │
                     │           │                        │
        Search / Suggestions     ├─────────────────┐      │
                     │           │                 │      │
                     ▼           ▼                 ▼      │
               ┌───────────┐┌───────────┐   ┌───────────┐ │
               │ Search /  ││  Product  │   │   Cart    │ │
               │ Results   ││  Detail   │   │ (Tray /   │ │
               │(search.md)││(product-  │   │ Dedicated)│ │
               └─────┬─────┘│ detail.md)│   │ (cart-    │ │
                     │      └────┬──────┘   │checkout.md) │
                     │           │          └──────┬────┘ │
                     ▼           ▼                 │      │
               ┌────────────────────────┐          │      │
               │   Add-to-Cart Action   │──────────┘      │
               └────────────────────────┘                 │
                           │                              │
                           ▼                              │
               ┌────────────────────────┐                 │
               │        Checkout        │                 │
               │   (cart-checkout.md)   │                 │
               └───────────┬────────────┘                 │
                           ▼                              │
               ┌────────────────────────┐                 │
               │   Order Confirmation   │                 │
               │    (confirmation.md)   │                 │
               └───────────┬────────────┘                 │
                           ▼                              │
               ┌────────────────────────┐                 │
               │   Live Order Tracking  │─────────────────┘
               │ (customer-tracking/*)  │ (Back to Home)
               └────────────────────────┘
```

---

## Screen List

| File | Screen Name | Description |
| :--- | :--- | :--- |
| [README.md](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/README.md) | Module Index | Flow mapping and design system rules for the Customer mobile app. |
| [auth.md](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/auth.md) | Phone OTP Login | Mobile phone OTP verification screen for user onboarding/sign-in. |
| [home.md](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/home.md) | Home / Storefront | Catalog entry point, category selector grid, delivery ETA tag, search bar. |
| [search.md](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/search.md) | Search & Results | Autocomplete suggestions and product results list with filter chips. |
| [product-detail.md](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/product-detail.md) | Product Detail | Image carousel, weight/pricing info, catalog details, and cart add button. |
| [cart-checkout.md](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/cart-checkout.md) | Cart & Checkout | Cart list summary, checkout geofenced address picker, bill receipt, payment selector. |
| [confirmation.md](file:///Users/me/Projects/delivery_app/specs/wireframes/customer-app/mobile/confirmation.md) | Order Success | Order confirmation details showing placed status and link to live map tracking. |

---

## Global Design System Alignment

To maintain quick-commerce speed and density:
1. **Aesthetic Direction:** High visual density, clean grids, bold product cards, and vibrant visual hierarchy (using green primary accents for active cart indicators and speed delivery badges).
2. **Standard Mobile Dimensions:** Frame size = `390 × 844` (iPhone 13/14 baseline).
3. **Typography Tokens:**
   - App headers: `heading.20.semibold` (e.g. "Delivery in 10 mins").
   - Product Titles: `body.16.medium` or `caption.14.medium`.
   - Prices / Quantities: `body.16.regular` (neutral.700) or bold `neutral.950`.
4. **Primary Brand Accents:**
   - Counter buttons (`[ - 1 + ]`): background=`theme.customer.primary.50`, border=1px `theme.customer.primary.600`, text=`theme.customer.primary.600` (success green).
   - Floating Cart Tray: background=`theme.customer.primary.600` (success green), text=`white`, using `shadow.button.customer`.

