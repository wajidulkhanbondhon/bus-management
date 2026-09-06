# Seat Section Audit Report

**Scope:** Bus seat management — seat map UI, booking flow, inventory/locking, fare segmentation, gender/guardian rules.
**Repository:** ATOMS Bus Management SaaS (Next.js frontend + FastAPI/PostgreSQL backend).
**Basis:** Read-only inspection of source as of 2026-09-05, including uncommitted working-tree changes. **No code was modified.**

> Note: the working tree already contains significant uncommitted seat-related changes (offline-sync, dual hold endpoints, booking-passenger seat_number normalization, inventory passenger-matching). This report treats the working tree as the current baseline and includes findings about those in-flight changes.

---

## 1. How the seat section works today (mental model)

There are **two independent booking pipelines** plus several views, sharing one database but not sharing seat-selection logic.

### A. "Counter" booking pipeline (office staff)
- Route: `backend/app/api/v1/endpoints/bookings.py` → `create_counter_booking()`.
- Flow: wizard at `/bookings/new` → `BookingWizard` (5 steps) → counter clerk picks a trip, selects seats on `SeatSelectionStep`, fills passenger cards (`PassengerDetailsStep`), boarding/journey, then payment/fare → `createBookingAction` → `POST /api/v1/backend/bookings`.
- Seats are **NOT held or locked between selection and submit** in the counter path. The seat map is a client-side "static" render merged from the saved seat layout plus live inventory, but clicking a seat only mutates local React state.
- `create_counter_booking()` does the authoritative check: locks the `Trip` row (`with_for_update`), then re-checks that each seat has no active `BookingSeat`/`BookingPassenger` before inserting the booking. So a double-sell is mostly prevented at the DB level, but only at the final POST — not during the multi-minute wizard session.

### B. "Pre-booking" / online pipeline (public students)
- Route: `create_pre_booking()` in the same service, exposed via `POST /bookings/pre-booking`.
- Flow: public `/book` or `/passenger/book` pages → `StudentSeatBookingView` → `InteractiveSeatMap` → `createPreBookingAction` → pre-booking created in `PRE_BOOKED` status with a 15-minute `payment_expires_at`.
- Seats get an anti-hoarding hold via Redis `SET NX EX` (15 min) keyed per trip+seat. Status of `PRE_BOOKED`/`PAYMENT_TIMER_ACTIVE` shows as `HELD` on the seat map.
- After staff verification, `verify_and_start_timer()` flips to `PAYMENT_TIMER_ACTIVE`; `confirm_pre_booking_payment()` (idempotency-keyed) confirms and releases the Redis hold.

### C. Seat inventory / seat-map endpoint
- `GET /api/backend/inventory/{trip}/seat-map` → `get_trip_seat_inventory()`.
- Returns the full seat list with `status` derived from active bookings (`CONFIRMED`/`COMPLETED` → `BOOKED`; `PRE_BOOKED`/`PAYMENT_TIMER_ACTIVE` → `HELD`), active `SeatLock` rows → `LOCKED`, and DB/Redis holds → `HELD`.
- Seat records are provisioned lazily: if the bus's `SeatLayout` has fewer `Seat` rows than `bus.capacity`, it generates synthetic `DynamicSeat` objects (not persisted) with `id = seat-{trip_id}-{seat_num}`.

### D. Seat layout builder (fleet/admin)
- `SeatBuilderCanvas` edits a grid (AISLE/EMPTY/SEAT cells) + extra seats, with fare segments per row range and per-cell `baseFare`/`genderRule`.
- Layouts persisted as `SeatLayout.layout_json` (contains `layoutGrid`, `extraSeats`, `activeSegments`, `university`, `unit`, `examName`). The booking wizard parses the same JSON to produce the booking-time seat grid.
- The counter wizard **duplicates** this layout logic locally (generating seats client-side) and merges live status from the inventory API; if the API is unreachable it silently falls back to **all-seats-available** static generation (see Risks).

### E. Business rules (gender/adjacent-seat)
- `src/services/rules.service.ts` implements: static per-seat `genderAllowed`, bus-type rules, dynamic adjacent-seat gender "protection" (if a female books A1 and A2 is free, A2 renders as female-only), multi-seat pair rules (opposite gender adjacent only allowed for Student+Guardian with approved relationship).
- **Important:** these rules are only enforced client-side in the counter wizard (`toggleSeatSelection`, `validateMultiSeatBookingPairRules`, `isPassengersStepValid`). The backend booking service **does not validate** seat gender rule, dynamic adjacent locks, or guardian relationship — it only checks "is seat already booked."

