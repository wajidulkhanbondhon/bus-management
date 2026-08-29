'use client';

import React, { useState, useMemo } from 'react';
import { PublicHeroSearch } from './public-hero-search';
import { PublicTripCatalog, TripItemData } from './public-trip-catalog';
import { BookingTrackerBanner } from './booking-tracker-banner';
import { AdmissionFeaturesGrid } from './admission-features-grid';
import { PublicHelplineBar } from './public-helpline-bar';

export interface PublicHomeViewProps {
  initialTrips: TripItemData[];
  origins: string[];
  destinations: string[];
}

export function PublicHomeView({
  initialTrips,
  origins,
  destinations,
}: PublicHomeViewProps) {
  const [trips] = useState<TripItemData[]>(initialTrips);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('ALL');
  const [selectedDestination, setSelectedDestination] = useState<string>('ALL');
  const [selectedGenderType, setSelectedGenderType] = useState<string>('ALL');
  const [searchDate, setSearchDate] = useState<string>('');

  // Filter trips
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      if (selectedOrigin !== 'ALL' && trip.route?.origin !== selectedOrigin)
        return false;
      if (
        selectedDestination !== 'ALL' &&
        trip.route?.destination !== selectedDestination
      )
        return false;
      if (
        selectedGenderType !== 'ALL' &&
        trip.tripBusType !== selectedGenderType
      )
        return false;
      if (searchDate) {
        const tripDateStr = new Date(trip.departureDate)
          .toISOString()
          .slice(0, 10);
        if (tripDateStr !== searchDate) return false;
      }
      return true;
    });
  }, [trips, selectedOrigin, selectedDestination, selectedGenderType, searchDate]);

  // Aggregate stats
  const totalAvailableSeats = useMemo(
    () => filteredTrips.reduce((acc, t) => acc + t.availableCount, 0),
    [filteredTrips]
  );
  const totalTripsCount = filteredTrips.length;

  const handleResetFilters = () => {
    setSelectedOrigin('ALL');
    setSelectedDestination('ALL');
    setSelectedGenderType('ALL');
    setSearchDate('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200 overflow-x-hidden relative">
      {/* 1. Hero with interactive map & search filter bar */}
      <PublicHeroSearch
        totalTripsCount={totalTripsCount}
        totalSeatsCount={totalAvailableSeats}
        origins={origins}
        destinations={destinations}
        selectedOrigin={selectedOrigin}
        selectedDestination={selectedDestination}
        selectedGenderType={selectedGenderType}
        searchDate={searchDate}
        onOriginChange={setSelectedOrigin}
        onDestinationChange={setSelectedDestination}
        onGenderTypeChange={setSelectedGenderType}
        onDateChange={setSearchDate}
        onResetFilters={handleResetFilters}
        filteredCount={filteredTrips.length}
      />

      {/* 2. Active Scheduled Bus Trips Grid */}
      <PublicTripCatalog trips={filteredTrips} />

      {/* 3. Booking Search & Tracking Banner */}
      <BookingTrackerBanner />

      {/* 4. University Admission Features & Transit Guarantees */}
      <AdmissionFeaturesGrid />

      {/* 5. 24/7 Helpline & Official WhatsApp Support Bar */}
      <PublicHelplineBar />
    </div>
  );
}
