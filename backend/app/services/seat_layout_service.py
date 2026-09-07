"""
Canonical seat resolution & server-side seat rule validation.

Every booking path (counter, pre-booking, offline sync, seat holds/locks) must
resolve requested seats against the trip's real layout before writing anything.
This module is the single source of truth for:
  - which seats physically exist for a trip/bus layout,
  - the canonical seat id + number + base fare for a given label,
  - whether a passenger may occupy a seat given gender / bus-type / guardian
    and dynamic-adjacent protection rules.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
import inspect
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import or_, delete
from sqlalchemy.orm import Session

from app.models.bus import Bus, SeatLayout, Seat
from app.models.trip import Trip
from app.models.booking import Booking, BookingSeat, BookingPassenger

async def _maybe_await(val: Any) -> Any:
    if inspect.isawaitable(val):
        return await val
    return val

ACTIVE_BOOKING_STATUSES = [
    "CONFIRMED", "COMPLETED", "PRE_BOOKED",
    "PAYMENT_TIMER_ACTIVE", "HELD", "VERIFICATION_PENDING",
]

# Row letters supported by seat-number parsing. Kept in sync with the frontend
# (src/services/rules.service.ts) — single expansion point for coach geometry.
ROW_LETTERS = "ABCDEFGHIJKLMN"


def utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ---------------------------------------------------------------------------
# Layout JSON helpers
# ---------------------------------------------------------------------------
def parse_layout_json(layout: Any) -> Dict[str, Any]:
    """Best-effort parse of SeatLayout.layout_json into a dict."""
    if layout is None:
        return {}
    raw = getattr(layout, "layout_json", None) or getattr(layout, "layoutJson", None) or {}
    if isinstance(raw, dict):
        return raw
    if isinstance(raw, str):
        try:
            return json_loads(raw)
        except Exception:
            return {}
    return {}


def json_loads(raw: str) -> Dict[str, Any]:
    import json
    return json.loads(raw)


def seat_label_of(seat_id_or_number: str) -> str:
    """Normalize any seat identifier to its label (e.g. 'A1', 'EX-2').

    Handles ids like 'seat-{trip}-A1', 'dynamic-{trip}-A1', raw 'A1'.
    Extra seats use 'EX-<n>' labels.
    """
    if not seat_id_or_number:
        return ""
    s = str(seat_id_or_number).strip().upper()
    if not s:
        return ""
    # 'seat-<uuid>-A1' / 'dynamic-<uuid>-A1' / 'seat-trip-A1'
    parts = s.split("-")
    if len(parts) >= 3 and parts[0] in ("SEAT", "DYNAMIC", "CELL"):
        return parts[-1]
    return s


async def booking_seat_labels(db: Any, booking) -> List[str]:
    """Canonical seat labels for a booking's BookingSeat rows."""
    from app.models.booking import BookingSeat as BS
    rows = await _maybe_await(db.query(BS).filter(BS.booking_id == booking.id).all())
    labels = []
    for r in (rows or []):
        label = seat_label_of(r.seat_id)
        if label:
            labels.append(label)
    return labels