---

## 2. Findings by dimension (each with priority)

### BUGS / ERROR-HANDLING

**[High] B1 — Client-generated seats are never synced to authoritative seat rows.**
The wizard generates `seatId = seat-{trip_id}-{seat_num}` client-side and the inventory endpoint can *synthesize* `Seat` rows on demand, but the inventory `Seat` table and the booking `BookingSeat.seat_id` FK relationship depend on those synthetic IDs actually existing. `create_counter_booking` and `acquire_seat_hold` do "ensure seat exists" fallbacks that insert `Seat` rows with **row_index=0, col_index=0** and fare from `trip.base_price` when missing (booking_service.py ~line 302-323; inventory acquire_seat_hold step 5). Consequence: a seat booked first through the counter path gets a `Seat` row whose `base_fare`/position can disagree with the layout the map displayed. Layout edits after bookings also orphan seat numbering: seats are immutable by `seat_number`, so renumbering a row (e.g., changing labels) leaves the old seat numbers booked and the new numbers free — no remap/audit of existing bookings.

**[High] B2 — Backend never validates the gender/guardian/adjacent-seat rules it displays.**
Everything from `validatePassengerRules` / `validateMultiSeatBookingPairRules` runs in the browser (wizard final validation). Any direct API caller (staff script, curl, or a bypassed client) can book a male on a FEMALE_ONLY seat, or book opposite-gender strangers side-by-side, because `create_counter_booking` / `create_pre_booking` only check availability. The seat map shows pink/blue "protected" seats and the UI refuses them — but the API does not.

**[High] B3 — Fare is client-trusted end-to-end.**
The frontend computes each seat's fare (layout JSON / segment ranges / half-trip math), sends `seats: [{seatId, fare}]`, and the backend sums `s["fare"]` into `gross_amount`. For `create_pre_booking`, `gross_amount = trip.base_price * len(seat_ids)` — flat, ignores row segments entirely — so a "Front VIP" pre-booking is charged base price, while counter bookings charge per-seat client-supplied numbers. Offline sync stores `seats: [{seat_id, fare}]` from the client too. There is no server-side price table lookup.

**[High] B4 — `getAdjacentSeatNumber`/pair logic mishandles the 5-seat last row.**
`getAdjacentSeatNumber` (rules.service.ts:20) uses `return `${row}4` || `${row}5`;` etc. — the `||` makes the second branch dead code. For K3 it returns only K4; K4 returns only K3, K5 only K4. But the *layout* has K5 adjacent to K4 (and K3 to K2/K4). So a K5 booking can leave K4 "protected" while K3 is not re-evaluated, and passengers could book K3 + K5 with opposite genders (2 apart) and never trigger the pair rule, or K2+K4 (which are separated by K3 in a 5-seat bench) get flagged as a pair erroneously. Also `getAdjacentSeatPair` for num 3/4 returns only {3,4}, never the K3↔K5 relation.

**[High] B5 — Extra-seat ("overload") seats can be booked past physical capacity and bypass the seat table.**
The wizard's "+ Extra Seat" adds synthetic `EX-N` seats with no DB row and no relationship to `Bus.capacity`. `create_counter_booking` will happily create a `BookingSeat` FK to a non-existent `seats.id` after its "ensure exists" fallback inserts the row with `seat_number=EX-N` in *whatever* layout it found (possibly the wrong bus's layout). No cap, no audit, no manifest reflection of where that passenger physically sits.

**[Medium] B6 — Seat map "availability" fallback fabricates all-available state on API failure.**
`getTripSeatInventory()` (inventory.service.ts) falls back to generating 45 seats all `AVAILABLE` if backend call fails; `BookingWizard` similarly falls back to layout-generated seats all-available in its `.catch`. During any backend/network blip a clerk can select seats that are actually booked, and only learn at final submit ("already booked"). No "stale data / refresh required" guard.

