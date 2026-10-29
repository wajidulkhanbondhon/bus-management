import React from 'react';
import type { Metadata } from 'next';
import { QuickCounterBookingClient } from '@/components/booking/quick-counter-booking-client';
import { getAllTrips, normalizeTrip } from '@/services/trip.service';
import { getAllBuses } from '@/services/bus.service';
import { getCurrentUser } from '@/lib/auth';
import { getAllBookings } from '@/services/booking.service';

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

  const [tripsData, busesData, user, allBookingsData] = await Promise.all([
    getAllTrips({ status: 'SCHEDULED' }).catch(() => []),
    getAllBuses().catch(() => []),
    getCurrentUser(),
    getAllBookings().catch(() => [])
  ]);

  const rawTrips = Array.isArray(tripsData) ? tripsData : [];
  const rawBuses = Array.isArray(busesData) ? busesData : [];
  const allBookings = Array.isArray(allBookingsData) ? allBookingsData : [];

  // Helper to compute live seat booking stats for a trip/bus
  const computeTripSeatStats = (tripId: string, busId?: string, capacity: number = 45) => {
    const relevantBookings = allBookings.filter((b: any) => {
      const bTripId = b.trip_id || b.tripId || b.trip?.id;
      const bBusId = b.bus_id || b.busId || b.bus?.id || b.trip?.bus?.id;
      const isStatusValid = b.booking_status !== 'CANCELLED' && b.bookingStatus !== 'CANCELLED';
      if (!isStatusValid) return false;
      return bTripId === tripId || (busId && bBusId === busId);
    });

    const bookedSeatLabelsSet = new Set<string>();
    relevantBookings.forEach((b: any) => {
      const passengers = Array.isArray(b.passengers) ? b.passengers : [];
      const seatBookings = Array.isArray(b.seat_bookings || b.seats) ? (b.seat_bookings || b.seats) : [];
      passengers.forEach((p: any) => {
        const sNum = (p.seatNumber || p.seat_number || p.seatId || p.seat_id || '').toUpperCase();
        if (sNum) bookedSeatLabelsSet.add(sNum);
      });
      seatBookings.forEach((sb: any) => {
        const sNum = (sb.seatNumber || sb.seat_number || sb.seat?.seatNumber || sb.seatId || '').toUpperCase();
        if (sNum) bookedSeatLabelsSet.add(sNum);
      });
    });

    const bookedCount = bookedSeatLabelsSet.size;
    const availableCount = Math.max(0, capacity - bookedCount);
    const soldPercentage = capacity > 0 ? Math.min(100, Math.round((bookedCount / capacity) * 100)) : 0;

    return {
      totalSeats: capacity,
      bookedCount,
      availableCount,
      soldPercentage
    };
  };

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

  // Domain Rule: Only show buses whose booking is currently running ("বুকিং চলছে")
  // Exclude completed, cancelled, arrived, closed, draft, expired, or full buses ("যে গুলো হয়ে গেছে, বা পরে হবে")
  const isTripBookingRunning = (t: any) => {
    // 1. Bus status must be ACTIVE
    const busStatus = (t.bus?.status || 'ACTIVE').toUpperCase();
    if (busStatus !== 'ACTIVE') return false;

    // 2. Trip status must be active (not completed/cancelled/draft/pending/closed)
    const tripStatus = (t.status || 'SCHEDULED').toUpperCase();
    if (['COMPLETED', 'CANCELLED', 'ARRIVED', 'CLOSED', 'EXPIRED', 'DRAFT', 'PENDING', 'INACTIVE', 'MAINTENANCE'].includes(tripStatus)) {
      return false;
    }

    // 3. Must have available seats (not sold out/full)
    if (t.stats) {
      if (t.stats.availableCount <= 0 || t.stats.soldPercentage >= 100) return false;
    }

    // 4. Departure date must not be in the past
    const dep = t.departureDate || t.departure_date;
    if (dep) {
      try {
        const depDateOnly = new Date(dep).toISOString().split('T')[0];
        const todayDateOnly = new Date().toISOString().split('T')[0];
        if (depDateOnly < todayDateOnly) {
          return false;
        }
      } catch {}
    }

    return true;
  };

  const runningTrips = allAvailableTrips
    .map((t) => {
      const cap = Number(t.bus?.capacity) || 45;
      const stats = computeTripSeatStats(t.id, t.bus_id || t.bus?.id, cap);
      return { ...t, stats };
    })
    .filter(isTripBookingRunning);

  // Determine initial selected trip based on searchParams or upcoming trip among running trips
  let initialTripId = '';
  if (tripIdParam) {
    const foundByTrip = runningTrips.find((t) => t.id === tripIdParam);
    if (foundByTrip) initialTripId = foundByTrip.id;
  }
  if (!initialTripId && busIdParam) {
    const foundByBus = runningTrips.find((t) => (t.bus?.id === busIdParam || t.bus_id === busIdParam || t.id === busIdParam));
    if (foundByBus) initialTripId = foundByBus.id;
  }
  if (!initialTripId && runningTrips.length > 0) {
    // Prefer today's trip or the trip with the earliest/active upcoming departure
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrip = runningTrips.find((t) => (t.departureDate || t.departure_date || '').includes(todayStr));
    if (todayTrip) {
      initialTripId = todayTrip.id;
    } else {
      initialTripId = runningTrips[0].id;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40 p-3 sm:p-5 lg:p-7">
      <QuickCounterBookingClient
        trips={runningTrips}
        initialTripId={initialTripId}
        currentUser={user}
      />
    </div>
  );
}