# ---------------------------------------------------------------------------
# Seat list resolution (real DB rows OR layout cells, never fabricated)
# ---------------------------------------------------------------------------
async def get_bus_layout_seats(db: Any, trip: Trip) -> Tuple[Optional[Bus], Optional[SeatLayout], List[Seat]]:
    """Return (bus, layout, seats) for a trip, honoring the layout assignment."""
    bus = None
    if trip and trip.bus_id:
        bus = await _maybe_await(db.query(Bus).filter(Bus.id == trip.bus_id).first())
    if not bus:
        # Auto-fallback: locate active bus with an assigned layout
        bus = await _maybe_await(
            db.query(Bus).filter(Bus.status == "ACTIVE", Bus.seat_layout_id.isnot(None)).first()
        )
        if not bus:
            bus = await _maybe_await(db.query(Bus).filter(Bus.status != "DELETED").first())
        if bus and trip and getattr(trip, "id", None):
            try:
                trip.bus_id = bus.id
                await _maybe_await(db.flush())
            except Exception:
                pass

    layout = None
    if bus and bus.seat_layout_id:
        layout = await _maybe_await(db.query(SeatLayout).filter(SeatLayout.id == bus.seat_layout_id).first())

    if not layout:
        # Auto-fallback to default active layout in the system
        layout = await _maybe_await(
            db.query(SeatLayout).filter(
                (SeatLayout.description == None) | (~SeatLayout.description.startswith("[DELETED"))
            ).order_by(SeatLayout.created_at.desc() if hasattr(SeatLayout, 'created_at') else SeatLayout.id.desc()).first()
        )
        if not layout:
            layout = await _maybe_await(db.query(SeatLayout).first())

        if layout and bus and not bus.seat_layout_id:
            try:
                bus.seat_layout_id = layout.id
                await _maybe_await(db.flush())
            except Exception:
                pass

    seats = []
    if layout:
        seats = await _maybe_await(
            db.query(Seat).filter(Seat.seat_layout_id == layout.id, Seat.is_active == True).all()
        )
    return bus, layout, (seats or [])


async def layout_cells(db: Any, trip: Trip) -> List[Dict[str, Any]]:
    """Enumerate physical seat cells for a trip's layout.

    Prefers persisted Seat rows (de-duplicated by label); falls back to parsing
    the layout JSON grid so the wizard's geometry (including extra seats) is
    honored even when Seat rows have not been materialized yet.
    """
    bus, layout, seat_rows = await get_bus_layout_seats(db, trip)
    cells: List[Dict[str, Any]] = []
    seen_labels: set[str] = set()

    for s in seat_rows:
        label = (s.seat_number or "").strip().upper()
        if not label or label in seen_labels:
            continue
        seen_labels.add(label)
        cells.append({
            "seat_id": s.id,
            "seat_number": label,
            "row_index": s.row_index or 0,
            "col_index": s.col_index or 0,
            "seat_type": (s.seat_type or "STANDARD").upper(),
            "gender_allowed": (s.gender_allowed or "ANY").upper(),
            "fare": float(s.base_fare or 0.0),
            "is_extra": label.startswith("EX"),
        })

    # If rows were found, they are authoritative (covers all layout seats).
    if seat_rows:
        return cells

    parsed = parse_layout_json(layout) if layout else {}
    grid = parsed.get("layoutGrid")
    extra_seats = parsed.get("extraSeats") or []
    seg_map = _segment_map(parsed.get("activeSegments"))
    row_letters = ROW_LETTERS

    if isinstance(grid, list):
        for r_idx, row in enumerate(grid):
            if not isinstance(row, list):
                continue
            row_char = row_letters[r_idx] if r_idx < len(row_letters) else f"R{r_idx + 1}"
            for c_idx, cell in enumerate(row):
                if not cell or not isinstance(cell, dict):
                    continue
                if (cell.get("type") or cell.get("seatType") or "SEAT").upper() not in ("SEAT",):
                    continue
                label = (cell.get("label") or cell.get("seatNumber") or "").strip().upper()
                if not label:
                    # fall back to row-char + physical column order (skip middle aisle cells)
                    label = _label_for_grid_position(row_char, c_idx, len(row))
                if not label:
                    continue
                seg_fare = _fare_for_row(row_char, seg_map)
                cells.append({
                    "seat_id": f"seat-{trip.id}-{label}" if label else "",
                    "seat_number": label,
                    "row_index": r_idx,
                    "col_index": c_idx,
                    "seat_type": (cell.get("seatType") or ("VIP" if r_idx < 2 else "STANDARD")).upper(),
                    "gender_allowed": (cell.get("genderAllowed") or cell.get("genderRule") or "ANY").upper(),
                    "fare": float(cell.get("baseFare") or seg_fare or 0.0),
                    "is_extra": False,
                })

    # Extra (overload) seats carry explicit labels (EX-1 etc.)
    for i, ex in enumerate(extra_seats):
        if not isinstance(ex, dict):
            continue
        label = (ex.get("seatNumber") or ex.get("label") or f"EX-{i + 1}").strip().upper()
        cells.append({
            "seat_id": f"seat-{trip.id}-{label}",
            "seat_number": label,
            "row_index": 999,
            "col_index": i,
            "seat_type": "EXTRA",
            "gender_allowed": (ex.get("genderAllowed") or ex.get("genderRule") or "ANY").upper(),
            "fare": float(ex.get("baseFare") or 0.0),
            "is_extra": True,
        })

    if not cells:
        # Standard synthesis if layout has no explicit grid or seat rows
        rows_cnt = (layout.total_rows if layout else None) or 10
        cols_cnt = (layout.total_cols if layout else None) or 4
        for r_idx in range(rows_cnt):
            row_char = row_letters[r_idx] if r_idx < len(row_letters) else f"R{r_idx + 1}"
            for c_idx in range(cols_cnt):
                label = f"{row_char}{c_idx + 1}"
                seg_fare = _fare_for_row(row_char, seg_map)
                cells.append({
                    "seat_id": f"seat-{trip.id if trip else 'default'}-{label}",
                    "seat_number": label,
                    "row_index": r_idx,
                    "col_index": c_idx,
                    "seat_type": "VIP" if r_idx < 2 else "STANDARD",
                    "gender_allowed": "ANY",
                    "fare": float(seg_fare or (trip.base_price if trip else None) or 550.0),
                    "is_extra": False,
                })

    return cells