**[Medium] B7 — Two sources of truth for "held": DB holds and Redis holds are not reconciled atomically.**
Inventory checks both, but `acquire_seat_hold` (new endpoint) writes DB `SeatHold` only after Redis SET NX; `release_seat_hold` deletes Redis then DB. A crash between them leaves Redis-held-but-DB-free (map shows HELD forever until TTL) or DB-held-but-Redis-free. The old staff `hold_seat` writes only DB. Both can coexist with the same seat → `is_held` treats it as one, but `hold_token` handling becomes ambiguous and `release_seat_hold` only honors `staff_id` (client) so staff holds can be removed by a different staff person.

**[Medium] B8 — Duplicate-phone/exam-day logic in endpoint is heavy and permissive.**
`check_exam_duplicate_phone` does a naive "same departure-date trips" scan including the current trip, compares `contact_phone` and each `BookingPassenger.passenger_phone` with `== or endswith(clean)` (so "01712" matches "8801712"? Actually endswith on padded values can create false matches). The passenger front-end also has its own duplicate detection. The two implementations disagree on edge cases, and the endpoint isn't used consistently by the pre-booking flow.

**[Low] B9 — `clean_expired_inventory` runs `db.commit()` on a *read* GET endpoint (`seat-map`)**
`get_trip_seat_inventory` first calls `clean_expired_inventory` which executes deletes/updates and commits — making the "read" endpoint a writer. On SQLite/Postgres this can cause write contention and means a GET can block/lock under load.

---

### SECURITY

**[High] S1 — Blocking Redis calls inside async event loop.**
`redis_client` is the **synchronous** `redis.Redis`. It's called from `async` handlers/services (`create_pre_booking`, `verify_and_start_timer`, `acquire_seat_hold`, inventory GET per seat). Each `SET NX`/`GET`/`TTL`/`DELETE` blocks the event loop for the network round-trip; the inventory GET calls it **per seat** (40-45 times). Under concurrent public traffic this stalls all requests.

**[High] S2 — Backend seat booking is not authenticated for the public path, and has minimal abuse protection.**
Pre-booking endpoint (`create_pre_booking`) uses `contact_phone` as the anti-hoarding key (`user_id=req.contact_phone`). Anyone can enumerate seats and hold up to (whatever rate limit exists) seats with arbitrary phone numbers for 15 minutes; `hold_seat_redis` keys are by trip+seat so one user can squat all seats with many phone numbers. There is a Redis TTL but no per-phone cap and no proof of phone ownership at hold time (only at verify time by staff).

**[Medium] S3 — `/bookings/offline-sync` (new) accepts arbitrary seat/fare payloads and is only `get_optional_user`.**
An attacker who knows the API can mint `CONFIRMED` paid bookings for arbitrary seats/fares with arbitrary staff attribution (falls back to first user if no auth). Combined with B3, fare is whatever the client says. Needs staff role + per-request seat/fare validation + conflict retry, at minimum.

**[Medium] S4 — Race window: booking check-then-insert is not protected against two *different* seat identifiers for the same physical seat.**
Seats can be addressed by full id (`seat-{trip}-A1`), raw `A1`, or `BookingPassenger.seat_number`. `create_counter_booking` queries `BookingSeat.seat_id IN (...)` with the *normalized* ids, then checks `BookingPassenger.seat_number IN (...)`. But the two checks happen sequentially; if both pass (e.g., one booking is inserting its `BookingPassenger` between your two queries) you can still double-sell. There is no unique constraint on `(booking.trip_id, seat_number)` or on `booking_seats.seat_id` across active bookings (only `uq_booking_seat` per booking). Two concurrent transactions can both pass checks and both commit.

**[Low] S5 — No audit/versioning on layout changes relative to existing trips.** (see B1; also a data-integrity concern.)

---

### ARCHITECTURE / CLEAN CODE

**[High] A1 — Seat-domain logic is duplicated across five places that must stay in sync.**
- `BookingWizard` generates seats (layout JSON → cells, fallback 40/45 patterns, hard-coded fares 650/550/500/450).
- `InteractiveSeatMap` has its own row-render + K-row assumptions + hard-coded `defaultSegments`.
- `SeatSelectionStep` re-derives row layout from seats + capacity (with a second `parseSeatPosition` that disagrees on last-row 5-seat).
- `get_trip_seat_inventory` synthesizes seats from bus capacity with yet another fare table (`650 if r<2 else trip.base_price`).
- `SeatBuilderCanvas` stores the real layout JSON.
Each has slightly different rules for which rows are 5-across (only row K? only capacity 45/42? 11 rows?) and what fares to assign. The frontend **already has the saved layout JSON** but the wizard mostly regenerates from heuristics rather than trusting the single source.

