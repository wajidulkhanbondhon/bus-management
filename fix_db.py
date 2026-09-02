import sqlite3

def fix_db():
    conn = sqlite3.connect('backend/atoms_bus.db')
    cursor = conn.cursor()
    
    # Bus 1
    notes1 = "[🎯 UNI: DU] | [📍 ROUTE: A ➔ B] | [📅 SCHEDULE: Departure: 2026-09-05 22:30 | Reporting: 21:45 | Booking Opens: 2026-08-25 | Booking Closes: 2026-09-04 | Est Arrival: সকাল ০৬:০০ | Return: 2026-09-07] | UNIT: A Unit; | [💰 FARE: 1250]"
    cursor.execute("UPDATE buses SET notes = ? WHERE id = '1e7e7c41-0852-4ee2-bf43-bbf225537464'", (notes1,))
    
    # Bus 2
    notes2 = "[🎯 UNI: JU] | [📍 ROUTE: C ➔ D] | [📅 SCHEDULE: Departure: 2026-09-07 23:00 | Reporting: 22:00 | Booking Opens: 2026-08-25 | Booking Closes: 2026-09-04 | Est Arrival: সকাল ০৬:০০ | Return: 2026-09-07] | UNIT: B Unit; | [💰 FARE: 800]"
    cursor.execute("UPDATE buses SET notes = ? WHERE id = '3bbb5e22-4bd3-4940-96fc-239297bdb731'", (notes2,))
    
    conn.commit()
    conn.close()
    print("Database buses updated successfully!")

if __name__ == "__main__":
    fix_db()