async def ensure_seat_rows(db: Any, trip: Trip, labels: Optional[List[str]] = None) -> None:
    """Materialize Seat rows for a trip's layout cells (only for the given
    labels when provided). Safe to call inside a booking transaction so the
    canonical seat ids are real rows and BookingSeat FKs never dangle.

    Rows are created once per layout using the layout-scoped id scheme
    (`seat-layout-<layout_id>-<label>`). Missing layout -> auto-recovers to active layout.
    """
    bus, layout, _ = await get_bus_layout_seats(db, trip)
    if not layout:
        # Fallback to locate default active layout
        layout = await _maybe_await(
            db.query(SeatLayout).filter(
                (SeatLayout.description == None) | (~SeatLayout.description.startswith("[DELETED"))
            ).order_by(SeatLayout.created_at.desc() if hasattr(SeatLayout, 'created_at') else SeatLayout.id.desc()).first()
        )
        if not layout:
            layout = await _maybe_await(db.query(SeatLayout).first())
        if layout and bus and not bus.seat_layout_id:
            try:
                bus.seat_layout_id = layout.id
                await _maybe_await(db.flush())
            except Exception:
                pass
    if not layout:
        raise ValueError("Trip's bus has no seat layout assigned")
    await sync_seat_rows_from_layout(db, layout)


