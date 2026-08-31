'use client';

import React from 'react';

import { useApp } from '@/lib/context';

const activeTrips = [
  { id: 1, route: 'Dhaka - Rajshahi', time: '10:00 AM', busNo: 'DK-502', totalSeats: 40, bookedSeats: 35 },
  { id: 2, route: 'Dhaka - Chittagong', time: '11:30 AM', busNo: 'DK-108', totalSeats: 40, bookedSeats: 40 },
  { id: 3, route: 'Khulna - Dhaka', time: '02:00 PM', busNo: 'KL-304', totalSeats: 36, bookedSeats: 20 },
  { id: 4, route: 'Sylhet - Dhaka', time: '04:15 PM', busNo: 'SY-901', totalSeats: 40, bookedSeats: 15 },
  { id: 5, route: 'Dhaka - Barisal', time: '08:00 PM', busNo: 'DK-772', totalSeats: 36, bookedSeats: 32 },
];

export const LiveOccupancy: React.FC = () => {
  const { language } = useApp();
  const [trips, setTrips] = React.useState(activeTrips);

  React.useEffect(() => {
    // Randomly increase booked seats every few seconds for demo
    const interval = setInterval(() => {
      setTrips(prevTrips => prevTrips.map(trip => {
        if (trip.bookedSeats < trip.totalSeats && Math.random() > 0.7) {
          return { ...trip, bookedSeats: trip.bookedSeats + 1 };
        }
        return trip;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {language === 'bn' ? 'লাইভ সিট বুকিং' : 'Live Occupancy'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {language === 'bn' ? 'আজকের বাসের বর্তমান অবস্থা' : "Current status of today's buses"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-500 dark:text-green-400 font-medium">
            {language === 'bn' ? 'লাইভ' : 'Live'}
          </span>
        </div>
      </div>
      
      <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {trips.map((trip) => {
          const occupancyRate = (trip.bookedSeats / trip.totalSeats) * 100;
          let progressColor = 'bg-blue-500';
          if (occupancyRate >= 90) progressColor = 'bg-red-500';
          else if (occupancyRate >= 70) progressColor = 'bg-amber-500';
          else if (occupancyRate < 40) progressColor = 'bg-emerald-500';

          return (
            <div key={trip.id} className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-gray-800 dark:text-white text-sm">{trip.route}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{trip.time}</div>
              </div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <div className="text-gray-500 dark:text-gray-400">
                  {language === 'bn' ? 'বাস:' : 'Bus:'} <span className="text-gray-700 dark:text-gray-300 font-medium">{trip.busNo}</span>
                </div>
                <div className="text-gray-700 dark:text-gray-300 font-medium">
                  {trip.bookedSeats} / {trip.totalSeats} <span className="text-gray-400 dark:text-gray-500">{language === 'bn' ? 'সিট' : 'seats'}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div className={`${progressColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${occupancyRate}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
