import React from 'react';
import { getAllBookings } from '@/services/booking.service';
import { TicketSearchAndDispatchClient } from '@/components/booking/ticket-search-and-dispatch-client';

export const revalidate = 0;

export default async function TicketSearchPage() {
  const bookings = await getAllBookings({});
  return <TicketSearchAndDispatchClient initialBookings={bookings || []} />;
}