async def sync_seat_rows_from_layout(db: Any, layout: Optional[SeatLayout]) -> int:
    """Materialize any missing Seat rows for a layout from its layout_json.

    Idempotent: existing rows are left untouched (a row's geometry/fare only
    changes if a booking is not attached). Returns the number of rows created.
    """
    if not layout:
        return 0
    parsed = parse_layout_json(layout)
    grid = parsed.get("layoutGrid")
    extra_seats = parsed.get("extraSeats") or []
    seg_map = _segment_map(parsed.get("activeSegments"))
    row_letters = ROW_LETTERS

    db_seats = await _maybe_await(
        db.query(Seat).filter(Seat.seat_layout_id == layout.id).all()
    )
    existing = {
        (s.seat_number or "").strip().upper(): s
        for s in (db_seats or [])
    }
    created = 0

    def _touch(label, row_index, col_index, seat_type, fare, gender):
        nonlocal created
        label = (label or "").strip().upper()
        if not label or label in existing:
            return
        db.add(Seat(
            id=f"seat-layout-{layout.id}-{label}",
            seat_layout_id=layout.id,
            seat_number=label,
            row_index=row_index,
            col_index=col_index,
            seat_type=seat_type,
            gender_allowed=gender,
            base_fare=fare,
            is_active=True,
        ))
        existing[label] = True
        created += 1

    if isinstance(grid, list):
        for r_idx, row in enumerate(grid):
            if not isinstance(row, list):
                continue
            row_char = row_letters[r_idx] if r_idx < len(row_letters) else f"R{r_idx + 1}"
            for c_idx, cell in enumerate(row):
                if not cell or not isinstance(cell, dict):
                    continue
                if (cell.get("type") or cell.get("seatType") or "SEAT").upper() not in ("SEAT",):
                    continue
                label = (cell.get("label") or cell.get("seatNumber") or "").strip().upper()
                if not label:
                    label = _label_for_grid_position(row_char, c_idx, len(row))
                if not label:
                    continue
                seg_fare = _fare_for_row(row_char, seg_map)
                _touch(label, r_idx, c_idx,
                       (cell.get("seatType") or ("VIP" if r_idx < 2 else "STANDARD")).upper(),
                       float(cell.get("baseFare") or seg_fare or 0.0),
                       (cell.get("genderAllowed") or cell.get("genderRule") or "ANY").upper())
    for i, ex in enumerate(extra_seats):
        if not isinstance(ex, dict):
            continue
        label = (ex.get("seatNumber") or ex.get("label") or f"EX-{i + 1}").strip().upper()
        _touch(label, 999, i, "EXTRA",
               float(ex.get("baseFare") or 0.0),
               (ex.get("genderAllowed") or ex.get("genderRule") or "ANY").upper())

    if not isinstance(grid, list):
        rows_cnt = layout.total_rows or 10
        cols_cnt = layout.total_cols or 4
        for r_idx in range(rows_cnt):
            row_char = row_letters[r_idx] if r_idx < len(row_letters) else f"R{r_idx + 1}"
            for c_idx in range(cols_cnt):
                label = f"{row_char}{c_idx + 1}"
                seg_fare = _fare_for_row(row_char, seg_map)
                _touch(label, r_idx, c_idx,
                       "VIP" if r_idx < 2 else "STANDARD",
                       float(seg_fare or 550.0),
                       "ANY")

    if created:
        await _maybe_await(db.flush())
    return created


def _segment_map(segments: Any) -> Dict[str, float]:
    out: Dict[str, float] = {}
    if not isinstance(segments, list):
        return out
    letters = ROW_LETTERS
    for seg in segments:
        if not isinstance(seg, dict):
            continue
        start = (seg.get("startRow") or "").upper()
        end = (seg.get("endRow") or "").upper()
        fare = seg.get("fare")
        try:
            fare_f = float(fare)
        except (TypeError, ValueError):
            continue
        si = letters.find(start)
        ei = letters.find(end)
        if si >= 0 and ei >= si:
            for idx in range(si, ei + 1):
                out[letters[idx]] = fare_f
    return out


def _fare_for_row(row_char: str, seg_map: Dict[str, float]) -> float:
    if row_char in seg_map:
        return seg_map[row_char]
    # Heuristic fallback (no DB rows yet)
    r = ROW_LETTERS.find(row_char)
    if r < 0:
        return 0.0
    if r < 4:
        return 650.0
    if r < 7:
        return 550.0
    return 500.0


def _label_for_grid_position(row_char: str, c_idx: int, row_len: int) -> str:
    """Infer a seat label from grid position when the cell has no label.

    Middle aisle column (index 2 in a 5-column 2+2+1 grid) is skipped for rows
    that do not carry a center seat.
    """
    if c_idx == 2:
        # center column: only a seat when the row physically has 5 seats.
        # Conservative: treat as EX-style only if explicitly a seat cell; we
        # return empty here, caller skips empty labels.
        return ""
    seat_num = c_idx + 1 if c_idx < 2 else c_idx  # 0,1 -> 1,2 ; 3,4 -> 3,4
    return f"{row_char}{seat_num}"


