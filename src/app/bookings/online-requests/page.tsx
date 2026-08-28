import React from 'react';
import { getOnlinePreBookings } from '@/services/booking.service';
import { getCurrentUser, requireUser } from '@/lib/auth';
import { OnlineRequestsClient } from '@/components/booking/online-requests-client';

export const dynamic = 'force-dynamic';

export default async function OnlineRequestsPage() {
  await requireUser();
  const currentUser = await getCurrentUser();

  // Load all pre-bookings and timer-active bookings
  const bookings = await getOnlinePreBookings();

  return (
    <OnlineRequestsClient
      initialBookings={bookings}
      currentUser={currentUser}
    />
  );
}
