import { NextResponse } from 'next/server';
import { getAllLayouts, getAllFareZones } from '@/services/seat-layout.service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [layouts, fareZones] = await Promise.all([
      getAllLayouts(),
      getAllFareZones()
    ]);
    return NextResponse.json({ success: true, data: layouts, fareZones });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch layouts' }, { status: 500 });
  }
}
