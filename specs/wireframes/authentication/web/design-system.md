# Auth Web Figma Design System

## Purpose

Shared visual rules for LogiRoute web authentication screens. Use this file as the base when creating Figma frames for:

- `/auth`
- `/auth/login`
- `/auth/signup`

## Figma Page Name

```text
01 Authentication / Web
```

## Frames

Create these top-level Figma frames:

```text
Auth / Redirect / Desktop
Auth / Login / Desktop
Auth / Login / Mobile
Auth / Signup / Desktop
Auth / Signup / Mobile
```

## Frame Sizes

| Target | Frame Size |
| :--- | :--- |
| Desktop | 1440 × 1024 |
| Laptop | 1280 × 832 |
| Tablet | 768 × 1024 |
| Mobile | 390 × 844 |

Primary specs in this folder use:

- Desktop: `1440 × 1024`
- Mobile: `390 × 844`

## Layout Grid

### Desktop Grid

```text
Columns: 12
Margin: 80px
Gutter: 24px
Content width: 1280px
```

### Mobile Grid

```text
Columns: 4
Margin: 24px
Gutter: 16px
Content width: 342px
```

## Global Token References

Use the global design system files as source of truth:

- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

Do not define page-specific colors inside auth screen files.

## Shared Components

### Logo Lockup

```text
Icon: rounded square 40×40, blue gradient
Icon text/symbol: route line or simple “L”
Text: LogiRoute
Text style: Heading / 24, weight 700
```

### Text Input

```text
Height: 48px
Radius: 8px
Border: 1px #CBD5E1
Padding left/right: 14px
Label gap: 8px
Placeholder: #94A3B8
Focus border: #2563EB
Error border: #DC2626
```

### Primary Button

```text
Height: 48px
Radius: 12px
Fill: #2563EB
Hover: #1D4ED8
Text: White, Body Medium / 16
Disabled fill: #CBD5E1
```

### Auth Form Card

```text
Desktop width: 480px
Desktop padding: 48px
Mobile width: full content width
Mobile padding: 0 or 24px depending frame
Fill: White
Radius desktop: 24px
Shadow desktop: Card Shadow
```

### Marketing Panel

```text
Desktop width: 560px
Height: 720px
Radius: 32px
Fill: gradient #0F172A -> #1D4ED8
Padding: 56px
Text: White
Decorative route map lines: white 12% opacity
```

## Visual Direction

The auth screens should feel:

- Enterprise-grade
- Clean
- Operational
- Trustworthy
- Modern SaaS

Avoid playful colors or consumer-heavy styling. This is a logistics operations control panel.
