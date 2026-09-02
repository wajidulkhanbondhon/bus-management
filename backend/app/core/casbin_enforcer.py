import os
import casbin
from typing import Optional

CONF_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "rbac_model.conf")

# Initialize Casbin Enforcer with model configuration
enforcer = casbin.Enforcer(CONF_PATH)

# Setup Default Role Hierarchy
# SUPER_ADMIN inherits ADMIN
enforcer.add_role_for_user("SUPER_ADMIN", "ADMIN")
# ADMIN inherits MANAGER
enforcer.add_role_for_user("ADMIN", "MANAGER")
# MANAGER inherits OPERATOR
enforcer.add_role_for_user("MANAGER", "OPERATOR")
# OPERATOR inherits STAFF
enforcer.add_role_for_user("OPERATOR", "STAFF")

# Setup Default Resource Policies: (Role, Resource Path, Action)
DEFAULT_POLICIES = [
    # Admin / System Management
    ("ADMIN", "/api/v1/users/*", "(GET|POST|PUT|DELETE)"),
    ("ADMIN", "/api/v1/roles/*", "(GET|POST|PUT|DELETE)"),
    ("ADMIN", "/api/v1/tenants/*", "(GET|POST|PUT|DELETE)"),
    ("ADMIN", "/api/v1/backup/*", "(GET|POST)"),
    ("ADMIN", "/api/v1/settings/*", "(GET|POST|PUT)"),
    ("ADMIN", "/api/v1/audit/*", "GET"),
    
    # Operations & Bus Fleet
    ("MANAGER", "/api/v1/buses/*", "(GET|POST|PUT|DELETE)"),
    ("MANAGER", "/api/v1/trips/*", "(GET|POST|PUT|DELETE)"),
    ("MANAGER", "/api/v1/routes/*", "(GET|POST|PUT|DELETE)"),
    ("MANAGER", "/api/v1/coupons/*", "(GET|POST|PUT|DELETE)"),
    ("MANAGER", "/api/v1/analytics/*", "GET"),
    ("MANAGER", "/api/v1/reports/*", "(GET|POST)"),
    
    # Ticketing & Counter Staff
    ("OPERATOR", "/api/v1/bookings/*", "(GET|POST|PUT)"),
    ("OPERATOR", "/api/v1/payments/*", "(GET|POST)"),
    ("OPERATOR", "/api/v1/buses/*", "GET"),
    ("OPERATOR", "/api/v1/trips/*", "GET"),
    
    # Passenger / Student (Self-service)
    ("PASSENGER", "/api/v1/trips/search", "GET"),
    ("PASSENGER", "/api/v1/bookings/my", "GET"),
    ("PASSENGER", "/api/v1/bookings/hold", "POST"),
    ("PASSENGER", "/api/v1/bookings/confirm", "POST"),
]

for policy in DEFAULT_POLICIES:
    enforcer.add_policy(*policy)


def check_permission(sub: str, obj: str, act: str) -> bool:
    """
    Checks if subject (role or user_id) has permission to perform action on resource.
    SUPER_ADMIN always evaluates to True via Casbin model matcher.
    """
    if sub == "SUPER_ADMIN":
        return True
    return enforcer.enforce(sub, obj, act)
