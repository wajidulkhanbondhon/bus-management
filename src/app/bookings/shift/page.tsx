import React from 'react';
import { getAllBookings } from '@/services/booking.service';
import { SeatShiftClient } from '@/components/booking/seat-shift-client';

export const revalidate = 0;

export default async function SeatShiftPage() {
  const bookings = await getAllBookings({});
  return <SeatShiftClient initialBookings={bookings || []} />;
}