def canonicalize_seat_label(label: str) -> str:
    return (label or "").strip().upper()


# ---------------------------------------------------------------------------
# Seat resolution for a request
# ---------------------------------------------------------------------------
class SeatResolveResult:
    def __init__(
        self,
        ok: bool,
        seat_id: Optional[str] = None,
        seat_number: Optional[str] = None,
        fare: float = 0.0,
        gender_allowed: str = "ANY",
        error: Optional[str] = None,
    ):
        self.ok = ok
        self.seat_id = seat_id
        self.seat_number = seat_number
        self.fare = fare
        self.gender_allowed = gender_allowed
        self.error = error


async def resolve_requested_seats(
    db: Any,
    trip: Trip,
    requested: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], List[str]]:
    """Map requested [{seat_id|seat_number}] to canonical seat rows/cells.

    Returns (resolved, errors). A resolved entry has seat_id/seat_number/fare.
    Any seat that cannot be matched to a physical layout cell is an error.
    """
    # Ensure real Seat rows exist so ids are canonical (layout-scoped) and
    # consistent with what a booking will write.
    try:
        await ensure_seat_rows(db, trip)
    except ValueError as e:
        return [], [str(e)]

    cells = await layout_cells(db, trip)
    by_label: Dict[str, Dict[str, Any]] = {}
    by_id: Dict[str, Dict[str, Any]] = {}
    for c in cells:
        if c.get("seat_id"):
            by_id[c["seat_id"].upper()] = c
        if c.get("seat_number"):
            by_label[c["seat_number"].upper()] = c

    resolved: List[Dict[str, Any]] = []
    errors: List[str] = []
    for r in requested:
        raw_id = (r.get("seat_id") or r.get("seatId") or "").strip()
        label_in = canonicalize_seat_label(
            r.get("seat_number") or r.get("seatNumber") or seat_label_of(raw_id)
        )
        cell = None
        if label_in and label_in in by_label:
            cell = by_label[label_in]
        elif raw_id and raw_id.upper() in by_id:
            cell = by_id[raw_id.upper()]
        else:
            # try label derived from id
            lbl = seat_label_of(raw_id)
            if lbl and lbl in by_label:
                cell = by_label[lbl]
        if not cell:
            errors.append(f"Seat {label_in or raw_id} does not exist on this trip's layout")
            continue
        resolved.append({
            "seat_id": cell["seat_id"],
            "seat_number": cell["seat_number"],
            "fare": float(cell.get("fare") or 0.0),
            "gender_allowed": cell.get("gender_allowed") or "ANY",
            "is_extra": bool(cell.get("is_extra")),
        })
    return resolved, errors


# ---------------------------------------------------------------------------
# Server-side passenger/seat rule validation
# ---------------------------------------------------------------------------
ALLOWED_GUARDIAN_RELATIONSHIPS = {
    "FATHER", "MOTHER", "BROTHER", "SISTER",
    "PATERNAL_GRANDFATHER", "MATERNAL_GRANDFATHER",
    "PATERNAL_GRANDMOTHER", "MATERNAL_GRANDMOTHER",
    "DADA", "NANA", "DADI", "NANI",
    "SPOUSE", "HUSBAND", "WIFE",
}

# Adjacency model for a 2+2 (and 5-seat rear) coach:
# Standard 2+2 pairs: (1,2) and (3,4).
ADJACENT_PAIRS = {("1", "2"), ("3", "4")}


def detect_five_seat_rows(seat_labels: List[str]) -> set:
    """Return the row letters that contain a 5th seat (rear bench).

    A row is treated as a 5-seat rear bench iff a seat numbered X5 exists in
    the layout for that row. Mirrors frontend rules.service.detectFiveSeatRows.
    """
    five_rows = set()
    for label in seat_labels or []:
        m = re.match(r"^([A-Z]+)5$", (label or "").strip().upper())
        if m:
            five_rows.add(m.group(1))
    return five_rows


