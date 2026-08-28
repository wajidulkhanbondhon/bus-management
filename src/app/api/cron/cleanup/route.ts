import { cleanExpiredBookings } from '@/services/booking.service';
import { NextResponse } from 'next/server';

/**
 * Cron-compatible API route to clean up expired bookings and seat holds.
 * 
 * Can be called:
 * - Externally via cron (e.g., every 5 minutes)
 * - From a client-side interval as a heartbeat
 * 
 * Usage: GET /api/cron/cleanup
 * 
 * Protected by a simple secret token to prevent abuse.
 */
export async function GET(request: Request) {
  // Optional: Protect with a secret token for production
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const expectedToken = process.env.CRON_SECRET || 'atoms-cleanup-token';

  if (process.env.NODE_ENV === 'production' && token !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await cleanExpiredBookings();
    return NextResponse.json({
      success: true,
      message: 'Expired bookings and seat holds cleaned up',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[CRON] Cleanup failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Cleanup failed' },
      { status: 500 }
    );
  }
}
