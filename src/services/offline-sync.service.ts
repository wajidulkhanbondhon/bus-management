'use client';

import { proxyUrl } from '@/lib/config';

export interface OfflinePassengerData {
  passenger_name: string;
  passenger_phone: string;
  seat_id: string;
  seat_number: string;
  gender: string;
  passenger_type?: string;
  admission_id?: string;
  guardian_phone?: string;
  guardian_relationship?: string;
  has_whatsapp?: boolean;
}

export interface OfflineBookingRecord {
  localId: string;
  tripId: string;
  tripCode?: string;
  busNumber?: string;
  seats: { seat_id: string; seat_number?: string; fare: number }[];
  passengers: OfflinePassengerData[];
  journey_type?: string;
  boarding_point?: string;
  dropping_point?: string;
  payment_method: string;
  paid_amount: number;
  due_amount?: number;
  notes?: string;
  bookedAt: string;
  syncStatus: 'PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT';
  conflictReason?: string;
  bookingNumber?: string;
}

const STORAGE_KEY = 'atmos_bus_offline_bookings_queue_v1';

function getStoredQueue(): OfflineBookingRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[OfflineQueue] Failed to load from localStorage:', e);
    return [];
  }
}

function saveStoredQueue(queue: OfflineBookingRecord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('[OfflineQueue] Failed to save to localStorage:', e);
  }
}

/**
 * Check if the browser is currently online
 */
export function isNetworkOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Enqueues an offline booking locally when internet is disconnected.
 */
export function enqueueOfflineBooking(data: Omit<OfflineBookingRecord, 'localId' | 'bookedAt' | 'syncStatus'>): OfflineBookingRecord {
  const localId = `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const record: OfflineBookingRecord = {
    ...data,
    localId,
    bookedAt: new Date().toISOString(),
    syncStatus: 'PENDING'
  };

  const queue = getStoredQueue();
  queue.push(record);
  saveStoredQueue(queue);

  return record;
}

/**
 * Returns all offline bookings currently in the local queue.
 */
export function getOfflineBookingsQueue(): OfflineBookingRecord[] {
  return getStoredQueue();
}

/**
 * Returns count of pending offline bookings awaiting sync.
 */
export function getPendingOfflineCount(): number {
  return getStoredQueue().filter(r => r.syncStatus === 'PENDING').length;
}

/**
 * Syncs all pending offline bookings to the server.
 */
export async function syncOfflineBookingsToServer(): Promise<{
  success: boolean;
  syncedCount: number;
  conflictCount: number;
  results: any[];
}> {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return { success: false, syncedCount: 0, conflictCount: 0, results: [] };
  }

  const queue = getStoredQueue();
  const pending = queue.filter(r => r.syncStatus === 'PENDING');
  if (pending.length === 0) {
    return { success: true, syncedCount: 0, conflictCount: 0, results: [] };
  }

  // Mark items as syncing
  pending.forEach(r => { r.syncStatus = 'SYNCING'; });
  saveStoredQueue(queue);

  const payload = {
    bookings: pending.map(r => ({
      offline_ref_id: r.localId,
      trip_id: r.tripId,
      seats: r.seats,
      passengers: r.passengers,
      journey_type: r.journey_type || 'ROUND_TRIP',
      boarding_point: r.boarding_point,
      dropping_point: r.dropping_point,
      payment_method: r.payment_method || 'HAND_CASH',
      paid_amount: r.paid_amount || 0,
      due_amount: r.due_amount || 0,
      notes: r.notes,
      booked_at: r.bookedAt
    }))
  };

  try {
    const res = await fetch(proxyUrl('/bookings/offline-sync'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Sync API responded with status ${res.status}`);
    }

    const data = await res.json();
    const serverResults = data.results || [];
    let synced = 0;
    let conflicts = 0;

    // Update queue statuses based on server responses
    serverResults.forEach((sr: any) => {
      const match = queue.find(q => q.localId === sr.offline_ref_id);
      if (match) {
        if (sr.sync_status === 'SYNCED' || sr.sync_status === 'ALREADY_SYNCED') {
          match.syncStatus = 'SYNCED';
          match.bookingNumber = sr.booking_number;
          synced++;
        } else if (sr.sync_status === 'CONFLICT') {
          match.syncStatus = 'CONFLICT';
          match.conflictReason = sr.conflict_reason || sr.message;
          conflicts++;
        } else {
          match.syncStatus = 'PENDING'; // retry later
        }
      }
    });

    saveStoredQueue(queue);
    return { success: true, syncedCount: synced, conflictCount: conflicts, results: serverResults };
  } catch (err) {
    console.error('[OfflineQueue] Sync failed:', err);
    // Reset back to PENDING
    pending.forEach(r => {
      if (r.syncStatus === 'SYNCING') r.syncStatus = 'PENDING';
    });
    saveStoredQueue(queue);
    return { success: false, syncedCount: 0, conflictCount: 0, results: [] };
  }
}

/**
 * Initializes automatic sync listener when network connection restores.
 */
export function initAutoOfflineSync(onSyncCallback?: (results: any) => void) {
  if (typeof window === 'undefined') return;

  const handleOnline = async () => {
    const res = await syncOfflineBookingsToServer();
    if (res.syncedCount > 0 || res.conflictCount > 0) {
      if (onSyncCallback) onSyncCallback(res);
    }
  };

  window.addEventListener('online', handleOnline);
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * Removes all already-synced items from localStorage to reclaim space.
 */
export function clearSyncedOfflineBookings(): void {
  const queue = getStoredQueue();
  const remaining = queue.filter(r => r.syncStatus !== 'SYNCED');
  saveStoredQueue(remaining);
}
