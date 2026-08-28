import React from 'react';
import { getAllBookings } from '@/services/booking.service';
import { BookingsRosterClient } from '@/components/booking/bookings-roster-client';

export const revalidate = 0;

export default async function BookingsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; status?: string; paymentStatus?: string }>;
}) {
  const params = await searchParams;
  const bookings = await getAllBookings({
    search: params.search,
    status: params.status,
    paymentStatus: params.paymentStatus
  });

  return <BookingsRosterClient initialBookings={bookings || []} />;
}
