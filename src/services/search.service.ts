import { getAllBuses } from './bus.service';
import { getAllTrips } from './trip.service';
import { DEFAULT_PASSENGER_DIRECTORY, DirectoryPassenger } from './passenger-directory.service';

export interface GlobalSearchItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  url: string;
}

export interface GlobalSearchResult {
  buses: GlobalSearchItem[];
  bookings: GlobalSearchItem[];
  trips: GlobalSearchItem[];
  students: GlobalSearchItem[];
  payments: GlobalSearchItem[];
}

export async function searchGlobal(query?: string): Promise<GlobalSearchResult> {
  if (!query || typeof query !== 'string' || query.trim().length < 1) {
    return { buses: [], bookings: [], trips: [], students: [], payments: [] };
  }
  const q = query.toLowerCase().trim();

  const results: GlobalSearchResult = {
    buses: [],
    bookings: [],
    trips: [],
    students: [],
    payments: []
  };

  try {
    // 1. Search Buses
    const buses = await getAllBuses();
    (buses || []).forEach((bus: any) => {
      const name = (bus.busName || bus.bus_name || '').toLowerCase();
      const num = (bus.busNumber || bus.bus_number || '').toLowerCase();
      const op = (bus.operator || bus.operator_name || '').toLowerCase();
      if (name.includes(q) || num.includes(q) || op.includes(q)) {
        results.buses.push({
          id: bus.id,
          title: bus.busName || bus.bus_name || 'Bus',
          subtitle: `${bus.busNumber || bus.bus_number || ''} • ${bus.totalSeats || 40} Seats`,
          badge: bus.busType || 'STANDARD',
          url: `/buses`
        });
      }
    });

    // 2. Search Trips
    const trips = await getAllTrips();
    (trips || []).forEach((trip: any) => {
      const code = (trip.tripCode || trip.trip_code || '').toLowerCase();
      const origin = (trip.route?.origin || '').toLowerCase();
      const dest = (trip.route?.destination || '').toLowerCase();
      const busName = (trip.bus?.busName || trip.bus?.bus_name || '').toLowerCase();
      if (code.includes(q) || origin.includes(q) || dest.includes(q) || busName.includes(q)) {
        results.trips.push({
          id: trip.id,
          title: `${trip.route?.origin || 'Dhaka'} ➔ ${trip.route?.destination || 'Destination'}`,
          subtitle: `${trip.tripCode || 'TRIP'} • ৳${trip.basePrice || 550}`,
          badge: trip.status || 'SCHEDULED',
          url: `/book/${trip.id}`
        });
      }
    });

    // 3. Search Passenger Directory
    DEFAULT_PASSENGER_DIRECTORY.forEach((p: DirectoryPassenger) => {
      const pName = (p.name || '').toLowerCase();
      const phone = (p.phone || '').toLowerCase();
      const inst = (p.institution || '').toLowerCase();
      if (pName.includes(q) || phone.includes(q) || inst.includes(q)) {
        results.students.push({
          id: `p-${p.phone}`,
          title: p.name,
          subtitle: `${p.phone} • ${p.institution || 'Candidate'}`,
          badge: p.passengerType === 'STUDENT' ? 'শিক্ষার্থী' : 'অভিভাবক',
          url: `/bookings`
        });
      }
    });

    // 4. Booking query shortcut if user types BK- or tracking number
    if (q.startsWith('bk-') || q.startsWith('bk') || q.length >= 4) {
      results.bookings.push({
        id: `track-${q}`,
        title: `ট্র্যাকিং নম্বর: ${query.toUpperCase()}`,
        subtitle: 'লাইভ টিকিট ট্র্যাকিং ও বিস্তারিত দেখুন',
        badge: 'TRACK',
        url: `/track/${encodeURIComponent(query.trim())}`
      });
    }
  } catch {
    // Graceful fallback
  }

  return results;
}

