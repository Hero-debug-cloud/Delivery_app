# Wireframe Spec: Store Map & Geofenced Clock-In

## Screen

Delivery Partner App — Store Map & Clock-In

## Purpose

Allows drivers to see all active store hubs on a map, view distance details, get turn-by-turn directions, and clock in to activate their shift. Drivers can only receive order offers after clocking in within a geofenced area.

## MVP Source

From `mvp-v1.md` Section 4.3 and 4.7:
- Assign partner to a store.
- Track driver availability status (`offline`, `online`, `busy`).
From `product.md` Section 7.2 (Shift & Attendance):
- Geofenced clock-in restricted to 200m from the assigned store hub GPS coordinates.

## Supported Roles

- Delivery Partner

## Primary User Goal

Find an active store hub, check proximity, navigate there, and successfully clock in to begin receiving order dispatch offers.

---

## Screen Layout

Split view: map showing stores on top; select-and-action drawer at the bottom.

```text
┌──────────────────────────────┐
│  ← Back                      │  <- Back to offline dashboard
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │     [Store Map]        │  │
│  │     🔵 (Driver Pin)    │  │
│  │                        │  │
│  │     📍Downtown  📍East  │  │
│  │                        │  │
│  │                        │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │  <- Bottom Sheet Drawer
│  │  📍 Downtown Hub        │  │
│  │  Distance: 120m (In Range)│  │  <- Green status indicator
│  │  12 Main St, New York  │  │
│  │                        │  │
│  │    [Get Directions]    │  │  <- Opens system maps
│  │                        │  │
│  │    [Clock In Now]      │  │  <- Green active button
│  │                        │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

---

## Geofence Validation Flow

```text
1. Driver selects a store pin on the map
     -> Drawer shows store details and distance:
          distance = geoDistance(Driver_GPS, Store_GPS)

2. If distance <= 200 meters:
     -> Proximity Chip shows: "🟢 In Range"
     -> [Clock In Now] button is enabled (primary success color)
     -> Driver taps [Clock In Now]
          -> call POST /delivery-partners/:id/status { status: "online", active_store_id }
          -> on success: show success popup and redirect to Online Home Dashboard

3. If distance > 200 meters:
     -> Proximity Chip shows: "⚠️ Out of Range (1.2 km away)"
     -> [Clock In Now] button is disabled
     -> Helper text: "Must be within 200m of perimeter to start shift."
     -> [Get Directions] button is highlighted to guide the driver
```

---

## Fields / Components

### Store Map Layer
- Real-time driver position dot (blue with pulsing halo).
- Store pins (`status.pending` grey pin for inactive/unselected stores; `primary.600` blue square pin for selected store).
- Map bounds automatically fit driver and nearest 3 stores.

### Bottom Sheet Drawer
- **Store Title:** `heading.20.semibold`, `neutral.950`.
- **Proximity Chip:**
  - *In Range:* fill=`success.50`, text=`success.600`, message="🟢 In Range ({distance}m)".
  - *Out of Range:* fill=`warning.50`, text=`warning.500`, message="⚠️ Out of Range ({distance}m)".
- **Get Directions Button:** `size=342×44`, variant=`outline`, text=`primary.600` `body.16.medium`, opens system turn-by-turn map app.
- **Clock In Button:** `size=342×52`, text=`body.16.medium`.
  - *Active:* fill=`success.600` (presents green brand color), text=`white`.
  - *Disabled:* fill=`neutral.200`, text=`neutral.400`, cursor=not-allowed.
  - *Loading:* spinner icon, text="Clocking in...".

---

## Error States

### Geofence Override Error
If driver attempts a bypass via direct request:
```text
Alert dialog: "Clock-In Failed"
"You are too far from the store perimeter. Please walk closer to the hub before clocking in."
[OK] [Get Directions]
```

---

## API Requirements

### Reads
- `GET /stores?is_active=true` -> returns list of active hubs with name, address, latitude, and longitude.

### Writes
- `POST /delivery-partners/:id/status`
  - Payload: `{ status: "online", store_id }`

---

## Acceptance Criteria

- Driver can view all active store hubs as markers on the map.
- Selecting a store pin slides up the details sheet.
- Proximity chip updates dynamically based on live distance between GPS and selected hub.
- Clock In button is disabled and warns driver if distance exceeds 200 meters.
- Clocking in successfully calls the status API, marks the driver `online`, assigns their active store, and redirects to the Home dashboard.
- Back button returns to the offline dashboard cleanly.