def adjacent_partners(seat_number: str, five_seat_rows: Optional[set] = None) -> List[str]:
    """Return the physical neighbor labels of a seat on a 2+2 coach.

    For rows in `five_seat_rows` (e.g. the rear bench rendered K1 K2 [K3] K4 K5):
      K3 center sits between K2 and K4; K4 neighbors K3 & K5; K5 neighbors K4.
    Otherwise seats pair 1<->2 and 3<->4.
    """
    m = re.match(r"^([A-Z]+)(\d+)$", (seat_number or "").strip().upper())
    if not m:
        return []
    row, num = m.group(1), m.group(2)
    five_rows = five_seat_rows or set()
    if row in five_rows:
        if num == "3":
            return [f"{row}2", f"{row}4"]
        if num == "5":
            return [f"{row}4"]
        if num == "4":
            return [f"{row}3", f"{row}5"]
    for pair in ADJACENT_PAIRS:
        if num in pair:
            return [f"{row}{other}" for other in pair if other != num]
    return []


def validate_passenger_on_seat(
    *,
    seat_number: str,
    gender_allowed: str,
    bus_type: Optional[str],
    passenger_type: str,
    passenger_gender: str,
    guardian_relationship: Optional[str] = None,
    co_booked: Optional[List[Dict[str, str]]] = None,
    five_seat_rows: Optional[set] = None,
) -> Tuple[bool, Optional[str]]:
    """Server-side equivalent of the frontend rules.

    `co_booked` is a list of {seat_number, gender, passenger_type,
    guardian_relationship} for the same transaction (used to allow a guardian
    pair to sit together in opposite-gender adjacent seats).
    """
    p_gender = (passenger_gender or "").upper()
    p_type = (passenger_type or "").upper()
    rel = (guardian_relationship or "").upper() or None
    eff_bus_type = (bus_type or "").upper()

    # 1. Bus-level governance
    if eff_bus_type == "FEMALE":
        if p_type == "STUDENT" and p_gender != "FEMALE":
            return False, "Female-designated buses only accommodate female students."
        if p_type == "GUARDIAN":
            allowed = ["FATHER", "BROTHER", "MOTHER", "SISTER", "SPOUSE", "HUSBAND", "UNCLE", "AUNT"]
            if rel and rel not in allowed:
                return False, f"Guardian relationship '{rel}' is not permitted on female-designated coaches."
    elif eff_bus_type == "MALE":
        if p_type == "STUDENT" and p_gender != "MALE":
            return False, "Male-designated buses only accommodate male students."
        if p_type == "GUARDIAN":
            allowed = ["MOTHER", "SISTER", "FATHER", "BROTHER", "SPOUSE", "WIFE", "AUNT", "UNCLE"]
            if rel and rel not in allowed:
                return False, f"Guardian relationship '{rel}' is not permitted on male-designated coaches."

    # 2. Static seat gender rule
    if (gender_allowed or "").upper() == "FEMALE_ONLY" and p_gender != "FEMALE":
        return False, f"Seat {seat_number} is reserved for female passengers."
    if (gender_allowed or "").upper() == "MALE_ONLY" and p_gender != "MALE":
        return False, f"Seat {seat_number} is reserved for male passengers."

    # 3. Dynamic adjacent-seat protection (booked neighbor of opposite gender)
    neighbors = adjacent_partners(seat_number, five_seat_rows)
    co_map = { (c.get("seat_number") or "").upper(): c for c in (co_booked or []) }

    # Same-booking co-passenger already occupies an adjacent seat:
    for nb in neighbors:
        co = co_map.get(nb)
        if not co:
            continue
        co_gender = (co.get("gender") or "").upper()
        co_type = (co.get("passenger_type") or "").upper()
        if co_gender and co_gender != p_gender:
            # Opposite genders may sit together only as Student+Guardian
            # with an approved relationship.
            is_student_pair = (p_type == "STUDENT" or co_type == "STUDENT")
            rel_effective = rel
            if co_type == "GUARDIAN":
                rel_effective = (co.get("guardian_relationship") or "").upper() or rel_effective
            if not is_student_pair or not rel_effective:
                return False, (
                    f"Seat {seat_number} and {nb} are opposite-gender adjacent; "
                    "only Student + Guardian (parent/sibling/grandparent) may book together."
                )
            if (rel_effective or "").upper() not in ALLOWED_GUARDIAN_RELATIONSHIPS:
                return False, f"Guardian relationship '{rel_effective}' is not approved for adjacent seating."

    # 4. Already-booked neighbor of opposite gender (dynamic lock)
    #    Performed by the caller against the DB via active bookings map.
    return True, None


