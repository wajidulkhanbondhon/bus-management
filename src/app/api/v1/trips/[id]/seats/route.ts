import { NextRequest, NextResponse } from 'next/server';
import { getTripSeatInventory } from '@/services/inventory.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inventory = await getTripSeatInventory(id);

    return NextResponse.json({
      success: true,
      data: {
        tripId: inventory.trip?.id || id,
        tripCode: inventory.trip?.tripCode || inventory.trip?.trip_code || 'TRIP-2026',
        bus: {
          number: inventory.trip?.bus?.busNumber || inventory.trip?.bus?.bus_number || 'Coach',
          type: inventory.trip?.tripBusType || inventory.trip?.bus?.busType || inventory.trip?.bus?.bus_type || 'MIXED'
        },
        summary: inventory.summary || {
          totalSeats: inventory.seats?.length || 40,
          availableSeats: inventory.seats?.filter((s: any) => s.status === 'AVAILABLE').length || 40,
          bookedSeats: 0,
          heldSeats: 0,
          lockedSeats: 0,
          occupancyPercent: 0,
          grossTripSales: 0
        },
        seats: (inventory.seats || []).map((s: any) => ({
          seatId: s.seatId || s.seat_id || s.id,
          seatNumber: s.seatNumber || s.seat_number || 'Seat',
          row: s.rowIndex ?? s.row_index ?? 1,
          col: s.colIndex ?? s.col_index ?? 1,
          type: s.seatType || s.seat_type || 'STANDARD',
          genderAllowed: s.genderAllowed || s.gender_allowed || 'ANY',
          fare: s.fare || 550,
          zone: s.fareZoneName || s.fare_zone_name || 'Standard',
          status: s.status || 'AVAILABLE'
        }))
      }
    });
  } catch (error: any) {
    console.error('Error fetching seat inventory:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Trip not found or inventory unavailable' },
      { status: 500 }
    );
  }
}
