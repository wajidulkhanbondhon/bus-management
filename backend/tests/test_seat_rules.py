"""
Server-side seat rule engine tests (pure functions, no DB required).
Run: cd backend && .venv\\Scripts\\python.exe -m pytest tests/test_seat_rules.py -q
"""
from app.services.seat_layout_service import (
    adjacent_partners,
    detect_five_seat_rows,
    validate_passenger_on_seat,
    ALLOWED_GUARDIAN_RELATIONSHIPS,
)


def test_detect_five_seat_rows():
    assert detect_five_seat_rows(["A1", "K1", "K5"]) == {"K"}
    assert detect_five_seat_rows(["A1", "A2", "B1"]) == set()


def test_adjacent_partners_standard_rows():
    # Standard 2+2 rows pair 1<->2 and 3<->4 regardless of row letter.
    assert adjacent_partners("A1") == ["A2"]
    assert adjacent_partners("A2") == ["A1"]
    assert adjacent_partners("A3") == ["A4"]
    assert adjacent_partners("A4") == ["A3"]
    assert adjacent_partners("C1") == ["C2"]


def test_adjacent_partners_five_seat_row():
    five = {"K"}
    # K1 K2 [K3] K4 K5
    assert adjacent_partners("K1", five) == ["K2"]
    assert adjacent_partners("K2", five) == ["K1"]
    assert sorted(adjacent_partners("K3", five)) == ["K2", "K4"]
    assert sorted(adjacent_partners("K4", five)) == ["K3", "K5"]
    assert adjacent_partners("K5", five) == ["K4"]
    # Without the five-row flag, K3 behaves like a standard 2+2 seat (pair 3<->4).
    assert adjacent_partners("K3") == ["K4"]


def test_validate_static_gender_rule():
    ok, err = validate_passenger_on_seat(
        seat_number="A1",
        gender_allowed="FEMALE_ONLY",
        bus_type="MIXED",
        passenger_type="STUDENT",
        passenger_gender="MALE",
    )
    assert not ok
    assert "female" in err.lower()

    ok, _ = validate_passenger_on_seat(
        seat_number="A1",
        gender_allowed="FEMALE_ONLY",
        bus_type="MIXED",
        passenger_type="STUDENT",
        passenger_gender="FEMALE",
    )
    assert ok


def test_bus_type_governance():
    ok, err = validate_passenger_on_seat(
        seat_number="A1",
        gender_allowed="ANY",
        bus_type="FEMALE",
        passenger_type="STUDENT",
        passenger_gender="MALE",
    )
    assert not ok
    assert "female" in err.lower()


def test_opposite_gender_co_booking_requires_guardian():
    # Two opposite-gender STUDENTS on an adjacent pair must be rejected.
    ok, err = validate_passenger_on_seat(
        seat_number="A1",
        gender_allowed="ANY",
        bus_type="MIXED",
        passenger_type="STUDENT",
        passenger_gender="MALE",
        co_booked=[{"seat_number": "A2", "gender": "FEMALE", "passenger_type": "STUDENT"}],
    )
    assert not ok
    assert "Student + Guardian" in err

    # Student + Father guardian on adjacent pair is allowed.
    ok, _ = validate_passenger_on_seat(
        seat_number="A1",
        gender_allowed="ANY",
        bus_type="MIXED",
        passenger_type="STUDENT",
        passenger_gender="FEMALE",
        co_booked=[{
            "seat_number": "A2",
            "gender": "MALE",
            "passenger_type": "GUARDIAN",
            "guardian_relationship": "FATHER",
        }],
    )
    assert ok


def test_five_seat_row_geometry_guardian_rule():
    # K4 and K5 are physically adjacent on the rear bench.
    ok, err = validate_passenger_on_seat(
        seat_number="K4",
        gender_allowed="ANY",
        bus_type="MIXED",
        passenger_type="STUDENT",
        passenger_gender="FEMALE",
        co_booked=[{"seat_number": "K5", "gender": "MALE", "passenger_type": "STUDENT"}],
        five_seat_rows={"K"},
    )
    assert not ok
    assert "Student + Guardian" in err

    # K3 and K5 are NOT adjacent -> opposite gender students allowed.
    ok, _ = validate_passenger_on_seat(
        seat_number="K3",
        gender_allowed="ANY",
        bus_type="MIXED",
        passenger_type="STUDENT",
        passenger_gender="FEMALE",
        co_booked=[{"seat_number": "K5", "gender": "MALE", "passenger_type": "STUDENT"}],
        five_seat_rows={"K"},
    )
    assert ok
