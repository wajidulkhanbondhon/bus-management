'use client';

import React, { useState, useEffect } from 'react';
import { MousePointerClick, Clock, Layout, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { useApp } from '@/lib/context';

// Mock Data
const initialPages = [
  { path: '/home', views: 14500, avgTime: '2m 15s', bounceRate: '35%' },
  { path: '/search-results', views: 12200, avgTime: '4m 30s', bounceRate: '20%' },
  { path: '/checkout/payment', views: 8900, avgTime: '3m 10s', bounceRate: '45%' },
  { path: '/student-portal', views: 5600, avgTime: '5m 45s', bounceRate: '15%' },
  { path: '/offers', views: 4200, avgTime: '1m 20s', bounceRate: '60%' },
  { path: '/bus-schedule', views: 3800, avgTime: '2m 50s', bounceRate: '25%' },
  { path: '/profile/history', views: 2900, avgTime: '1m 45s', bounceRate: '10%' },
  { path: '/cancellation', views: 1500, avgTime: '3m 05s', bounceRate: '50%' },
  { path: '/contact-us', views: 950, avgTime: '1m 15s', bounceRate: '75%' },
];

const initialInteractions = [
  { name: 'Search Bus', clicks: 8400 },
  { name: 'Select Seat', clicks: 6500 },
  { name: 'Proceed Pay', clicks: 4200 },
  { name: 'Filter by AC', clicks: 3100 },
  { name: 'Login/Register', clicks: 2800 },
  { name: 'Apply Promo', clicks: 2100 },
  { name: 'Download Ticket', clicks: 1800 },
  { name: 'Cancel Ticket', clicks: 850 },
  { name: 'View Map', clicks: 620 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#f43f5e', '#6366f1'];

export const UserBehaviorAnalytics: React.FC = () => {
  const { language } = useApp();
  const [pages, setPages] = useState(initialPages);
  const [interactions, setInteractions] = useState(initialInteractions);

  // Live simulation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setPages(prev => prev.map(page => ({
        ...page,
        views: page.views + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) : 0)
      })));

      setInteractions(prev => prev.map(interaction => ({
        ...interaction,
        clicks: interaction.clicks + (Math.random() > 0.6 ? Math.floor(Math.random() * 2) : 0)
      })));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mt-6 mb-12">
      <div className="mb-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            <Layout className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" />
            {language === 'bn' ? 'ইউজার বিহেভিয়ার এবং এনগেজমেন্ট' : 'User Behavior & Engagement'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {language === 'bn' ? 'ভিজিটররা কীভাবে আপনার প্ল্যাটফর্মে ইন্টারঅ্যাক্ট করে তা ট্র্যাক করুন' : 'Track how visitors interact with your platform'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            {language === 'bn' ? 'লাইভ ট্র্যাকিং' : 'Live Tracking'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Pages Table */}
        <div>
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-emerald-500 dark:text-emerald-400" />
            {language === 'bn' ? 'শীর্ষ পঠিত পেজ ও সময়' : 'Top Visited Pages & Time'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600 dark:text-gray-400">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-4 py-3 rounded-l-lg">{language === 'bn' ? 'পেজ পাথ' : 'Page Path'}</th>
                  <th scope="col" className="px-4 py-3">{language === 'bn' ? 'ভিউস' : 'Views'}</th>
                  <th scope="col" className="px-4 py-3">{language === 'bn' ? 'গড় সময়' : 'Avg. Time'}</th>
                  <th scope="col" className="px-4 py-3 rounded-r-lg">{language === 'bn' ? 'বাউন্স রেট' : 'Bounce Rate'}</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-blue-600 dark:text-blue-400 flex items-center">
                      <ArrowRight className="w-3 h-3 mr-1 opacity-50" />
                      {page.path}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{page.views.toLocaleString()}</td>
                    <td className="px-4 py-3">{page.avgTime}</td>
                    <td className="px-4 py-3">{page.bounceRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Interactions Chart */}
        <div>
          <h3 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
            <MousePointerClick className="w-4 h-4 mr-2 text-amber-500 dark:text-amber-400" />
            {language === 'bn' ? 'সবচেয়ে বেশি ক্লিক করা উপাদান' : 'Most Clicked Elements'}
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={interactions.map(item => {
                  const translations: Record<string, string> = {
                    'Search Bus': 'বাস খুঁজুন',
                    'Select Seat': 'সিট নির্বাচন',
                    'Proceed Pay': 'পেমেন্ট করুন',
                    'Filter by AC': 'এসি ফিল্টার',
                    'Login/Register': 'লগইন/রেজিস্টার',
                    'Apply Promo': 'প্রোমো প্রয়োগ',
                    'Download Ticket': 'টিকিট ডাউনলোড',
                    'Cancel Ticket': 'টিকিট বাতিল',
                    'View Map': 'ম্যাপ দেখুন'
                  };
                  return {
                    ...item,
                    name: language === 'bn' ? (translations[item.name] || item.name) : item.name
                  };
                })}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis type="number" stroke="#9ca3af" tick={{fill: '#6b7280', fontSize: 12, fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif"}} />
                <YAxis dataKey="name" type="category" stroke="#9ca3af" tick={{fill: '#4b5563', fontSize: 12, fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif"}} width={100} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.9)', borderColor: '#374151', color: '#fff', borderRadius: '8px', fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif" }}
                  itemStyle={{ color: '#fff', fontFamily: "'Inter', 'Noto Sans Bengali', sans-serif" }}
                  cursor={{fill: 'rgba(156,163,175,0.1)'}}
                />
                <Bar dataKey="clicks" radius={[0, 4, 4, 0]}>
                  {interactions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
