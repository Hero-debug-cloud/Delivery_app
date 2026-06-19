# Wireframe Spec: Create / Edit Store

## Route / Screen

```text
/stores/new          (create)
/stores/:id/edit     (edit)
```

## Purpose

Allows Super Admins to create a new store or edit an existing one. The same form is reused for both actions. On edit, fields are pre-populated with existing values.

Location is picked via an embedded map — the user drops a pin and the address, latitude, and longitude are resolved automatically. Raw coordinate inputs are not exposed.

## MVP Source

From `mvp-v1.md` Section 4.2:

- Store fields: name, address, latitude, longitude, contact number, active/inactive status.

## Supported Roles

- Super Admin only

## Primary User Goal

Fill in store details, pick the store location on the map, and save. The store becomes immediately available for assignment.

---

## Page Layout

The form uses a two-column layout. Left column contains form fields; right column contains the embedded map picker.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Sidebar]  │  ← Stores / New Store                                         │
│             │                                                               │
│             │  ┌─────────────────────────┐  ┌───────────────────────────┐  │
│             │  │  Store Details          │  │                           │  │
│             │  │                         │  │   [Embedded Map]          │  │
│             │  │  Store Name *           │  │                           │  │
│             │  │  ┌───────────────────┐  │  │   Search address...       │  │
│             │  │  └───────────────────┘  │  │   ┌───────────────────┐   │  │
│             │  │                         │  │   └───────────────────┘   │  │
│             │  │  Location *             │  │                           │  │
│             │  │  ┌───────────────────┐  │  │      📍 Drop a pin        │  │
│             │  │  │ 📍 12 Main St,    │  │  │      to set location      │  │
│             │  │  │    New York (auto)│  │  │                           │  │
│             │  │  └───────────────────┘  │  │                           │  │
│             │  │  [Pick on map →]        │  │                           │  │
│             │  │                         │  │    [Confirm Location]     │  │
│             │  │  Contact Number *       │  └───────────────────────────┘  │
│             │  │  ┌───────────────────┐  │                                 │
│             │  │  └───────────────────┘  │                                 │
│             │  │                         │                                 │
│             │  │  Status                 │                                 │
│             │  │  ● Active  ○ Inactive   │                                 │
│             │  │                         │                                 │
│             │  │  [Cancel]  [Save Store] │                                 │
│             │  └─────────────────────────┘                                 │
└─────────────┴─────────────────────────────────────────────────────────────┘
```

---

## Location Picker Behaviour

The map panel on the right is always visible alongside the form. Here is the full interaction flow:

```text
1. User types in the map search bar
     → autocomplete suggestions appear (Google Places / Mapbox Geocoding)
     → selecting a suggestion drops a pin and pans the map to that location

2. User can also click/tap anywhere on the map
     → pin drops at that position
     → address is reverse-geocoded and filled into the Location field on the left

3. After pin is placed, the "Confirm Location" button becomes active
     → clicking it locks in latitude, longitude, and the resolved address
     → Location field on the form updates to show the confirmed address
     → Latitude and Longitude are stored as hidden values in the form state

4. User can reposition the pin at any time before saving
     → "Confirm Location" must be clicked again to update the stored values
```

On **edit**, the map opens pre-centred on the existing store coordinates with the pin already placed.

---

## Fields

| Field | Type | Required | Notes |
| :--- | :--- | :---: | :--- |
| Store Name | text | Yes | Non-empty, max 100 chars |
| Location | read-only text (map-filled) | Yes | Populated by map picker. Shows resolved address. Not manually editable. |
| Latitude | hidden | Yes | Set automatically when user confirms map pin |
| Longitude | hidden | Yes | Set automatically when user confirms map pin |
| Contact Number | tel | Yes | Valid phone format |
| Status | radio | Yes | Active (default) or Inactive |

The user never types lat/lng directly. They are derived from the map pin and stored invisibly.

---

## Actions

### Pick on Map

```text
User clicks "Pick on map →" link or interacts with the map panel directly
  -> map panel scrolls into focus / highlights
  -> user searches or clicks to drop pin
  -> reverse geocode resolves address
  -> "Confirm Location" button becomes active
  -> user clicks Confirm
  -> Location field on the form shows resolved address
  -> lat/lng stored in form state
