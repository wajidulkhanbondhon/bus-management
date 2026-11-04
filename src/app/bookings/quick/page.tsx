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

  // Helper to parse bus notes for rich university & route metadata
  const parseBusNotes = (notes: string = '') => {
    let departureTime = '22:30';
    let departureDate = new Date().toISOString().split('T')[0];
    let origin = 'ঢাকা';
    let destination = '';
    let targetUni = '';
    let fare = 550;
    let examUnit = 'সকল ইউনিট';

    if (notes) {
      const uniMatch = notes.match(/\[🎯\s*UNI:\s*([^\]]+)\]/i);
      if (uniMatch) targetUni = uniMatch[1].trim();

      const timeMatch = notes.match(/DEP_TIME:\s*([^\n;]+)/i);
      if (timeMatch) departureTime = timeMatch[1].trim();

      const dateMatch = notes.match(/DEP_DATE:\s*([^\n;]+)/i);
      if (dateMatch) departureDate = dateMatch[1].trim();

      const routeMatch = notes.match(/ROUTE:\s*([^\n;]+)/i);
      if (routeMatch) {
        const parts = routeMatch[1].split('➔').map((s) => s.trim());
        if (parts.length === 2) {
          origin = parts[0];
          destination = parts[1];
        } else {
          destination = routeMatch[1].trim();
        }
      }

      const fareMatch = notes.match(/FARE:\s*([^\n;]+)/i);
      if (fareMatch) {
        const num = parseInt(fareMatch[1].replace(/[^0-9]/g, ''), 10);
        if (num > 0) fare = num;
      }

      const unitMatch = notes.match(/UNIT:\s*([^\n;]+)/i);
      if (unitMatch) examUnit = unitMatch[1].trim();
    }

    return { departureTime, departureDate, origin, destination: destination || targetUni, targetUni, fare, examUnit };
  };

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

  // Build passenger directory map for instant phone number suggestions
  const recentPassengersMap = new Map<string, any>();
  allBookings.forEach((b: any) => {
    const cPhone = (b.contactPhone || b.contact_phone || '').replace(/[\s\-\+]/g, '');
    const cName = b.contactName || b.contact_name;
    if (cPhone.length >= 11 && cName) {
      if (!recentPassengersMap.has(cPhone)) {
        recentPassengersMap.set(cPhone, {
          name: cName,
          phone: cPhone,
          gender: b.passengerGender || b.passenger_gender || 'MALE',
          passengerType: (b.isStudent ?? b.is_student) ? 'STUDENT' : 'GUEST',
          admissionId: b.studentAdmissionId || b.student_admission_id || '',
        });
      }
    }

    if (Array.isArray(b.passengers)) {
      b.passengers.forEach((p: any) => {
        const pPhone = (p.passengerPhone || p.passenger_phone || '').replace(/[\s\-\+]/g, '');
        const pName = p.passengerName || p.passenger_name;
        if (pPhone.length >= 11 && pName) {
          if (!recentPassengersMap.has(pPhone)) {
            recentPassengersMap.set(pPhone, {
              name: pName,
              phone: pPhone,
              gender: p.gender || 'MALE',
              passengerType: p.passengerType || p.passenger_type || 'STUDENT',
              admissionId: p.admissionId || p.admission_id || p.studentAdmissionId || '',
            });
          }
        }
      });
    }
  });

  const recentPassengers = Array.from(recentPassengersMap.values());

  // Existing bus IDs that already have a trip scheduled
  const existingBusIdsWithTrips = new Set(
    rawTrips.map((t: any) => t.busId || t.bus_id || t.bus?.id).filter(Boolean)
  );

  // Active buses without scheduled trips can have synthesized fallback trips
  const fallbackBusTrips = rawBuses
    .filter((b: any) => !existingBusIdsWithTrips.has(b.id) && (b.status || 'ACTIVE') === 'ACTIVE')
    .map((b: any, idx: number) => {
      const parsedNotes = parseBusNotes(b.notes || '');
      const busNum = b.busNumber || b.bus_number || `বাস-${idx + 1}`;
      const busName = b.busName || b.bus_name || `স্পেশাল কোচ (${busNum})`;
      const targetUni = b.targetUniversity || b.target_university || parsedNotes.targetUni || parsedNotes.destination || 'রাজশাহী বিশ্ববিদ্যালয় (RU)';
      const routeOrigin = b.routeOrigin || b.origin || parsedNotes.origin || 'ঢাকা';
      const routeDest = b.routeDestination || b.destination || targetUni;
      const depDate = b.departureDate || b.departure_date || parsedNotes.departureDate;
      const depTime = b.departureTime || b.departure_time || parsedNotes.departureTime;
      const examUnit = b.examUnit || b.exam_unit || parsedNotes.examUnit || 'সকল ইউনিট';
      const basePrice = b.basePrice || b.base_price || parsedNotes.fare || 550;

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
        examUnit,
        departure_date: depDate,
        departureDate: depDate,
        departure_time: depTime,
        departureTime: depTime,
        base_price: basePrice,
        basePrice: basePrice,
        status: 'SCHEDULED',
        trip_bus_type: b.busType || b.bus_type || 'MIXED',
        tripBusType: b.busType || b.bus_type || 'MIXED'
      });
    });

  // Combine real database trips with active synthesized bus trips
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
        recentPassengers={recentPassengers}
      />
    </div>
  );
}
