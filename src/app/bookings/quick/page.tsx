import React from 'react';
import type { Metadata } from 'next';
import { QuickCounterBookingClient } from '@/components/booking/quick-counter-booking-client';
import { getAllTrips, normalizeTrip } from '@/services/trip.service';
import { getAllBuses } from '@/services/bus.service';
import { getCurrentUser } from '@/lib/auth';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'কুইক কাউন্টার বুকিং - এটিওএমএস বাস ম্যানেজমেন্ট',
  description: 'রানিং বাসের লাইভ সিট নির্বাচন ও দ্রুত কাউন্টার টিকিট প্রিন্ট পোর্টাল।',
};

export default async function QuickBookingPage({
  searchParams
}: {
  searchParams?: Promise<{ tripId?: string; busId?: string }>;
}) {
  const sParams = searchParams ? await searchParams : {};
  const tripIdParam = typeof sParams.tripId === 'string' ? sParams.tripId : '';
  const busIdParam = typeof sParams.busId === 'string' ? sParams.busId : '';

  const [tripsData, busesData, user] = await Promise.all([
    getAllTrips({ status: 'SCHEDULED' }).catch(() => []),
    getAllBuses().catch(() => []),
    getCurrentUser()
  ]);

  const rawTrips = Array.isArray(tripsData) ? tripsData : [];
  const rawBuses = Array.isArray(busesData) ? busesData : [];

  // Existing bus IDs that already have a trip scheduled
  const existingBusIdsWithTrips = new Set(
    rawTrips.map((t: any) => t.busId || t.bus_id || t.bus?.id).filter(Boolean)
  );

  // Active buses without scheduled trips can have synthesized fallback trips
  const fallbackBusTrips = rawBuses
    .filter((b: any) => !existingBusIdsWithTrips.has(b.id) && (b.status || 'ACTIVE') === 'ACTIVE')
    .map((b: any, idx: number) => {
      const busNum = b.busNumber || b.bus_number || `বাস-${idx + 1}`;
      const busName = b.busName || b.bus_name || `স্পেশাল কোচ (${busNum})`;
      const targetUni = b.targetUniversity || 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র';
      const routeOrigin = b.routeOrigin || 'ঢাকা';
      const routeDest = b.routeDestination || targetUni;

      return normalizeTrip({
        id: b.id,
        trip_code: `TRIP-${busNum}`,
        tripCode: `TRIP-${busNum}`,
        bus_id: b.id,
        bus: b,
        route: {
          id: `route-${b.id}`,
          origin: routeOrigin,
          destination: routeDest,
          route_name: `${routeOrigin} ➔ ${routeDest}`,
          routeName: `${routeOrigin} ➔ ${routeDest}`
        },
        targetUniversity: targetUni,
        examUnit: b.examUnit || 'সকল ইউনিট',
        departure_date: b.departureDate || new Date().toISOString(),
        departureDate: b.departureDate || new Date().toISOString(),
        departure_time: b.departureTime || '22:30',
        departureTime: b.departureTime || '22:30',
        base_price: b.basePrice || 550,
        basePrice: b.basePrice || 550,
        status: 'SCHEDULED',
        trip_bus_type: b.busType || b.bus_type || 'MIXED',
        tripBusType: b.busType || b.bus_type || 'MIXED'
      });
    });

  // Combine real database trips with any additional active bus trips
  const allAvailableTrips = [...rawTrips, ...fallbackBusTrips];

  // Determine initial selected trip based on searchParams or upcoming trip
  let initialTripId = '';
  if (tripIdParam) {
    const foundByTrip = allAvailableTrips.find((t) => t.id === tripIdParam);
    if (foundByTrip) initialTripId = foundByTrip.id;
  }
  if (!initialTripId && busIdParam) {
    const foundByBus = allAvailableTrips.find((t) => (t.bus?.id === busIdParam || t.bus_id === busIdParam || t.id === busIdParam));
    if (foundByBus) initialTripId = foundByBus.id;
  }
  if (!initialTripId && allAvailableTrips.length > 0) {
    // Prefer today's trip or the trip with the newest/upcoming departure date
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrip = allAvailableTrips.find((t) => (t.departureDate || t.departure_date || '').includes(todayStr));
    if (todayTrip) {
      initialTripId = todayTrip.id;
    } else {
      // Sort to pick the latest/active scheduled trip
      const sorted = [...allAvailableTrips].sort((a, b) => {
        const dateA = new Date(a.departureDate || a.departure_date || 0).getTime();
        const dateB = new Date(b.departureDate || b.departure_date || 0).getTime();
        return dateB - dateA;
      });
      initialTripId = sorted[0].id;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40 p-3 sm:p-5 lg:p-7">
      <QuickCounterBookingClient
        trips={allAvailableTrips}
        initialTripId={initialTripId}
        currentUser={user}
      />
    </div>
  );
}
