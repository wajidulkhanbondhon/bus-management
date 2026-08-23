import React from 'react';
import Link from 'next/link';
import { Calendar, Plus, Clock, Bus, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAllTrips } from '@/services/trip.service';
import { formatDate, formatTime, formatCurrency } from '@/lib/utils';

export const revalidate = 0;

export default async function TripsPage() {
  const trips = await getAllTrips();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary">Schedule Management</Badge>
            <span className="text-xs font-mono text-slate-500">TRIP & DEPARTURE LOG</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Bus Trips & Daily Schedules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor real-time passenger loads, departure timelines, and open interactive seat maps.
          </p>
        </div>

        <Link href="/trips/create">
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            Schedule New Trip
          </Button>
        </Link>
      </div>

      {/* Trips Table Card */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Trip Code & Bus</th>
                <th className="px-4 py-3">Route Details</th>
                <th className="px-4 py-3">Departure Date & Time</th>
                <th className="px-4 py-3 text-center">Seats Booked</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Base Fare</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {trips.map((trip) => {
                const totalSeats = trip.bus.seatLayout?.totalSeats || trip.bus.capacity || 40;
                const bookedSeats = trip.bookings.reduce((sum, b) => sum + b.seats.length, 0);
                const occupancy = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

                return (
                  <tr key={trip.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-blue-600 block">{trip.tripCode}</span>
                      <span className="font-bold text-slate-900 text-xs mt-0.5 block">{trip.bus.busName}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant={trip.tripBusType === 'FEMALE' ? 'danger' : (trip.tripBusType === 'MALE' ? 'primary' : 'default')}>
                          {trip.tripBusType || trip.bus.busType} Only
                        </Badge>
                      </div>
                    </td>

                    <td className="px-4 py-4 max-w-xs">
                      <div className="font-semibold text-slate-900 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{trip.route.routeName}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {trip.route.origin} ➔ {trip.route.destination}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">{formatDate(trip.departureDate)}</div>
                      <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px] mt-0.5">
                        <Clock className="w-3 h-3 text-blue-600" />
                        {formatTime(trip.departureTime)}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <div className="font-mono font-bold text-slate-900">
                        <span className="text-blue-600">{bookedSeats}</span> / {totalSeats}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {occupancy}% Occupancy
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <Badge variant={trip.status === 'SCHEDULED' ? 'primary' : (trip.status === 'BOARDING' ? 'warning' : 'success')}>
                        {trip.status}
                      </Badge>
                    </td>

                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(trip.basePrice)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link href={`/trips/${trip.id}/seat-map`}>
                        <Button size="sm" variant="primary" className="font-bold">
                          Seat Map
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
