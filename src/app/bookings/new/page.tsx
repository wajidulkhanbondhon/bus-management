import React, { Suspense } from 'react';
import { BookingWizard } from '@/components/booking/booking-wizard';
import { getAllTrips } from '@/services/trip.service';
import { getAllBuses } from '@/services/bus.service';
import { getCurrentUser } from '@/lib/auth';
import { getAllLayouts, getAllFareZones } from '@/services/seat-layout.service';
import { getAllBookings } from '@/services/booking.service';

export const revalidate = 0;

export default async function NewBookingPage() {
  const [tripsData, busesData, user, savedLayouts, fareZones, allBookingsData] = await Promise.all([
    getAllTrips({ status: 'SCHEDULED' }).catch(() => []),
    getAllBuses().catch(() => []),
    getCurrentUser(),
    getAllLayouts(),
    getAllFareZones(),
    getAllBookings().catch(() => [])
  ]);

  const rawTrips = Array.isArray(tripsData) ? tripsData : [];
  const rawBuses = Array.isArray(busesData) ? busesData : [];
  const allBookings = Array.isArray(allBookingsData) ? allBookingsData : [];

  // Helper to extract clean metadata from bus notes
  const parseBusNotes = (notes: string = '') => {
    let departureTime = '22:30';
    let departureDate = new Date().toISOString().split('T')[0];
    let reportingTime = '22:00';
    let estArrival = '06:00 AM';
    let origin = 'ঢাকা (গাবতলী/সায়েদাবাদ)';
    let destination = 'বিশ্ববিদ্যালয় ভর্তি কেন্দ্র';
    let fare = 550;
    let hotelPackage = '';
    let examUnit = '';
    let examDate = '';

    if (notes) {
      const timeMatch = notes.match(/DEP_TIME:\s*([^\n;]+)/i);
      if (timeMatch) departureTime = timeMatch[1].trim();

      const dateMatch = notes.match(/DEP_DATE:\s*([^\n;]+)/i);
      if (dateMatch) departureDate = dateMatch[1].trim();

      const examMatch = notes.match(/EXAM_DATE:\s*([^\n;]+)/i);
      if (examMatch) examDate = examMatch[1].trim();

      const repMatch = notes.match(/REPORTING:\s*([^\n;]+)/i);
      if (repMatch) reportingTime = repMatch[1].trim();

      const arrMatch = notes.match(/ARRIVAL:\s*([^\n;]+)/i);
      if (arrMatch) estArrival = arrMatch[1].trim();

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

      const hotelMatch = notes.match(/HOTEL PACKAGE:\s*([^\n;]+)/i);
      if (hotelMatch) hotelPackage = hotelMatch[1].trim();
      
      const unitMatch = notes.match(/UNIT:\s*([^\n;]+)/i);
      if (unitMatch) examUnit = unitMatch[1].trim();
    }

    return { departureTime, departureDate, examDate, reportingTime, estArrival, origin, destination, fare, hotelPackage, examUnit };
  };

  // Build standard seat names for a given capacity (A1..A4, B1..B4, ..., K1..K5)
  const generateSeatNamesForCapacity = (capacity: number = 45) => {
    const letters = 'ABCDEFGHIJKLMN';
    const names: string[] = [];
    let generated = 0;
    let rowIdx = 0;

    while (generated < capacity && rowIdx < letters.length) {
      const row = letters[rowIdx];
      const isLastRow = generated + 5 >= capacity;
      const countInRow = isLastRow ? Math.min(5, capacity - generated) : 4;
      for (let i = 1; i <= countInRow && generated < capacity; i++) {
        names.push(`${row}${i}`);
        generated++;
      }
      rowIdx++;
    }
    return names;
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
    let femaleCount = 0;
    let maleCount = 0;

    relevantBookings.forEach((b: any) => {
      const passengers = Array.isArray(b.passengers) ? b.passengers : [];
      const seatBookings = Array.isArray(b.seat_bookings || b.seats) ? (b.seat_bookings || b.seats) : [];

      passengers.forEach((p: any) => {
        const sNum = (p.seatNumber || p.seat_number || p.seatId || p.seat_id || '').toUpperCase();
        if (sNum) bookedSeatLabelsSet.add(sNum);
        if (p.gender === 'FEMALE') femaleCount++;
        else if (p.gender === 'MALE') maleCount++;
      });

      seatBookings.forEach((sb: any) => {
        const sNum = (sb.seatNumber || sb.seat_number || sb.seat?.seatNumber || sb.seatId || '').toUpperCase();
        if (sNum) bookedSeatLabelsSet.add(sNum);
      });
    });

    const allStandardSeats = generateSeatNamesForCapacity(capacity);
    const bookedSeatLabels = Array.from(bookedSeatLabelsSet);
    const bookedCount = bookedSeatLabels.length;
    const availableCount = Math.max(0, capacity - bookedCount);
    const soldPercentage = capacity > 0 ? Math.min(100, Math.round((bookedCount / capacity) * 100)) : 0;
    const availableSeatNumbersPreview = allStandardSeats.filter((s) => !bookedSeatLabelsSet.has(s));

    return {
      totalSeats: capacity,
      bookedCount,
      availableCount,
      soldPercentage,
      femaleCount,
      maleCount,
      bookedSeatLabels,
      availableSeatNumbersPreview
    };
  };

  const getLayoutInfo = (layoutId: string | null | undefined) => {
    if (!layoutId) return null;
    const layout = savedLayouts.find((l: any) => l.id === layoutId);
    if (!layout) return null;

    let parsedJson: any = null;
    if (layout.layout_json && typeof layout.layout_json === 'string') {
      try {
        parsedJson = JSON.parse(layout.layout_json);
      } catch (e) {}
    }

    const layoutGrid = layout.layoutGrid || parsedJson?.layoutGrid;
    const unit = layout.unit || layout.examName || parsedJson?.unit || parsedJson?.examName || '';
    const university = layout.university || parsedJson?.university || '';

    let minFare = Infinity;
    let maxFare = 0;
    
    // Calculate actual fares from layout grid if available
    if (Array.isArray(layoutGrid)) {
      layoutGrid.forEach((row: any[]) => {
        if (Array.isArray(row)) {
          row.forEach((cell: any) => {
            if (cell && cell.type === 'SEAT') {
              const bFare = Number(cell.baseFare);
              if (!isNaN(bFare) && bFare > 0) {
                if (bFare < minFare) minFare = bFare;
                if (bFare > maxFare) maxFare = bFare;
              }
            }
          });
        }
      });
    }

    if (minFare === Infinity) minFare = 550; // Fallback
    if (maxFare === 0) maxFare = minFare;

    return {
      unit,
      university,
      minFare,
      maxFare,
      layoutGrid
    };
  };

  // Only ACTIVE buses are eligible for booking
  const activeBuses = rawBuses.filter((b: any) => {
    const st = (b.status || 'ACTIVE').toUpperCase();
    return st === 'ACTIVE';
  });

  const existingBusIdsWithTrips = new Set(
    rawTrips.map((t: any) => t.busId || t.bus_id || t.bus?.id).filter(Boolean)
  );

  // Generate an instant booking trip for every active bus created by the user
  const synthesizedBusTrips = activeBuses
    .filter((b: any) => !existingBusIdsWithTrips.has(b.id))
    .map((b: any, idx: number) => {
      const cleanBusNum = (b.busNumber || b.bus_number || `B${idx + 1}`).toString().replace(/[^A-Za-z0-9]/g, '');
      const busName = b.busName || b.bus_name || 'বিশ্ববিদ্যালয় এক্সপ্রেস কোচ';
      const parsedNotes = parseBusNotes(b.notes || '');
      const layoutInfo = getLayoutInfo(b.seatLayoutId || b.seat_layout_id);
      
      const origin = b.routeOrigin || parsedNotes.origin;
      const destination = b.routeDestination || parsedNotes.destination || layoutInfo?.university || b.targetUniversity || 'রাজশাহী বিশ্ববিদ্যালয় (RU)';
      const uniName = b.targetUniversity || layoutInfo?.university || destination;
      const examUnit = b.examUnit || layoutInfo?.unit || parsedNotes.examUnit || 'General / All Units';
      const basePrice = layoutInfo ? layoutInfo.minFare : (b.basePrice || parsedNotes.fare || 550);
      const maxPrice = layoutInfo ? layoutInfo.maxFare : basePrice;

      const capacity = Number(b.capacity) || 45;
      const tripId = b.id; // Use direct bus.id so /bookings/new?tripId=${bus.id} matches instantly!
      const stats = computeTripSeatStats(tripId, b.id, capacity);

      return {
        id: tripId,
        tripCode: `TRIP-${cleanBusNum || `COACH${idx + 1}`}`,
        trip_code: `TRIP-${cleanBusNum || `COACH${idx + 1}`}`,
        busId: b.id,
        bus_id: b.id,
        bus: {
          id: b.id,
          busName: busName,
          bus_name: busName,
          busNumber: b.busNumber || b.bus_number || `METRO-${idx + 1}`,
          bus_number: b.busNumber || b.bus_number || `METRO-${idx + 1}`,
          capacity: capacity,
          busType: b.busType || b.bus_type || 'MIXED',
          bus_type: b.busType || b.bus_type || 'MIXED',
          operator: b.operator || 'Central Transport Office',
          status: 'ACTIVE',
          notes: b.notes || '',
          examUnit: examUnit
        },
        route: {
          routeName: `${origin} ➔ ${destination}`,
          route_name: `${origin} ➔ ${destination}`,
          origin: origin,
          destination: destination
        },
        targetUniversity: uniName,
        departureDate: b.departureDate || parsedNotes.departureDate,
        departureTime: b.departureTime || parsedNotes.departureTime,
        examDate: b.examDate || parsedNotes.examDate,
        reportingTime: parsedNotes.reportingTime,
        estArrival: parsedNotes.estArrival,
        hotelPackage: parsedNotes.hotelPackage,
        examUnit: examUnit,
        tripBusType: b.busType || b.bus_type || 'MIXED',
        basePrice: basePrice,
        maxPrice: maxPrice,
        status: 'SCHEDULED',
        stats: stats
      };
    });

  // Attach live seat stats to rawTrips as well (only for ACTIVE buses)
  const enhancedRawTrips = rawTrips
    .filter((t: any) => {
      const bStatus = (t.bus?.status || t.bus_status || 'ACTIVE').toUpperCase();
      return bStatus === 'ACTIVE';
    })
    .map((t: any) => {
      const cap = t.bus?.capacity || 45;
      const stats = computeTripSeatStats(t.id, t.busId || t.bus?.id, cap);
      const parsedNotes = parseBusNotes(t.notes || t.bus?.notes || '');
      const layoutInfo = getLayoutInfo(t.bus?.seatLayoutId || t.bus?.seat_layout_id);
      
      const basePrice = layoutInfo ? layoutInfo.minFare : (t.basePrice || parsedNotes.fare || 550);
      const maxPrice = layoutInfo ? layoutInfo.maxFare : basePrice;
      const examUnit = t.examUnit || t.bus?.examUnit || layoutInfo?.unit || parsedNotes.examUnit || 'General / All Units';
      const targetUni = t.targetUniversity || layoutInfo?.university || t.route?.destination || 'রাজশাহী বিশ্ববিদ্যালয় (RU)';

      return {
        ...t,
        targetUniversity: targetUni,
        busId: t.busId || t.bus_id || t.bus?.id,
        examDate: t.examDate || parsedNotes.examDate,
        reportingTime: t.reportingTime || parsedNotes.reportingTime,
        estArrival: t.estArrival || parsedNotes.estArrival,
        hotelPackage: t.hotelPackage || parsedNotes.hotelPackage,
        examUnit: examUnit,
        basePrice: basePrice,
        maxPrice: maxPrice,
        stats: stats
      };
    });

  const combinedTrips = [...enhancedRawTrips, ...synthesizedBusTrips];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Suspense fallback={<div className="p-8 text-center text-slate-500 font-semibold animate-pulse">Loading Booking Wizard...</div>}>
          <BookingWizard
            trips={combinedTrips}
            currentUser={user}
            savedLayouts={savedLayouts}
            fareZones={fareZones}
          />
        </Suspense>
      </div>
    </div>
  );
}

