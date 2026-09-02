'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  Layers,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export type ChartType = 'area' | 'line' | 'bar' | 'pie';
export type MetricType = 'sales' | 'routes' | 'payments' | 'demographics' | 'occupancy';

interface InteractiveDashboardAnalyticsProps {
  progressiveSales: any[];
  routeBreakdown: any[];
  paymentBreakdown: any[];
  passengerDemographics: any[];
  busPerformance: any[];
}

export function InteractiveDashboardAnalytics({
  progressiveSales = [],
  routeBreakdown = [],
  paymentBreakdown = [],
  passengerDemographics = [],
  busPerformance = []
}: InteractiveDashboardAnalyticsProps) {

  const { t, language } = useApp();
  const [mounted, setMounted] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('area');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('sales');

  useEffect(() => {
    setMounted(true);
  }, []);

  const metricOptions: { id: MetricType; labelBn: string; labelEn: string; defaultChart: ChartType }[] = [
    {
      id: 'sales',
      labelBn: 'প্রোগ্রেসিভ সেলস ও কালেকশন (ঘণ্টা অনুযায়ী)',
      labelEn: 'Progressive Sales & Realtime Collection Flow',
      defaultChart: 'area'
    },
    {
      id: 'routes',
      labelBn: 'রুট ও বিশ্ববিদ্যালয় অনুযায়ী টিকিট ও রাজস্ব',
      labelEn: 'Route & University Revenue / Ticket Volume',
      defaultChart: 'bar'
    },
    {
      id: 'payments',
      labelBn: 'পেমেন্ট মাধ্যম শেয়ার (বিকাশ, নগদ, রকেট, ক্যাশ)',
      labelEn: 'Payment Gateway Distribution & Share',
      defaultChart: 'pie'
    },
    {
      id: 'demographics',
      labelBn: 'যাত্রী ও শিক্ষার্থী ডেমোগ্রাফিক্স (ছাত্র/ছাত্রী/অভিভাবক)',
      labelEn: 'Passenger Demographics & Gender Ratio',
      defaultChart: 'bar'
    },
    {
      id: 'occupancy',
      labelBn: 'বাসের সিট পূরণ ও খালি অনুপাত (Occupancy)',
      labelEn: 'Fleet Seat Occupancy & Capacity Utilization',
      defaultChart: 'bar'
    }
  ];

  const currentMetricConfig = metricOptions.find(m => m.id === selectedMetric) || metricOptions[0];

  const handleMetricChange = (metricId: MetricType) => {
    setSelectedMetric(metricId);
    const target = metricOptions.find(m => m.id === metricId);
    if (target) {
      setChartType(target.defaultChart);
    }
  };

  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#ec4899', '#0891b2'];

  const getChartData = () => {
    switch (selectedMetric) {
      case 'sales':
        return progressiveSales;
      case 'routes':
        return routeBreakdown.map(r => ({
          name: r.routeName.length > 20 ? `${r.routeName.slice(0, 18)}...` : r.routeName,
          fullName: r.routeName,
          revenue: r.revenue,
          tickets: r.tickets
        }));
      case 'payments':
        return paymentBreakdown.map(p => ({
          name: p.method.replace('_', ' '),
          value: p.amount,
          count: p.count,
          percentage: p.percentage
        }));
      case 'demographics':
        return passengerDemographics.map(d => ({
          name: d.name,
          value: d.count,
          color: d.color
        }));
      case 'occupancy':
        return busPerformance.map(b => ({
          name: b.busName.length > 16 ? `${b.busName.slice(0, 14)}...` : b.busName,
          sold: b.sold,
          available: b.available,
          total: b.totalSeats,
          occupancy: b.occupancy
        }));
      default:
        return progressiveSales;
    }
  };

  const chartData = getChartData();

  return (
    <Card className="shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {language === 'bn' ? 'ইন্টারেক্টিভ অ্যানালিটিক্স' : 'Dynamic Analytics'}
            </span>
            <Badge variant="primary" className="text-xs font-bold">
              {language === 'bn' ? 'লাইভ ফিল্টারিং' : 'Live Filter'}
            </Badge>
          </div>
          <CardTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">
            {language === 'bn' ? currentMetricConfig.labelBn : currentMetricConfig.labelEn}
          </CardTitle>
        </div>

        {/* Controls: Metric Selector Dropdown + Chart Type Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Metric Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedMetric}
              onChange={(e) => handleMetricChange(e.target.value as MetricType)}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8 cursor-pointer shadow-2xs"
            >
              {metricOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {language === 'bn' ? opt.labelBn : opt.labelEn}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Chart Type Switcher Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartType('area')}
              title={language === 'bn' ? 'Area Chart (ভলিউম ও ফ্লো)' : 'Area Chart'}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                chartType === 'area'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Area</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              title={language === 'bn' ? 'Bar Chart (তুলনামূলক সংখ্যা)' : 'Bar Chart'}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Bar</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              title={language === 'bn' ? 'Line Chart (সময়ের সাথে ট্রেন্ড)' : 'Line Chart'}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Line</span>
            </button>
            <button
              onClick={() => setChartType('pie')}
              title={language === 'bn' ? 'Pie/Donut Chart (শতকরা অনুপাত ও শেয়ার)' : 'Donut Chart'}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                chartType === 'pie'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Donut</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="h-80 w-full">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              {renderChartContent()}
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full bg-slate-50 dark:bg-slate-800/40 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400 font-mono">
              Loading Chart...
            </div>
          )}
        </div>

        {/* Dynamic Metric Explanation Badge below the chart */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span>
              {selectedMetric === 'sales'
                ? language === 'bn'
                  ? 'কার্যদিবসের প্রতি ঘণ্টায় সংগৃহীত টাকা ও বিক্রির গতিপ্রকৃতি'
                  : 'Cumulative sales and cash/online collections across business hours'
                : selectedMetric === 'routes'
                ? language === 'bn'
                  ? 'বিভিন্ন বিশ্ববিদ্যালয় ভর্তি রুটে টিকিট বিক্রির পরিমাণ ও অর্জিত আয়'
                  : 'Ticket sales and total revenue across university transit routes'
                : selectedMetric === 'payments'
                ? language === 'bn'
                  ? 'ডিজিটাল গেটওয়ে (বিকাশ, নগদ, রকেট) এবং সরাসরি ক্যাশ কালেকশনের শতাংশ'
                  : 'Percentage share of digital channels vs direct cash transactions'
                : selectedMetric === 'demographics'
                ? language === 'bn'
                  ? 'ভর্তি পরীক্ষার্থী (ছাত্র/ছাত্রী) এবং সাথে আসা অভিভাবকদের অনুপাত'
                  : 'Distribution of male/female students and accompanying guardians'
                : language === 'bn'
                ? 'প্রতিটি বাসে বিক্রিত সিট এবং অবশিষ্ট খালি সিটের অনুপাত'
                : 'Sold seats versus remaining available seats per scheduled bus'}
            </span>
          </div>

          <Badge variant="primary" className="font-mono text-xs">
            {language === 'bn' ? 'রিয়েল-টাইম লাইভ ডাটা' : 'Real-time Live Sync'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  function renderChartContent() {
    if (chartType === 'area') {
      if (selectedMetric === 'sales') {
        return (
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="areaSalesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="areaCollectedGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `৳${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
              formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, '']}
            />
            <Area type="monotone" dataKey="sales" name={language === 'bn' ? 'মোট টিকিট বিক্রি' : 'Net Sales'} stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#areaSalesGrad)" />
            <Area type="monotone" dataKey="collected" name={language === 'bn' ? 'কালেকশন (আদায়)' : 'Collected'} stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#areaCollectedGrad)" />
          </AreaChart>
        );
      }

      return (
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <defs>
            <linearGradient id="genAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
          <Area type="monotone" dataKey={selectedMetric === 'routes' ? 'revenue' : (selectedMetric === 'occupancy' ? 'sold' : 'value')} stroke="#7c3aed" strokeWidth={2.5} fillOpacity={1} fill="url(#genAreaGrad)" />
        </AreaChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
          <XAxis dataKey={selectedMetric === 'sales' ? 'time' : 'name'} stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
          {selectedMetric === 'sales' ? (
            <>
              <Line type="monotone" dataKey="sales" name={language === 'bn' ? 'টিকিট বিক্রি' : 'Sales'} stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="collected" name={language === 'bn' ? 'আদায়' : 'Collected'} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </>
          ) : (
            <Line type="monotone" dataKey={selectedMetric === 'routes' ? 'revenue' : (selectedMetric === 'occupancy' ? 'sold' : 'value')} stroke="#2563eb" strokeWidth={3} dot={{ r: 5 }} />
          )}
        </LineChart>
      );
    }

    if (chartType === 'pie') {
      const pieData =
        selectedMetric === 'payments'
          ? chartData.map((d: any) => ({ name: d.name, value: d.value }))
          : selectedMetric === 'demographics'
          ? chartData
          : selectedMetric === 'routes'
          ? chartData.map((d: any) => ({ name: d.fullName || d.name, value: d.revenue }))
          : selectedMetric === 'occupancy'
          ? chartData.map((d: any) => ({ name: d.name, value: d.sold }))
          : chartData.map((d: any) => ({ name: d.time || d.name, value: d.sales || d.value }));

      return (
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={105}
            paddingAngle={4}
            dataKey="value"
          >
            {pieData.map((_: any, index: number) => (
              <Cell key={`pie-cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
            formatter={(value: any) => [`${Number(value).toLocaleString()}`, '']}
          />
        </PieChart>
      );
    }

    // Default: Bar Chart
    return (
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
        <XAxis
          dataKey={selectedMetric === 'sales' ? 'time' : 'name'}
          stroke="#94a3b8"
          fontSize={10}
          tickLine={false}
          interval={0}
        />
        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
          formatter={(value: any) => [`${Number(value).toLocaleString()}`, '']}
        />
        {selectedMetric === 'sales' ? (
          <>
            <Bar dataKey="sales" name={language === 'bn' ? 'বিক্রি' : 'Sales'} fill="#2563eb" radius={[6, 6, 0, 0]} />
            <Bar dataKey="collected" name={language === 'bn' ? 'আদায়' : 'Collected'} fill="#10b981" radius={[6, 6, 0, 0]} />
          </>
        ) : selectedMetric === 'occupancy' ? (
          <>
            <Bar dataKey="sold" name={language === 'bn' ? 'বুকড সিট' : 'Sold Seats'} fill="#2563eb" radius={[6, 6, 0, 0]} />
            <Bar dataKey="available" name={language === 'bn' ? 'খালি সিট' : 'Available'} fill="#10b981" radius={[6, 6, 0, 0]} />
          </>
        ) : (
          <Bar dataKey={selectedMetric === 'routes' ? 'revenue' : 'value'} radius={[6, 6, 0, 0]}>
            {chartData.map((_: any, index: number) => (
              <Cell key={`bar-cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        )}
      </BarChart>
    );
  }
}