**[High] A2 — SQLite legacy code paths are still live.**
`db/session.py` still branches to `sqlite` (check_same_thread). The repo root has `dev.db` and a `bus_management_backup.sql`. `with_for_update()` on SQLite is a no-op — the concurrency guarantees described in code comments only hold on Postgres. Given the many SQLite-era code paths, a dev machine pointed at SQLite would silently lose all locking guarantees. Worth asserting `postgres` in non-dev and testing the SQLite path explicitly if dev uses it.

**[Medium] A3 — Query wrapper (`AsyncQueryWrapper`) doesn't support `join(...).filter(...)` ordering fully and `.count()` builds a subquery each call.**
Also many service methods still use `db.query(X).join(Booking)` with `.first()`, meaning the "row lock" is on arbitrary rows returned, not necessarily all candidate seats; a `LIMIT 1` (from `.first()`) inside a lock query is not a serialization point for the *whole* seat list. Only locking the Trip row actually serializes concurrent counter bookings (and pre-bookings) on the same trip — that's the effective design; anything not locking Trip (e.g., `acquire_seat_hold`, `release_seat_hold`) is not serialized with booking creation at all. (Trip lock ordering is the one robust primitive — see Fix order.)

**[Medium] A4 — Pre-booking holds Redis keys by `seat_id` while releases sometimes use different forms.**
`create_pre_booking` holds with `seat_number=seat_id` (full id `seat-{trip}-A1`); `release_seat_redis` in `create_counter_booking`/cancel is passed `s["seat_id"]`/`bs.seat_id` — same form, OK — but the inventory GET queries Redis by `s_num` (`A1`) only, so a `seat-{trip}-A1` hold is invisible to the map unless a DB hold also exists. That is exactly why the map can show a seat AVAILABLE while pre-booking says HELD.

