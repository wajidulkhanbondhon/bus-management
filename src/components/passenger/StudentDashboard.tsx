'use client';

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bus, CreditCard, CalendarClock, MapPin, BarChart as BarChartIcon } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface Booking {
  id: string;
  tripId: string;
  route: string; // e.g. "Dhaka - Rajshahi"
  status: string; // e.g. "CONFIRMED", "CANCELLED", "COMPLETED"
  totalFare: number;
  date: string;
  boardingPoint: string;
}

interface StudentDashboardProps {
  bookings: Booking[];
  language: 'en' | 'bn';
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

export function StudentDashboard({ bookings, language }: StudentDashboardProps) {
  // 1. Calculate Summary Stats
  const validBookings = bookings.filter(b => b.status !== 'CANCELLED' && b.status !== 'REFUNDED');
  const totalJourneys = validBookings.length;
  
  const totalSpent = validBookings.reduce((sum, b) => sum + (Number(b.totalFare) || 0), 0);
  
  const now = new Date();
  const upcomingTrips = validBookings.filter(b => new Date(b.date) >= now).length;

  // 2. Calculate Top Destinations (Pie Chart Data)
  const destinationData = useMemo(() => {
    const destCounts: Record<string, number> = {};
    validBookings.forEach(b => {
      // Assuming route format "Dhaka - Rajshahi" or "Dhaka to Chittagong"
      const parts = b.route.split(/[-–to]/).map(p => p.trim());
      const destination = parts.length > 1 ? parts[parts.length - 1] : b.route;
      
      if (destination) {
        destCounts[destination] = (destCounts[destination] || 0) + 1;
      }
    });

    return Object.entries(destCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [validBookings]);

  // 3. Calculate Travel History (Bar Chart Data - Last 6 Months)
  const travelHistoryData = useMemo(() => {
    const months: Record<string, number> = {};
    
    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' });
      months[monthKey] = 0;
    }

    // Populate data
    validBookings.forEach(b => {
      const bDate = new Date(b.date);
      const diffTime = Math.abs(now.getTime() - bDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 180) { // roughly 6 months
        const monthKey = bDate.toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' });
        if (months[monthKey] !== undefined) {
          months[monthKey] += 1;
        }
      }
    });

    return Object.entries(months).map(([name, journeys]) => ({ name, journeys }));
  }, [validBookings, language, now]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Summary Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Journeys */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-900/50 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {language === 'bn' ? 'মোট ভ্রমণ' : 'Total Journeys'}
              </p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {totalJourneys}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Bus className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Spent */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-emerald-900/50 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {language === 'bn' ? 'মোট খরচ' : 'Total Spent'}
              </p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                ৳ {totalSpent.toLocaleString()}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Upcoming Trips */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-900/50 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {language === 'bn' ? 'আসন্ন ট্রিপ' : 'Upcoming Trips'}
              </p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                {upcomingTrips}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <CalendarClock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {validBookings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Destinations */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <MapPin className="w-5 h-5 text-indigo-500" />
                {language === 'bn' ? 'আপনার জনপ্রিয় গন্তব্য' : 'Your Top Destinations'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={destinationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {destinationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [
                        `${value} ${language === 'bn' ? 'টি ট্রিপ' : 'Trips'}`, 
                        language === 'bn' ? 'ভ্রমণ' : 'Journeys'
                      ]}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Travel History */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <BarChartIcon className="w-5 h-5 text-blue-500" />
                {language === 'bn' ? 'ভ্রমণ হিস্ট্রি (গত ৬ মাস)' : 'Travel History (Last 6 Months)'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={travelHistoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="journeys" 
                      name={language === 'bn' ? 'টি টিকিট' : 'Tickets'}
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Bus className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">
            {language === 'bn' ? 'কোনো ডেটা নেই' : 'No Travel Data'}
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {language === 'bn' 
              ? 'আপনার এখনো কোনো সফল বুকিং নেই, তাই ড্যাশবোর্ড খালি দেখাচ্ছে।' 
              : 'You have no successful bookings yet, so the dashboard is empty.'}
          </p>
        </div>
      )}
    </div>
  );
}
