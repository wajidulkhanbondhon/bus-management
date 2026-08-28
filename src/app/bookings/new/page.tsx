import React, { Suspense } from 'react';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { getAllTrips } from '@/services/trip.service';
import { getCurrentUser } from '@/lib/auth';
import { getAllLayouts, getAllFareZones } from '@/services/seat-layout.service';

export const revalidate = 0;

export default async function NewBookingPage() {
  const [trips, user, savedLayouts, fareZones] = await Promise.all([
    getAllTrips({ status: 'SCHEDULED' }),
    getCurrentUser(),
    getAllLayouts(),
    getAllFareZones()
  ]);

  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Loading Booking Wizard...</div>}>
      <BookingWizard
        trips={trips}
        currentUser={user}
        savedLayouts={savedLayouts}
        fareZones={fareZones}
      />
    </Suspense>
  );
}

