'use client';

import React, { useState, useEffect } from 'react';
import { Armchair, TrendingUp, Info } from 'lucide-react';

interface SeatData {
  id: string;
  popularity: number; // 0 to 100
  isWindow: boolean;
}

// Generate standard 45-seat layout (A-J 4 seats, K 5 seats)
const generateMockSeats = (): SeatData[] => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seats: SeatData[] = [];

  const addSeat = (row: string, col: number, rowIndex: number, totalCols: number) => {
    let basePop = 50;
    if (rowIndex < 3) basePop += 25; // Front
    if (rowIndex > 7) basePop -= 20; // Back
    
    const isWindow = col === 1 || col === totalCols;
    if (isWindow) basePop += 20;

    let popularity = basePop + (Math.random() * 20 - 10);
    if (popularity > 100) popularity = 100;
    if (popularity < 0) popularity = 0;

    seats.push({ id: `${row}${col}`, popularity: Math.round(popularity), isWindow });
  };

  // Rows A to J (4 seats each)
  rows.forEach((row, rowIndex) => {
    for (let col = 1; col <= 4; col++) {
      addSeat(row, col, rowIndex, 4);
    }
  });

  // Row K (5 seats)
  for (let col = 1; col <= 5; col++) {
    addSeat('K', col, 10, 5);
  }

  return seats;
};

import { useApp } from '@/lib/context';

