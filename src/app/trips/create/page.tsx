import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Calendar, Save, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAllBuses, getAllRoutes } from '@/services/bus.service';
import { getAllFareZones } from '@/services/seat-layout.service';
import { createTripAction } from '@/actions/trip.actions';

export const revalidate = 0;

export default async function CreateTripPage() {
  const [buses, routes, fareZones] = await Promise.all([
    getAllBuses(),
    getAllRoutes(),
    getAllFareZones()
  ]);

  async function handleCreateTrip(formData: FormData) {
    'use server';
    const busId = formData.get('busId') as string;
    const routeId = formData.get('routeId') as string;
    const departureDate = formData.get('departureDate') as string;
    const departureTime = formData.get('departureTime') as string;
    const basePrice = Number(formData.get('basePrice'));
    const tripBusType = formData.get('tripBusType') as any;
    const notes = formData.get('notes') as string;

    // Build ISO date objects
    const combinedDateTime = new Date(`${departureDate}T${departureTime}:00`);

    await createTripAction({
      busId,
      routeId,
      departureDate: new Date(departureDate),
      departureTime: combinedDateTime,
      basePrice,
      tripBusType: tripBusType || undefined,
      notes: notes || undefined
    });

    redirect('/trips');
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/trips">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Schedule New Bus Trip</h1>
          <p className="text-xs text-slate-500">Create a specific dated trip schedule with route, coach and fare configuration</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <form action={handleCreateTrip} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Bus / Coach</label>
                <select
                  name="busId"
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white"
                >
                  {buses.filter(b => b.status === 'ACTIVE').map(b => (
                    <option key={b.id} value={b.id}>
                      {b.busNumber} - {b.busName} ({b.busType}, {b.capacity} Seats)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Transit Route</label>
                <select
                  name="routeId"
                  required
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white"
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.routeName} ({r.origin} ➔ {r.destination})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Departure Date"
                name="departureDate"
                type="date"
                defaultValue={todayStr}
                required
              />
              <Input
                label="Departure Time (Dhaka Local)"
                name="departureTime"
                type="time"
                defaultValue="20:30"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Base Ticket Fare (BDT)"
                name="basePrice"
                type="number"
                defaultValue={550}
                required
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Trip Gender Policy Override</label>
                <select
                  name="tripBusType"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-medium bg-white"
                >
                  <option value="">Inherit Bus Default Policy</option>
                  <option value="FEMALE">Female Only Special Coach</option>
                  <option value="MALE">Male Only Special Coach</option>
                  <option value="MIXED">Mixed (Male & Female Candidates)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Trip Schedule Notes</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="e.g. Special night coach for Rajshahi University Unit-A admission candidates with rest stop at Sirajganj."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg font-normal"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Link href="/trips">
                <Button variant="ghost" size="md">Cancel</Button>
              </Link>
              <Button variant="primary" size="md" type="submit" className="font-bold">
                <Save className="w-4 h-4 mr-1.5" />
                Schedule Trip
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
