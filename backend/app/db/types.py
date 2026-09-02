from sqlalchemy import Numeric

# Shared fixed-point money column: avoids float drift on financial fields.
Money = Numeric(12, 2)