export const SeatPreferenceHeatmap: React.FC = () => {
  const { language } = useApp();
  const [seats, setSeats] = useState<SeatData[]>([]);

  useEffect(() => {
    setSeats(generateMockSeats());
    
    // Slight live variation
    const interval = setInterval(() => {
      setSeats(prev => prev.map(seat => {
        if (Math.random() > 0.8) {
          const change = Math.random() > 0.5 ? 2 : -2;
          let newPop = seat.popularity + change;
          if (newPop > 100) newPop = 100;
          if (newPop < 0) newPop = 0;
          return { ...seat, popularity: newPop };
        }
        return seat;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (seats.length === 0) return null;

  // Calculate stats
  const windowAvg = seats.filter(s => s.isWindow).reduce((acc, s) => acc + s.popularity, 0) / seats.filter(s => s.isWindow).length;
  const aisleAvg = seats.filter(s => !s.isWindow).reduce((acc, s) => acc + s.popularity, 0) / seats.filter(s => !s.isWindow).length;
  const frontAvg = seats.filter(s => ['A','B','C'].includes(s.id[0])).reduce((acc, s) => acc + s.popularity, 0) / 12;
  const backAvg = seats.filter(s => ['H','I','J'].includes(s.id[0])).reduce((acc, s) => acc + s.popularity, 0) / 12;

  const getColor = (popularity: number) => {
    // Return a color from light gray/blue to deep blue/red based on popularity
    if (popularity < 20) return 'bg-gray-700 text-gray-400';
    if (popularity < 40) return 'bg-blue-900/50 text-blue-300';
    if (popularity < 60) return 'bg-blue-600/70 text-white';
    if (popularity < 80) return 'bg-indigo-500 text-white';
    return 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]'; // Highly popular
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col h-full">
      <div className="mb-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Armchair className="w-5 h-5 mr-2 text-rose-500 dark:text-rose-400" />
            {language === 'bn' ? 'সিট পছন্দ ও চাহিদা' : 'Seat Preference Heatmap'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {language === 'bn' ? 'যে সিটগুলো সবচেয়ে বেশি বুকিং হচ্ছে' : 'Most frequently booked seat locations'}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start justify-center flex-1">
        
        {/* Bus Layout Grid */}
        <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border-2 border-gray-200 dark:border-gray-700 w-fit mx-auto md:mx-0">
          <div className="w-12 sm:w-16 h-3 sm:h-4 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-6 sm:mb-8 opacity-80 dark:opacity-50"></div> {/* Driver Seat Visual */}
          
          <div className="grid grid-cols-5 gap-x-2 sm:gap-x-3 gap-y-2 sm:gap-y-3">
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map(row => (
              <React.Fragment key={row}>
                {(() => {
                  const s1 = seats.find(s => s.id === `${row}1`);
                  return s1 ? <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm flex items-center justify-center text-[10px] sm:text-xs font-bold transition-colors ${getColor(s1.popularity)}`} title={`${s1.id}: ${s1.popularity}%`}>{s1.id}</div> : <div />;
                })()}
                {(() => {
                  const s2 = seats.find(s => s.id === `${row}2`);
                  return s2 ? <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm flex items-center justify-center text-[10px] sm:text-xs font-bold transition-colors ${getColor(s2.popularity)}`} title={`${s2.id}: ${s2.popularity}%`}>{s2.id}</div> : <div />;
                })()}
                <div /> {/* Aisle */}
                {(() => {
                  const s3 = seats.find(s => s.id === `${row}3`);
                  return s3 ? <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm flex items-center justify-center text-[10px] sm:text-xs font-bold transition-colors ${getColor(s3.popularity)}`} title={`${s3.id}: ${s3.popularity}%`}>{s3.id}</div> : <div />;
                })()}
                {(() => {
                  const s4 = seats.find(s => s.id === `${row}4`);
                  return s4 ? <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm flex items-center justify-center text-[10px] sm:text-xs font-bold transition-colors ${getColor(s4.popularity)}`} title={`${s4.id}: ${s4.popularity}%`}>{s4.id}</div> : <div />;
                })()}
              </React.Fragment>
            ))}
            
            {/* Last Row (K) with 5 seats */}
            {[1, 2, 3, 4, 5].map(col => {
              const sK = seats.find(s => s.id === `K${col}`);
              return sK ? (
                <div key={sK.id} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-t-lg rounded-b-sm flex items-center justify-center text-[10px] sm:text-xs font-bold transition-colors ${getColor(sK.popularity)}`} title={`${sK.id}: ${sK.popularity}%`}>{sK.id}</div>
              ) : <div key={`empty-K${col}`} />;
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700/50 pt-4 flex flex-col items-center">
            <h4 className="text-[10px] text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">
              {language === 'bn' ? 'চাহিদার কালার গাইড' : 'Demand Level Guide'}
            </h4>
            <div className="flex flex-wrap gap-3 justify-center text-[11px] text-gray-700 dark:text-gray-300">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-sm bg-rose-500 mr-1.5 shadow-[0_0_5px_rgba(244,63,94,0.5)]"></div>
                {language === 'bn' ? 'খুব বেশি' : 'Very High'}
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-sm bg-indigo-500 mr-1.5"></div>
                {language === 'bn' ? 'বেশি' : 'High'}
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-sm bg-blue-600/70 mr-1.5"></div>
                {language === 'bn' ? 'মাঝারি' : 'Moderate'}
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-sm bg-blue-900/50 mr-1.5"></div>
                {language === 'bn' ? 'কম' : 'Low'}
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <div className="w-3 h-3 rounded-sm bg-gray-300 dark:bg-gray-700 mr-1.5"></div>
                {language === 'bn' ? 'খুব কম' : 'Very Low'}
              </div>
            </div>
          </div>

        </div>

        {/* Stats Panel */}
        <div className="flex-1 space-y-6 w-full max-w-sm">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-500 dark:text-blue-400" />
              {language === 'bn' ? 'পছন্দের পরিসংখ্যান' : 'Preference Insights'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'bn' ? 'জানালার সিট' : 'Window Seats'}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{Math.round(windowAvg)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${windowAvg}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'bn' ? 'মাঝখানের সিট' : 'Aisle Seats'}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{Math.round(aisleAvg)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${aisleAvg}%` }}></div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'bn' ? 'সামনের সিট (A-C)' : 'Front (A-C)'}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{Math.round(frontAvg)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${frontAvg}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">{language === 'bn' ? 'পেছনের সিট (H-K)' : 'Back (H-K)'}</span>
                  <span className="text-gray-900 dark:text-white font-medium">{Math.round(backAvg)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div className="bg-gray-400 dark:bg-gray-500 h-1.5 rounded-full" style={{ width: `${backAvg}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700/50 text-xs text-gray-500 dark:text-gray-400 flex">
            <Info className="w-4 h-4 mr-2 flex-shrink-0 text-blue-500 dark:text-blue-400" />
            <p>
              {language === 'bn' 
                ? 'লাল এবং গাঢ় নীল রঙের সিটগুলো সবচেয়ে বেশি বুকিং হচ্ছে। ব্যবহারকারীদের মধ্যে সামনের ও জানালার সিটের চাহিদা বেশি দেখা যাচ্ছে।' 
                : 'Red / Dark Blue seats indicate the highest booking frequency. Users show a strong preference for window and front seats.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