**[Medium] A5 — `PassengerSeatSelectorModal`, `SeatMapVisual` "fleet preview", and several duplicate "seat" implementations are dead or misleading.**
- `PassengerSeatSelectorModal` is not imported anywhere.
- `BusSeatMapModal` builds a **fake seat map** with bookings determined by arithmetic (`currentSeatNum % 7 === 0`, etc.) — it does not call the inventory API, so the "seat preview" shown to fleet staff is fiction and contradicts the live map.
- `seat-map-visual.tsx`'s `buildSeatRows` chunks a flat list by N without aisle awareness.
- `BusSeatMapModal` "Book Tickets" links to `/bookings/new?tripId={bus.id}` and will try to auto-provision a fake trip on the backend (booking_service trip fallback #2 auto-creates a Trip with `id=bus.id`). This is a real accidental-data risk: clicking that button from a bus (not a trip) can silently create an unscheduled "today 22:30" trip and later book seats on it.

**[Low] A6 — Seat selection "status" string confusion.**
The backend returns `status` values `AVAILABLE/BOOKED/HELD/LOCKED`; frontend also synthesizes `PRE_BOOKED/PAYMENT_TIMER_ACTIVE` into held, and some components check `seat.status === 'HELD' || seat.status === 'LOCKED'` in `isHeld`, which makes LOCKED render amber "hold" in `passenger-seat-selector-modal`. Several places treat `type==='SEAT'||!type` etc. as row-cell logic, making the "empty vs aisle vs seat" contract fragile (e.g., seat-builder emits AISLE cells with `seatNumber=''` that wizard's row renderer treats as a missing seat → blank space; but 5-seat rows expect a middle seat).

---

### UI / UX

**[Medium] U1 — Selection is not held; seats can be taken while you fill the form.**
Counter wizard: seat selection to final submit can take minutes (passenger forms + payment). Nothing reserves the seats. Two clerks at two counters can pick the same seats and only one will succeed at the end (or with current async gaps, potentially both). There's no countdown, no polling refresh of the seat map while on step 2-5, and no "someone else took this seat" notice until submit. The new `acquire-seat-hold` endpoint exists but **no UI calls it** (only the old staff hold-seat is wired in the trip admin page).

**[Medium] U2 — Booked/held passenger gender is only used for display after page load; dynamic locks are recalculated but nothing explains "F/M lock" beyond tooltips; and opposite-gender adjacent blocking can dead-end a solo traveller.**
If a female books A1 alone, A2 becomes female-only — meaning a lone male passenger cannot take A2, only A3/A4 pair etc. That's intentional policy (conservative), but there is no "select for same-gender group" affordance and a group of 3 (2F+1M) may find no legal configuration. The UX offers no fallback or explanatory flow; they just get stuck with an error.

**[Medium] U3 — 45-seat special last-row (K1–K5) rendering vs booking rules mismatch.**
The wizard shows K1,K2 on left and K4,K5 on right with K3 middle; the row-letter cell ("K") disappears on the last row, breaking the fare-segment visual legend and row-seat association on that row. Combined with B4, the seat map and the gender-pair validator disagree about who is "adjacent" to whom on K3/K4/K5.

**[Low] U4 — Seat map does not refresh while sitting on the seat step.**
`tripSeats` is fetched once when the trip is chosen. Even the "live" tracker banner polls elsewhere. If another counter books a seat while a clerk stares at the map, the map stays stale until trip change.

**[Low] U5 — Accessibility gaps.**
Seat buttons in `InteractiveSeatMap`/`SeatSelectionStep` have no `aria-pressed`/`aria-label` (seat-map-visual has aria-label but the two main pickers don't). The seat map is a div-based grid with motion buttons; no keyboard affordance beyond native button, no `aria-live` for "X seats selected". Status colors rely heavily on color (legend helps but no screen-reader text for "female-only seat").

**[Low] U6 — Hard-coded Bengali strings and default boarding/dropping points** (গাবতলী/মেইন গেট) baked into wizard state; and "সর্বোচ্চ ৪টি সিট" limit is only client-side (enforced by `alert`) with no server counterpart.

---

## 3. Data-flow snapshot (who talks to whom)

```
SeatLayout.layout_json (source of truth for geometry/fare zones)
   │  saved via SeatBuilderCanvas → POST /buses/seat-layouts
   ▼
BookingWizard ──fetch /api/v1/seat-layouts──────┐
   │  generate seats client-side (or from layout)│   Trip + Bus.capacity
   ▼                                            ▼
SeatSelectionStep                        get_trip_seat_inventory (server)
   │ seat click = local state                   ▲  bookings/SeatHold/SeatLock/Redis
   ▼                                            │
PassengerDetailsStep  ← rules.service.ts (client-only gender/pair checks)
   ▼
FareAndPaymentStep  (client-computed fare + discount + payment)
   ▼
createBookingAction → POST /bookings ── create_counter_booking (Trip row lock + book)
   OR  public flow: createPreBookingAction → POST /bookings/pre-booking (Redis hold, PRE_BOOKED)
   ▼
verify_and_start_timer (PAYMENT_TIMER_ACTIVE, 15-min) → confirm_pre_booking_payment (CONFIRMED)
```

Online (pre-booking) holds are Redis; counter wizard holds nothing; only final create is atomic.

---

## 4. Concurrency & integrity analysis (deep dive)

1. **What actually serializes a seat sale:** `SELECT ... FOR UPDATE` on the `Trip` row at the top of `create_counter_booking` and `create_pre_booking`. All seat-bookings for a trip funnel through that lock, making double-sell unlikely for the two booking paths.
2. **Holes in that model:**
   - `acquire_seat_hold` / `release_seat_hold` / `hold_seat` / `lock_seat` / `unlock_seat` never take the Trip row lock; they lock individual `Seat` rows or nothing. `lock_seat` locking the `Seat` row and then a booking `create_counter_booking` locking the *Trip* row can interleave such that a seat gets booked after an admin "locked" it (admin's later commit re-reads nothing; the seat row lock is per-row and booking path doesn't lock that row before insert). Both do re-check, so it's a small window — but it exists.
   - The second availability check (by `BookingPassenger.seat_number`) and first (by `BookingSeat.seat_id`) are separate queries with separate locks; there's no composite/partial unique index to enforce "one active booking per (trip, seat_number)" across the two tables.
   - Both booking paths fall back to **auto-provisioning a brand-new Trip** whenever `trip_id` is actually a bus id with no trip. That's a footgun: `BusSeatMapModal` "Book Tickets" and `booking-service` fallback #2 (uses `bus.id` as trip id) can create phantom trips at 22:30 "today" and sell seats on them.
3. **What would I fix (priority order):**
   1. Kill the fake `BusSeatMapModal` data and the bus-id-as-trip auto-provisioning, or gate them behind explicit confirmation; make any booking require a real scheduled trip.
   2. Server-side seat validation in both booking services: resolve each `seat_id` to a real `Seat` on the trip's layout, then validate `genderAllowed`/dynamic adjacent + guardian rules (mirror `rules.service` server-side), and use the server-side base fare from `Seat.base_fare`/fare segment — never client fare.
   3. Add a partial unique constraint (Postgres) / app-level guard: one active booking per `(trip_id, seat_number)`; add `seat_number` to `BookingSeat` or unify via a single canonical seat id resolution helper used by both booking and hold paths.
   4. Make online pre-booking holds call the same canonical `acquire_seat_hold` path, key Redis by canonical seat id consistently, and have the seat-map endpoint read holds by that same key (fix A4).
   5. Unify seat geometry into one source: derive the booking-time seat list **from `SeatLayout.layout_json` on the server**, including extra seats and base fares, so the client stops generating 40/45/row heuristics.
   6. Move `clean_expired_inventory` off the GET path into the existing cron endpoint; keep seat-map reads pure.
   7. Add real row-lock coverage for `lock_seat`/`acquire_seat_hold` by taking the Trip `FOR UPDATE` first (consistent lock order to avoid deadlocks), and assert Postgres (not SQLite) in staging/prod.
   8. UI: implement seat holds on seat selection (call acquire-seat-hold with a client id, refresh status, auto-expire notice) or add a "hold seats for 10 min" button on the wizard; poll/reload seat map when tab becomes visible or every ~30s while on the seat step.
   9. Accessibility + legend pass on seat buttons (aria-labels, aria-pressed, live region for count).
   10. Remove/repurpose dead seat components (`PassengerSeatSelectorModal`) and duplicate map logic; consolidate on one `SeatMap` primitive shared by wizard + public pre-booking.

---

## 5. Cheat-sheet of key files

| File | Role |
|---|---|
| `backend/app/services/booking_service.py` | counter booking (Trip lock), pre-booking (Redis), verify timer, confirm payment, offline sync (uncommitted) |
| `backend/app/services/inventory_service.py` | seat-map inventory, hold/acquire/release/lock/unlock (uncommitted dual-hold) |
| `backend/app/api/v1/endpoints/inventory.py` | seat-map + acquire/release/hold endpoints (new endpoints uncommitted) |
| `backend/app/api/v1/endpoints/bookings.py` | counter/pre-booking/offline-sync routes |
| `backend/app/models/{bus,trip,booking}.py` | Seat/SeatLayout/Bus, Trip/SeatHold/SeatLock, Booking/BookingSeat/BookingPassenger |
| `backend/app/core/redis_client.py` | sync Redis SET NX holds + in-memory fallback |
| `src/services/rules.service.ts` | gender/guardian/adjacent pair rules (client-only) |
| `src/services/inventory.service.ts` | fetch seat map, fallback all-available, hold/unlock client wrappers |
| `src/components/booking/booking-wizard.tsx` | counter wizard state; client-generated seats; the actual "seat section" logic |
| `src/components/booking/seat-selection-step.tsx` | seat map render for counter flow |
| `src/components/trip/interactive-seat-map.tsx` | public pre-booking seat map + form |
| `src/components/booking/passenger-seat-selector-modal.tsx` | dead code (unused) |
| `src/components/bus/seat-map-visual.tsx` | generic visual primitive (used by fake preview) |
| `src/components/bus/bus-seat-map-modal.tsx` | **fake** seat preview (mod-based booking count) |
| `src/components/bus/seat-builder-canvas.tsx` | layout builder; source of layout JSON |
| `src/components/booking/student-seat-booking-view.tsx` | public wrapper |

---

## 6. Suggested next step

The single most impactful fix is **server-side seat validation + canonical seat/fare resolution** (B2/B3 + item 2 above). Second is removing the **fake seat-map preview** and **auto-provisioned phantom trips** (A5/3.2) to stop misleading fleet staff and accidental trip creation. A close third is unifying the seat geometry on the server from `layout_json` (A1/3.5) so the wizard and the inventory API cannot disagree.
