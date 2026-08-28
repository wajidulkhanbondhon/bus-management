from typing import Optional, Dict, Any


def validate_passenger_rules(
    bus_type: str,
    trip_bus_type: Optional[str],
    seat_gender_rule: str,
    passenger_type: str,
    passenger_gender: str,
    guardian_relationship: Optional[str] = None
) -> Dict[str, Any]:
    effective_bus_type = (trip_bus_type or bus_type or "MIXED").upper()
    p_gender = (passenger_gender or "FEMALE").upper()
    p_type = (passenger_type or "STUDENT").upper()
    rel = guardian_relationship.upper() if guardian_relationship else None

    # 1. Bus Type Governance
    if effective_bus_type == "FEMALE":
        if p_type == "STUDENT":
            if p_gender != "FEMALE":
                return {
                    "is_valid": False,
                    "code": "FEMALE_BUS_STUDENT_RESTRICTION",
                    "message": "Female-designated buses only accommodate female admission students."
                }
        elif p_type == "GUARDIAN":
            allowed_guardians = ["FATHER", "BROTHER", "MOTHER", "SISTER", "HUSBAND", "UNCLE"]
            if rel and rel not in allowed_guardians:
                return {
                    "is_valid": False,
                    "code": "FEMALE_BUS_GUARDIAN_RESTRICTION",
                    "message": f"Guardian relationship '{rel}' is not permitted on female-designated transit."
                }

    if effective_bus_type == "MALE":
        if p_type == "STUDENT":
            if p_gender != "MALE":
                return {
                    "is_valid": False,
                    "code": "MALE_BUS_STUDENT_RESTRICTION",
                    "message": "Male-designated buses only accommodate male admission students."
                }
        elif p_type == "GUARDIAN":
            allowed_guardians = ["MOTHER", "SISTER", "FATHER", "BROTHER", "WIFE", "AUNT"]
            if rel and rel not in allowed_guardians:
                return {
                    "is_valid": False,
                    "code": "MALE_BUS_GUARDIAN_RESTRICTION",
                    "message": f"Guardian relationship '{rel}' is not permitted on male-designated transit."
                }

    # 2. Seat-Level Specific Gender Rule
    if seat_gender_rule == "FEMALE_ONLY" and p_gender != "FEMALE":
        return {
            "is_valid": False,
            "code": "SEAT_FEMALE_ONLY",
            "message": "This seat is strictly reserved for female passengers."
        }

    if seat_gender_rule == "MALE_ONLY" and p_gender != "MALE":
        return {
            "is_valid": False,
            "code": "SEAT_MALE_ONLY",
            "message": "This seat is strictly reserved for male passengers."
        }

    return {"is_valid": True}
