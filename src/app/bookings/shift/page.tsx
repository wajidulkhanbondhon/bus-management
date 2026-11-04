import React from 'react';
import { getAllBookings } from '@/services/booking.service';
import { getAllTrips } from '@/services/trip.service';
import { SeatShiftClient } from '@/components/booking/seat-shift-client';

export const revalidate = 0;

export default async function SeatShiftPage() {
  const [bookings, trips] = await Promise.all([
    getAllBookings({}).catch(() => []),
    getAllTrips().catch(() => [])
  ]);

  return <SeatShiftClient initialBookings={bookings || []} initialTrips={trips || []} />;
}
