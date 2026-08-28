export interface GlobalSearchResult {
  buses: any[];
  bookings: any[];
  trips: any[];
  students: any[];
  payments: any[];
}

export async function searchGlobal(query?: string): Promise<GlobalSearchResult> {
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
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

  if ('dhaka'.includes(q) || 'express'.includes(q) || 'bus'.includes(q)) {
    results.buses.push({
      id: 'bus-1',
      busName: 'Dhaka Express 01 (Admission Special)',
      busNumber: 'DHAKA-METRO-BA-11-2024',
      capacity: 40,
      busType: 'MIXED',
      status: 'ACTIVE'
    });
  }

  if ('farhana'.includes(q) || '01712345678'.includes(q) || 'bk-'.includes(q)) {
    results.bookings.push({
      id: 'bk-1',
      bookingNumber: 'BK-20260827-CONF-001',
      contactName: 'Farhana Yasmin',
      contactPhone: '01712345678',
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      netAmount: 650
    });
  }

  if ('rajshahi'.includes(q) || 'trip'.includes(q) || 'unit-a'.includes(q)) {
    results.trips.push({
      id: 'trip-1',
      tripCode: 'TRIP-20260827-001',
      basePrice: 550,
      status: 'SCHEDULED',
      bus: { busName: 'Dhaka Express 01' },
      route: { origin: 'Dhaka Gabtoli', destination: 'Rajshahi University' }
    });
  }

  return results;
}