async def active_booked_seat_map(db: Any, trip_id: str, now: Optional[datetime] = None) -> Dict[str, Dict[str, str]]:
    """Map seat label -> {gender, booking_status} for active bookings on a trip."""
    now = now or utcnow_naive()
    statuses = ACTIVE_BOOKING_STATUSES
    rows = await _maybe_await(
        db.query(BookingPassenger, Booking.booking_status)
        .join(Booking, Booking.id == BookingPassenger.booking_id)
        .filter(
            Booking.trip_id == trip_id,
            Booking.booking_status.in_(statuses),
        )
        .all()
    )
    out: Dict[str, Dict[str, str]] = {}
    for item in (rows or []):
        if isinstance(item, (tuple, list)):
            p = item[0]
            status = item[1] if len(item) > 1 else getattr(getattr(p, "booking", None), "booking_status", "CONFIRMED")
        elif hasattr(item, "__getitem__") and not hasattr(item, "seat_number"):
            try:
                p = item[0]
                status = item[1]
            except Exception:
                p = item
                status = getattr(getattr(p, "booking", None), "booking_status", "CONFIRMED")
        else:
            p = item
            status = getattr(getattr(p, "booking", None), "booking_status", "CONFIRMED")

        label = (getattr(p, "seat_number", None) or "").strip().upper()
        if not label:
            continue
        out[label] = {
            "gender": (getattr(p, "gender", None) or "").upper(),
            "booking_status": str(status) if status is not None else "CONFIRMED",
        }
    return out


async def find_active_conflict(
    db: Any,
    trip: Trip,
    seat_labels: List[str],
    resolve_seat_id: bool = True,
) -> Optional[Dict[str, str]]:
    """Return the first active booking (by seat label or id) that conflicts.

    Used as a final guard *inside* the trip-locked transaction so that the
    check + insert share the same serialization point.
    """
    if not seat_labels:
        return None
    # Match by canonical label (most reliable across old/new records).
    conflict = await _maybe_await(
        db.query(BookingPassenger)
        .join(Booking, Booking.id == BookingPassenger.booking_id)
        .filter(
            Booking.trip_id == trip.id,
            Booking.booking_status.in_(ACTIVE_BOOKING_STATUSES),
            BookingPassenger.seat_number.in_(seat_labels),
        )
        .with_for_update(nowait=False)
        .first()
    )
    if conflict:
        return {
            "seat_number": (conflict.seat_number or "").upper(),
            "reason": f"Seat {conflict.seat_number} is already booked or held.",
        }
    if resolve_seat_id:
        ids = [f"seat-{trip.id}-{label}" for label in seat_labels] + seat_labels
        conflict_by_id = await _maybe_await(
            db.query(BookingSeat)
            .join(Booking, Booking.id == BookingSeat.booking_id)
            .filter(
                Booking.trip_id == trip.id,
                Booking.booking_status.in_(ACTIVE_BOOKING_STATUSES),
                BookingSeat.seat_id.in_(ids),
            )
            .with_for_update(nowait=False)
            .first()
        )
        if conflict_by_id:
            return {
                "seat_number": conflict_by_id.seat_id,
                "reason": f"Seat {conflict_by_id.seat_id} is already booked or held.",
            }
    return None


