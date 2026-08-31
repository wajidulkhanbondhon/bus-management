'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { useApp } from '@/lib/context';

const data = [
  { name: 'Dhaka - Rajshahi', value: 400 },
  { name: 'Dhaka - Chittagong', value: 300 },
  { name: 'Dhaka - Sylhet', value: 300 },
  { name: 'Khulna - Dhaka', value: 200 },
  { name: 'Barisal - Dhaka', value: 100 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const TopRoutesChart: React.FC = () => {
  const { language } = useApp();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {language === 'bn' ? 'শীর্ষ বাস রুট' : 'Top Bus Routes'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {language === 'bn' ? 'টিকিট বিক্রির ভিত্তিতে সবচেয়ে জনপ্রিয় গন্তব্য' : 'Most popular destinations by ticket sales'}
        </p>
      </div>
      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#374151', color: '#fff', borderRadius: '8px', fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif" }}
              itemStyle={{ color: '#fff', fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif" }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              formatter={(value) => <span className="text-gray-700 dark:text-gray-300 text-sm" style={{fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif"}}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
