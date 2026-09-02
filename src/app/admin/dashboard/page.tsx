'use client';

import React, { useEffect, useState } from 'react';
import { LiveVisitorCounter } from '@/components/admin/analytics/LiveVisitorCounter';
import { DynamicChart, ChartStyleType } from '@/components/admin/analytics/DynamicChart';
import { StudentDashboard } from '@/components/passenger/StudentDashboard';
import { TopRoutesChart } from '@/components/admin/analytics/TopRoutesChart';
import { LiveOccupancy } from '@/components/admin/analytics/LiveOccupancy';
import { UserBehaviorAnalytics } from '@/components/admin/analytics/UserBehaviorAnalytics';
import { SeatPreferenceHeatmap } from '@/components/admin/analytics/SeatPreferenceHeatmap';
import { BarChart2, TrendingUp, Activity, Users, Eye, Download, Calendar, Clock, RefreshCw } from 'lucide-react';
import { useApp } from '@/lib/context';

export default function AdminDashboardPage() {
  const { language } = useApp();
  const [salesData, setSalesData] = useState<{ time: string | number; value: number }[]>([]);
  const [revenueData, setRevenueData] = useState<{ time: string | number; value: number }[]>([]);
  const [visitorData, setVisitorData] = useState<{ time: string | number; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState<'sales' | 'revenue' | 'visitors'>('sales');
  const [chartStyle, setChartStyle] = useState<ChartStyleType>('area');
  const [viewMode, setViewMode] = useState<'total' | 'split' | 'admin' | 'student'>('split');
  const [dateRange, setDateRange] = useState<'7D' | '30D' | '1Y' | 'Custom'>('30D');
  const [granularity, setGranularity] = useState<'sec' | 'min' | 'day' | 'month'>('day');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    // Fetch historical data
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/backend/analytics/daily-stats', { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          const transformedSales = data.map((d: any) => ({
            time: d.date,
            value: d.total_tickets_sold || 0,
          }));
          const transformedRevenue = data.map((d: any) => ({
            time: d.date,
            value: d.total_revenue || 0,
          }));
          const transformedVisitors = data.map((d: any) => ({
            time: d.date,
            value: d.total_visitors || 0,
          }));

          setSalesData(transformedSales);
          setRevenueData(transformedRevenue);
          setVisitorData(transformedVisitors);
        } else {
          setSalesData([]);
          setRevenueData([]);
          setVisitorData([]);
        }
      } catch (e) {
        console.error('Failed to fetch analytics', e);
        setSalesData([]);
        setRevenueData([]);
        setVisitorData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange, customStartDate, customEndDate, granularity]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Total Tickets Sold', 'Admin Tickets', 'Student Tickets', 'Total Revenue', 'Admin Revenue', 'Student Revenue', 'Total Visitors'];
    let csv = headers.join(',') + '\n';
    
    salesData.forEach((sd, i) => {
      const rd = revenueData[i];
      const vd = visitorData[i];
      if(rd && vd) {
        csv += `${sd.time},${sd.value},${Math.floor(sd.value * 0.65)},${sd.value - Math.floor(sd.value * 0.65)},${rd.value},${Math.floor(rd.value * 0.65)},${rd.value - Math.floor(rd.value * 0.65)},${vd.value}\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics_report_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <div className="w-full space-y-8">
        
        <header className="flex justify-between items-end pb-4 border-b border-gray-300 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              {language === 'bn' ? 'অ্যানালিটিক্স ড্যাশবোর্ড' : 'Analytics Dashboard'}
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {language === 'bn' ? 'লাইভ ডেটা' : 'Live Data'}
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {language === 'bn' ? 'আপনার প্ল্যাটফর্মের পারফরম্যান্সের রিয়েল-টাইম ওভারভিউ।' : "Real-time overview of your platform's performance."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-end mt-4 md:mt-0">
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3">
              <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <select 
                value={granularity}
                onChange={(e) => {
                  setGranularity(e.target.value as any);
                  setLoading(true);
                }}
                className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none py-2 cursor-pointer"
              >
                <option value="sec">{language === 'bn' ? 'সেকেন্ড' : 'Second'}</option>
                <option value="min">{language === 'bn' ? 'মিনিট' : 'Minute'}</option>
                <option value="day">{language === 'bn' ? 'দিন' : 'Day'}</option>
                <option value="month">{language === 'bn' ? 'মাস' : 'Month'}</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3">
              <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <select 
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value as any);
                  setLoading(true);
                }}
                className="bg-transparent text-sm text-gray-900 dark:text-white focus:outline-none py-2 cursor-pointer"
              >
                <option value="7D">{language === 'bn' ? 'গত ৭ দিন' : 'Last 7 Days'}</option>
                <option value="30D">{language === 'bn' ? 'গত ৩০ দিন' : 'Last 30 Days'}</option>
                <option value="1Y">{language === 'bn' ? 'এই বছর' : 'This Year'}</option>
                <option value="Custom">{language === 'bn' ? 'কাস্টম তারিখ' : 'Custom Date'}</option>
              </select>
            </div>
            {dateRange === 'Custom' && (
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2">
                <input 
                  type="date" 
                  value={customStartDate} 
                  onChange={(e) => { setCustomStartDate(e.target.value); setLoading(true); }}
                  className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none py-1.5"
                />
                <span className="text-gray-500">-</span>
                <input 
                  type="date" 
                  value={customEndDate} 
                  onChange={(e) => { setCustomEndDate(e.target.value); setLoading(true); }}
                  className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none py-1.5"
                />
              </div>
            )}
            <button 
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
              {language === 'bn' ? 'ডেটা এক্সপোর্ট করুন' : 'Export Data'}
            </button>
            <button 
              onClick={() => {
                setLoading(true);
                // Re-fetch real data from the backend
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {language === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh Data'}
            </button>
          </div>
        </header>

        {/* Top Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 font-medium" style={{ fontSize: '1rem' }}>{language === 'bn' ? 'মোট বিক্রি হওয়া টিকিট' : 'Total Tickets Sold'}</p>
                <h3 className="font-bold text-gray-900 dark:text-white tracking-tight mt-2" style={{ fontSize: '2.75rem', lineHeight: '1.2' }}>
                  {salesData.length > 0 ? salesData.reduce((sum, d) => sum + d.value, 0) : 0}
                </h3>
              </div>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BarChart2 className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="flex items-center text-sm">
              <span className="text-emerald-400 font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +12.5%
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">{language === 'bn' ? 'গত সময়ের তুলনায়' : 'vs last period'}</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 font-medium" style={{ fontSize: '1rem' }}>{language === 'bn' ? 'আজকের আয়' : "Today's Revenue"}</p>
                <h3 className="font-bold text-gray-900 dark:text-white tracking-tight mt-2" style={{ fontSize: '2.75rem', lineHeight: '1.2' }}>
                  ৳ {revenueData.length > 0 ? revenueData[revenueData.length - 1].value : 0}
                </h3>
              </div>
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex w-full justify-between mt-2 text-xs text-gray-500">
              <span>{language === 'bn' ? 'অ্যাডমিন' : 'Admin'}: ৳{revenueData.length > 0 ? Math.floor(revenueData[revenueData.length - 1].value * 0.65) : 0}</span>
              <span>{language === 'bn' ? 'স্টুডেন্ট' : 'Student'}: ৳{revenueData.length > 0 ? revenueData[revenueData.length - 1].value - Math.floor(revenueData[revenueData.length - 1].value * 0.65) : 0}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 font-medium" style={{ fontSize: '1rem' }}>{language === 'bn' ? 'অ্যাক্টিভ ভিজিটর' : 'Active Visitors'}</p>
                <h3 className="font-bold text-gray-900 dark:text-white tracking-tight mt-2 flex items-baseline" style={{ fontSize: '2.75rem', lineHeight: '1.2' }}>
                  {visitorData.length > 0 ? visitorData[visitorData.length - 1].value : 0}
                  <span className="text-gray-600 dark:text-gray-400 ml-3 font-normal tracking-normal" style={{ fontSize: '1rem' }}>avg/day</span>
                </h3>
              </div>
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div className="flex items-center text-sm mt-2">
              <span className="text-emerald-400 font-medium flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                +5.2%
              </span>
              <span className="text-gray-600 dark:text-gray-400 ml-2">{language === 'bn' ? 'গত সময়ের তুলনায়' : 'vs last period'}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-600 dark:text-gray-400 font-medium" style={{ fontSize: '1rem' }}>{language === 'bn' ? 'কনভার্শন রেট' : 'Conversion Rate'}</p>
                <h3 className="font-bold text-gray-900 dark:text-white tracking-tight mt-2 flex items-baseline" style={{ fontSize: '2.75rem', lineHeight: '1.2' }}>
                  {salesData.length > 0 && visitorData.length > 0 
                    ? ((salesData[salesData.length - 1].value / visitorData[visitorData.length - 1].value) * 100).toFixed(1) 
                    : 0}%
                </h3>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Eye className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">
                {language === 'bn' ? 'ভিজিটর থেকে ক্রেতার অনুপাত' : 'Visitor to Buyer Ratio'}
              </span>
            </div>
          </div>
        </div>

        {/* Chart Topic Switcher */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0 border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTopic('sales')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTopic === 'sales'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {language === 'bn' ? 'টিকিট বিক্রি' : 'Ticket Sales'}
            </button>
            <button
              onClick={() => setActiveTopic('revenue')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTopic === 'revenue'
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {language === 'bn' ? 'আয়ের ট্রেন্ড' : 'Revenue Trend'}
            </button>
            <button
              onClick={() => setActiveTopic('visitors')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTopic === 'visitors'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-500/50'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {language === 'bn' ? 'মোট ভিজিটর' : 'Total Visitors'}
            </button>
          </div>

          {/* Chart Style Switcher */}
          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setChartStyle('area')}
              title="Area Chart"
              className={`p-1.5 rounded-md transition-colors ${
                chartStyle === 'area' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartStyle('line')}
              title="Line Chart"
              className={`p-1.5 rounded-md transition-colors ${
                chartStyle === 'line' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-200'
              }`}
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartStyle('bar')}
              title="Bar Chart"
              className={`p-1.5 rounded-md transition-colors ${
                chartStyle === 'bar' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Active Chart Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {activeTopic === 'sales' && (language === 'bn' ? 'টিকিট বিক্রির ট্রেন্ড ' : 'Ticket Sales Trend ')}
              {activeTopic === 'revenue' && (language === 'bn' ? 'আয়ের ট্রেন্ড ' : 'Revenue Trend ')}
              {activeTopic === 'visitors' && (language === 'bn' ? 'ভিজিটর ট্রাফিক ' : 'Visitor Traffic ')}
              {viewMode === 'split' && <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">{language === 'bn' ? '(অ্যাডমিন বনাম স্টুডেন্ট)' : '(Admin vs Student)'}</span>}
              {viewMode === 'admin' && <span className="text-sm font-normal text-blue-400 ml-2">{language === 'bn' ? '(শুধুমাত্র অ্যাডমিন প্যানেল)' : '(Admin Panel Only)'}</span>}
              {viewMode === 'student' && <span className="text-sm font-normal text-emerald-400 ml-2">{language === 'bn' ? '(শুধুমাত্র স্টুডেন্ট পোর্টাল)' : '(Student Portal Only)'}</span>}
            </h2>
            <div className="flex space-x-4 items-center">
              <select 
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="bg-gray-100 dark:bg-gray-700 border border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
              >
                <option value="total">{language === 'bn' ? 'সিঙ্গেল (টোটাল ভিউ)' : 'Single (Total View)'}</option>
                <option value="split">{language === 'bn' ? 'ডাবল (কম্পেয়ার ভিউ)' : 'Double (Compare View)'}</option>
                <option value="admin">{language === 'bn' ? 'সিঙ্গেল (শুধুমাত্র অ্যাডমিন)' : 'Single (Admin Only)'}</option>
                <option value="student">{language === 'bn' ? 'সিঙ্গেল (শুধুমাত্র স্টুডেন্ট)' : 'Single (Student Only)'}</option>
              </select>

              {viewMode === 'split' && (
                <>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ml-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="hidden sm:inline">{language === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="hidden sm:inline">{language === 'bn' ? 'স্টুডেন্ট' : 'Student'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            viewMode === 'split' ? (
              <DynamicChart 
                granularity={granularity}
                datasets={[
                  { 
                    label: 'Admin Panel', 
                    data: (activeTopic === 'sales' ? salesData : activeTopic === 'revenue' ? revenueData : visitorData).map(d => ({
                      time: d.time,
                      value: Math.floor(d.value * 0.65) // 65% from admin for demo
                    })), 
                    color: '#3b82f6' // Blue
                  },
                  { 
                    label: 'Student Portal', 
                    data: (activeTopic === 'sales' ? salesData : activeTopic === 'revenue' ? revenueData : visitorData).map(d => ({
                      time: d.time,
                      value: d.value - Math.floor(d.value * 0.65) // Remaining 35% from student
                    })), 
                    color: '#10b981' // Emerald
                  }
                ]}
                type={chartStyle}
              />
            ) : viewMode === 'admin' ? (
              <DynamicChart 
                granularity={granularity}
                data={(activeTopic === 'sales' ? salesData : activeTopic === 'revenue' ? revenueData : visitorData).map(d => ({
                  time: d.time,
                  value: Math.floor(d.value * 0.65)
                }))}
                type={chartStyle}
                color="#3b82f6"
              />
            ) : viewMode === 'student' ? (
              <DynamicChart 
                granularity={granularity}
                data={(activeTopic === 'sales' ? salesData : activeTopic === 'revenue' ? revenueData : visitorData).map(d => ({
                  time: d.time,
                  value: d.value - Math.floor(d.value * 0.65)
                }))}
                type={chartStyle}
                color="#10b981"
              />
            ) : (
              <DynamicChart 
                granularity={granularity}
                data={activeTopic === 'sales' ? salesData : activeTopic === 'revenue' ? revenueData : visitorData}
                type={chartStyle}
                color={activeTopic === 'sales' ? '#3b82f6' : activeTopic === 'revenue' ? '#10b981' : '#f59e0b'}
              />
            )
          )}
        </div>

        {/* Bottom Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          <TopRoutesChart />
          <LiveOccupancy />
        </div>

        <SeatPreferenceHeatmap />

        <UserBehaviorAnalytics />
      </div>
    </div>
  );
}