async def validate_booking_request_seats(
    db: Any,
    trip: Trip,
    passengers: List[Any],
    journey_type: str = "ROUND_TRIP",
    active_map: Optional[Dict[str, Dict[str, str]]] = None,
) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """Validate a full booking request against the trip layout + seat rules.

    Returns (normalized_passenger_seats, error). Each normalized entry carries
    {seat_id, seat_number, fare, gender_allowed, passenger} so the caller can
    write rows with canonical ids/fares.
    """
    # Ensure real Seat rows exist so ids are canonical (layout-scoped) and
    # consistent with what a booking will write.
    try:
        await ensure_seat_rows(db, trip)
    except ValueError as e:
        return [], str(e)

    cells = await layout_cells(db, trip)
    by_label: Dict[str, Dict[str, Any]] = {}
    for c in cells:
        if c.get("seat_number"):
            by_label[c["seat_number"].upper()] = c

    # Determine which rows are 5-seat rear benches from the layout geometry.
    five_rows = detect_five_seat_rows([c.get("seat_number") for c in cells if c.get("seat_number")])

    if active_map is None:
        active_map = await active_booked_seat_map(db, trip.id)
    bus_type = trip.trip_bus_type or "MIXED"
    now = utcnow_naive()

    normalized: List[Dict[str, Any]] = []
    co_info: List[Dict[str, str]] = []
    for p in passengers:
        raw_id = (p.seat_id or "").strip()
        label = canonicalize_seat_label(p.seat_number or seat_label_of(raw_id))
        cell = by_label.get(label) or (by_label.get(canonicalize_seat_label(raw_id)) if raw_id else None)
        if not cell:
            return [], f"Seat {label or raw_id} does not exist on this trip's layout"
        # Canonical seat number always wins over whatever the client sent.
        normalized.append({
            "seat_id": cell["seat_id"],
            "seat_number": cell["seat_number"],
            "fare": float(cell.get("fare") or 0.0),
            "gender_allowed": cell.get("gender_allowed") or "ANY",
            "passenger": p,
        })
        co_info.append({
            "seat_number": cell["seat_number"],
            "gender": (p.gender or "").upper(),
            "passenger_type": (p.passenger_type or "").upper(),
            "guardian_relationship": (getattr(p, "guardian_relationship", None) or "").upper() or None,
        })

    # Same-booking opposite-gender adjacent pairs must be Student+Guardian.
    for n in normalized:
        seat_label = n["seat_number"]
        p = n["passenger"]
        ok, err = validate_passenger_on_seat(
            seat_number=seat_label,
            gender_allowed=n["gender_allowed"],
            bus_type=bus_type,
            passenger_type=p.passenger_type,
            passenger_gender=p.gender,
            guardian_relationship=getattr(p, "guardian_relationship", None),
            co_booked=co_info,
            five_seat_rows=five_rows,
        )
        if not ok:
            return [], err
        # Dynamic lock: adjacent already-booked seat of opposite gender.
        active_adj = _opposite_gender_adjacent_booked(db, trip, seat_label, (p.gender or "").upper(), active_map, five_rows)
        if active_adj:
            return [], (
                f"Seat {seat_label} is adjacent to {active_adj['seat_number']} "
                f"booked by a {active_adj['gender'].title()} passenger; only "
                f"{active_adj['gender'].title()} passengers may book it."
            )

    return normalized, None


def _opposite_gender_adjacent_booked(
    db: Session,
    trip: Trip,
    seat_number: str,
    passenger_gender: str,
    active_map: Dict[str, Dict[str, str]],
    five_seat_rows: Optional[set] = None,
) -> Optional[Dict[str, str]]:
    """Dynamic adjacent-seat protection against existing active bookings."""
    # We only enforce against truly booked (not self-held/pre-booked) neighbors
    # to avoid a passenger being blocked by their own in-progress request.
    for nb in adjacent_partners(seat_number, five_seat_rows):
        info = active_map.get(nb)
        if not info:
            continue
        if info["booking_status"] not in ("CONFIRMED", "COMPLETED"):
            continue
        if info.get("gender") and info["gender"] != passenger_gender:
            return {"seat_number": nb, "gender": info["gender"]}
    return None

