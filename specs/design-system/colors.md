# Global Color System

## Purpose

This file is the single source of truth for LogiRoute product colors. All web, mobile, wireframe, Figma, and implementation specs should reference these tokens instead of redefining colors locally.

## Brand Direction

LogiRoute should feel:

- Enterprise-grade
- Operational
- Trustworthy
- Modern SaaS
- Clear under pressure for dispatch/live ops teams

## Primary Palette (Multi-Theme System)

LogiRoute uses separated primary color themes for the backend logistics operations and the consumer storefront.

### Admin & Driver App Theme (Blue Operational)

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `theme.admin.primary.50` | `#EFF6FF` | Soft blue backgrounds, info banners |
| `theme.admin.primary.100` | `#DBEAFE` | Subtle selected backgrounds |
| `theme.admin.primary.200` | `#BFDBFE` | Light borders |
| `theme.admin.primary.500` | `#3B82F6` | Secondary blue accents |
| `theme.admin.primary.600` | `#2563EB` | Primary buttons, active links, focus rings |
| `theme.admin.primary.700` | `#1D4ED8` | Hover states, strong brand accents |
| `theme.admin.primary.900` | `#1E3A8A` | Deep blue backgrounds |

### Customer App Theme (Grocery Green)

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `theme.customer.primary.50` | `#F0FDF4` | Soft green backgrounds, quantity buttons |
| `theme.customer.primary.100` | `#DCFCE7` | Selected items background |
| `theme.customer.primary.200` | `#BBF7D0` | Light green borders |
| `theme.customer.primary.500` | `#4ADE80` | Secondary green accents |
| `theme.customer.primary.600` | `#16A34A` | Primary green buttons, floating cart tray, speed badge |
| `theme.customer.primary.700` | `#15803D` | Hover/pressed buttons |
| `theme.customer.primary.900` | `#14532D` | Dark green headers |


## Neutral Palette

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `neutral.50` | `#F8FAFC` | App/page background |
| `neutral.100` | `#F1F5F9` | Secondary backgrounds |
| `neutral.200` | `#E2E8F0` | Dividers |
| `neutral.300` | `#CBD5E1` | Input borders |
| `neutral.400` | `#94A3B8` | Placeholders |
| `neutral.500` | `#64748B` | Helper text |
| `neutral.600` | `#475569` | Muted body text |
| `neutral.700` | `#334155` | Secondary text |
| `neutral.800` | `#1E293B` | Strong secondary text |
| `neutral.900` | `#0F172A` | Dark panels |
| `neutral.950` | `#020617` | Primary text |
| `white` | `#FFFFFF` | Cards, forms, inverse text |

## Semantic Palette

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `success.50` | `#F0FDF4` | Success background |
| `success.600` | `#16A34A` | Success text/icons |
| `warning.50` | `#FFFBEB` | Warning background |
| `warning.500` | `#F59E0B` | Warning text/icons |
| `error.50` | `#FEF2F2` | Error background |
| `error.300` | `#FCA5A5` | Error border |
| `error.600` | `#DC2626` | Error text/icons |
| `info.50` | `#EFF6FF` | Info background |
| `info.600` | `#2563EB` | Info text/icons |

## Logistics Status Colors

Use these globally for orders, drivers, and operations dashboards.

| Status | Token | Hex |
| :--- | :--- | :--- |
| Created / Pending | `status.pending` | `#64748B` |
| Assigned | `status.assigned` | `#2563EB` |
| Accepted | `status.accepted` | `#7C3AED` |
| Picked Up | `status.picked_up` | `#0891B2` |
| In Transit | `status.in_transit` | `#F59E0B` |
| Delivered | `status.delivered` | `#16A34A` |
| Failed / Rejected | `status.failed` | `#DC2626` |
| Offline | `status.offline` | `#94A3B8` |
| Online | `status.online` | `#16A34A` |
| Busy | `status.busy` | `#F59E0B` |

## Gradients

### Brand Dark Blue Gradient

```text
Name: gradient.brand.dark
Start: #0F172A
End: #1D4ED8
Angle: 135°
Usage: Auth marketing panels, hero areas
```

### Primary Button Gradient, Optional

```text
Name: gradient.primary.button
Start: #2563EB
End: #1D4ED8
Angle: 90°
Usage: Premium primary CTAs only if flat primary is not enough
```

## Usage Rules

1. **Platform Namespacing:**
   - For Admin panels, Driver apps, and Live Operations, use `theme.admin.primary.*` (Operational Blue).
   - For the Customer Storefront and tracking links, use `theme.customer.primary.*` (Grocery Green).
   - Legacy specs referencing generic `primary.*` resolve to `theme.admin.primary.*` on Admin/Driver screens, and `theme.customer.primary.*` on Customer-facing screens.
2. Use `neutral.950` for primary text.
3. Use `neutral.500` for helper text.
4. Use semantic colors only for actual semantic meaning.
5. Do not create one-off colors inside page specs.
6. If a new color is needed, add it here first.