```

### Save Store (Create)

```text
User completes all fields including confirmed location
  -> validate name, location confirmed, phone, status
  -> call POST /stores with { name, address, latitude, longitude, phone, is_active }
  -> on success: redirect to /stores/:id
  -> on error: show inline errors
```

### Save Store (Edit)

```text
Form pre-filled including existing address and pin position
  -> user modifies fields and/or repositions pin
  -> call PATCH /stores/:id
  -> on success: redirect to /stores/:id
  -> on error: show inline errors
```

### Cancel

Navigates back to `/stores` without saving.

---

## Error States

### Location Not Confirmed

```text
Please pick a location on the map before saving.
```

Shown inline below the Location field if the user tries to submit without confirming a pin.

### Geocoding Failed

```text
Could not resolve address for this location. Try searching or choosing a nearby point.
```

Shown inside the map panel below the search bar.

### Validation Errors (other fields)

```text
Store name is required.
Contact number is not valid.
```

### Server Error

```text
Unable to save store. Please try again.
```

---

## Loading States

- Map panel shows a neutral tile skeleton until the map library loads.
- "Confirm Location" button shows a brief spinner while reverse geocoding is running.
- Save button shows "Saving..." and is disabled during submission.

---

## Empty State

N/A — this is a form page.

---

## Component Checklist

- Breadcrumb
- Two-column layout (form left, map right)
- Store Name input
- Location read-only field (map-filled)
- "Pick on map" anchor link
- Embedded map component (Google Maps or Mapbox)
- Map search bar with autocomplete
- Draggable map pin
- Reverse geocode display inside map
- "Confirm Location" button (disabled until pin is placed)
- Contact Number input
- Status radio group
- Cancel button
- Save Store / Update Store button
- Inline field validation messages
- Global error alert

---

## API / Data Requirements

Reads (edit only):
- `GET /stores/:id` — pre-populate form and map pin

External:
- Google Places Autocomplete API or Mapbox Search API — address search
- Google Geocoding / Mapbox Reverse Geocoding — pin to address resolution

Writes:
- `POST /stores` — create
- `PATCH /stores/:id` — edit

Required payload fields:
- `name`
- `address` (resolved from map)
- `latitude` (from map pin)
- `longitude` (from map pin)
- `phone`
- `is_active`

---

## Acceptance Criteria

- Store Name and Contact Number cannot be submitted empty.
- User cannot submit the form without confirming a map pin — the save button shows a validation error if location is unset.
- Dropping a pin reverse-geocodes and populates the Location field automatically.
- Searching an address in the map panel drops a pin at the matched location.
- Confirming a location locks in the address, lat, and lng in form state.
- On edit, the map opens centred on the existing store location with the pin pre-placed.
- Repositioning the pin and confirming updates the stored coordinates before save.
- Only Super Admin can access `/stores/new` and `/stores/:id/edit`.
- On successful create, user is redirected to the new store's detail page.
- On successful edit, user is redirected to the updated store's detail page.
- Cancel navigates back to the store list without saving.

---

# Figma Screen Specification

## Figma Frames

```text
Stores / Create / Desktop — 1440×1024
Stores / Edit / Desktop — 1440×1024
```

References:
- `specs/design-system/colors.md`
- `specs/design-system/typography.md`
- `specs/design-system/spacing.md`

---

## Desktop Visual Composition

### Frame: `Stores / Create / Desktop`

```text
Frame size: 1440×1024
Background: neutral.50
```

Inherits top nav bar (h=64) and sidebar (w=240).

---

### Breadcrumb

```text
x=272, y=96
Text: "← Stores / New Store"
type: caption.14.regular
Colors: "← Stores" neutral.500, "/ New Store" neutral.700
gap: 8px
```

---

### Two-Column Layout

```text
Total width: 1136px (from x=272 to x=1408)
Left column (form card): width=520px
Gap: 24px
Right column (map card): width=592px
Top: y=132
```

---

### Left — Form Card

```text
Position: x=272, y=132
Size: 520×740
Fill: white
Radius: radius.lg (24px)
Shadow: shadow.card
Padding: 40px
```

#### Form Content

```text
Section heading: "Store Details"
  type: heading.20.semibold
  color: neutral.950
  y=172

Store Name label: y=228, type: body.16.medium, neutral.700
Store Name input: y=256, size=440×48, radius=radius.sm

