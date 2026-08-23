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
        tripId: inventory.trip.id,
        tripCode: inventory.trip.tripCode,
        bus: {
          number: inventory.trip.bus.busNumber,
          type: inventory.trip.tripBusType || inventory.trip.bus.busType
        },
        summary: inventory.summary,
        seats: inventory.seats.map(s => ({
          seatId: s.seatId,
          seatNumber: s.seatNumber,
          row: s.rowIndex,
          col: s.colIndex,
          type: s.seatType,
          genderAllowed: s.genderAllowed,
          fare: s.fare,
          zone: s.fareZoneName,
          status: s.status
        }))
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Trip not found or inventory unavailable' },
      { status: 500 }
    );
  }
}
