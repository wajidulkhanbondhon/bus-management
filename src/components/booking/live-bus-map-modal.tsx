'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { MapPin, Bus, Navigation, Clock, Activity } from 'lucide-react';

interface LiveBusMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export function LiveBusMapModal({ isOpen, onClose, booking }: LiveBusMapModalProps) {
  const [distance, setDistance] = useState(12.5); // km
  const [eta, setEta] = useState(45); // minutes
  
  // Simulate bus movement
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setDistance(prev => Math.max(0, prev - 0.1));
      setEta(prev => Math.max(0, prev - 0.5));
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Live Bus Tracking" size="lg">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-b-2xl overflow-hidden flex flex-col h-[70vh]">
        {/* Top Info Bar */}
        <div className="bg-white dark:bg-slate-950 p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {booking.trip?.bus?.busName || 'ATOMS Express'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">{booking.trip?.bus?.registrationNumber || 'DHAKA-METRO-B-11-2233'}</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-xs text-slate-500">Distance</p>
              <p className="font-bold font-mono text-slate-900 dark:text-white">{distance.toFixed(1)} km</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">ETA</p>
              <p className="font-bold font-mono text-emerald-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.ceil(eta)} min
              </p>
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
          {/* Simulated Map Background */}
          <div className="absolute inset-0 opacity-50 dark:opacity-30" style={{ 
            backgroundImage: 'url("https://www.transparenttextures.com/patterns/cartographer.png")',
            backgroundSize: '200px'
          }} />
          
          {/* Route Line */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-1 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 rounded-full w-[60%] transition-all duration-1000" />
          </div>

          {/* Start Point */}
          <div className="absolute left-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-slate-400 border-2 border-white dark:border-slate-900 z-10" />
            <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-400">Current</span>
          </div>
          
          {/* End Point (Boarding) */}
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 z-10 flex items-center justify-center">
              <MapPin className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-bold mt-1 text-slate-600 dark:text-slate-400 text-center max-w-[80px]">
              {booking.boardingPoint || 'Boarding Point'}
            </span>
          </div>

          {/* Moving Bus Marker */}
          <div className="absolute left-[60%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-1000">
             <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center animate-bounce">
                <Navigation className="w-4 h-4 text-white" />
             </div>
             <div className="bg-white dark:bg-slate-900 text-[9px] font-bold px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap">
               60 km/h
             </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="bg-white dark:bg-slate-950 p-4 shrink-0 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
           <div className="flex items-center gap-2">
             <span className="relative flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
             </span>
             <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Live GPS Active</span>
           </div>
           <button className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
             <Activity className="w-3 h-3" />
             View Traffic
           </button>
        </div>
      </div>
    </Modal>
  );
}