Location label: y=328, type: body.16.medium, neutral.700
Location field (read-only):
  y=356, size=440×56
  fill: neutral.100
  border: 1px neutral.200
  radius: radius.sm
  padding: 12×16
  Leading icon: map-pin, 16×16, primary.600
  Text: resolved address or "No location selected yet" — body.16.regular
  Text color when empty: neutral.400
  Text color when set: neutral.950

"Pick on map" link:
  y=424
  text: "Pick on map →"
  type: caption.14.medium
  color: primary.600
  cursor: pointer

Contact Number label: y=464, type: body.16.medium, neutral.700
Contact Number input: y=492, size=440×48

Status label: y=564, type: body.16.medium, neutral.700
Status radios: y=596
  ● Active — body.16.regular, neutral.950
  ○ Inactive — body.16.regular, neutral.950
  gap=32px

Action row: y=672, align=right, gap=16px
  Cancel button: size=120×44, fill=white, border=1px neutral.300, radius=radius.md, text=neutral.700
  Save Store button: size=160×44, fill=primary.600, shadow=shadow.button.primary, radius=radius.md, text=white
```

---

### Right — Map Card

```text
Position: x=816, y=132
Size: 592×740
Fill: white
Radius: radius.lg (24px)
Shadow: shadow.card
Overflow: hidden
```

#### Map Search Bar

```text
Position: absolute, x=16, y=16 (inside map frame)
Size: 560×44
Fill: white
Radius: radius.sm
Shadow: shadow.card
Padding horizontal: 12px
Leading icon: search, 16×16, neutral.400
Placeholder: "Search for an address..." — body.16.regular, neutral.400
z-index: above map tiles
```

#### Map Tile Area

```text
Size: full card (592×740)
Background: neutral.200 (placeholder before map loads)
Map library: Google Maps or Mapbox
Default zoom: 13 (city level)
No satellite; use standard street map style
```

#### Map Pin (dropped state)

```text
Pin icon: 32×40
Fill: primary.600
Drop shadow
Label bubble above pin:
  fill: white
  radius: radius.sm
  shadow: shadow.card
  padding: 6×12
  text: resolved address (truncated to 40 chars) — caption.14.regular, neutral.950
```

#### Confirm Location Button

```text
Position: absolute, bottom=16, centered horizontally inside card
Size: 240×44
Radius: radius.md

Disabled state (no pin yet):
  fill: neutral.200
  text: "Drop a pin to confirm" — body.16.medium, neutral.400

Active state (pin placed, geocoding done):
  fill: primary.600
  shadow: shadow.button.primary
  text: "Confirm Location" — body.16.medium, white

Loading state (geocoding in progress):
  fill: primary.600, opacity=70%
  text: "Resolving address..." — body.16.medium, white
  spinner: 16×16 leading
```

---

### Map Card — Empty / Pre-interaction State

```text
Center overlay (shown before any pin):
  Icon: map-pin-outline, 40×40, neutral.300
  Text: "Drop a pin or search to set the store location"
  type: body.16.regular, neutral.400
  centered in map area
```

---

## Edit Variant

```text
Frame: Stores / Edit / Desktop — 1440×1024

Differences from Create:
  Breadcrumb: "← Stores / Downtown Hub / Edit"
  Section heading: "Edit Store"
  All form fields pre-populated
  Map opens centred on existing lat/lng at zoom=15
  Pin pre-placed at existing coordinates
  Location field shows existing address
  Confirm Location button shows "Update Location" in active state
  Save button text: "Update Store"
```

---

## Figma Variants to Create

```text
Map Card / No pin (empty state)
Map Card / Pin dropped (geocoding)
Map Card / Location confirmed
Form / Validation error — location not confirmed
Form / Validation error — required fields
Form / Loading (saving)
```

---

## Implementation Notes

- Use Google Maps JavaScript API with Places Autocomplete, or Mapbox GL JS with Mapbox Search.
- Reverse geocoding on pin drop: call geocoding API, populate form Location field.
- `latitude` and `longitude` are stored in React state (or form context), not in visible inputs.
- On form submit, include `latitude` and `longitude` alongside other fields.
- The map component should be lazy-loaded to avoid blocking the form render.
- On mobile viewports, collapse to single-column: form fields above, map below.
