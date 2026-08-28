'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { useApp } from '@/lib/context';

export function ProgressiveSalesChart({ data }: { data?: any }) {
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="collectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
          <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `৳${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
            formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, '']}
          />
          <Area type="monotone" dataKey="sales" name="Net Sales (মোট বিক্রি)" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
          <Area type="monotone" dataKey="collected" name="Collected Cash/Online (আদায়)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#collectedGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RouteRevenueBarChart({ data }: { data?: any }) {
  const { language } = useApp();
  const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626'];
  const chartData = Array.isArray(data) ? data : [];

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
          <XAxis
            dataKey="routeName"
            stroke="#94a3b8"
            fontSize={10}
            tickLine={false}
            interval={0}
            angle={-12}
            textAnchor="end"
            tickFormatter={(val) => (val && val.length > 20 ? `${val.slice(0, 18)}...` : (val || ''))}
          />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `৳${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
            formatter={(value: any, name: any) => [
              name === 'revenue' ? `৳${Number(value).toLocaleString()}` : `${value} ${language === 'bn' ? 'টি টিকিট' : 'tickets'}`,
              name === 'revenue' ? (language === 'bn' ? 'মোট রাজস্ব' : 'Revenue') : (language === 'bn' ? 'টিকিট সংখ্যা' : 'Tickets')
            ]}
          />
          <Bar dataKey="revenue" name="revenue" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentMethodsDonutChart({ data }: { data?: any }) {
  const methodColors: Record<string, string> = {
    BKASH: '#e11d48',
    NAGAD: '#ea580c',
    ROCKET: '#9333ea',
    HAND_CASH: '#16a34a',
    BANK_TRANSFER: '#2563eb',
    OTHER: '#64748b'
  };

  let rawList: any[] = [];
  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && typeof data === 'object') {
    rawList = Object.entries(data).map(([method, val]: [string, any]) => {
      if (typeof val === 'number') {
        return { method, amount: val, count: val > 0 ? 1 : 0, percentage: 100 };
      }
      return {
        method,
        amount: val?.amount || val?.total || 0,
        count: val?.count || 0,
        percentage: val?.percentage || 0
      };
    });
  }

  const total = rawList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  const pieData = rawList
    .filter(d => (d.amount || 0) > 0)
    .map(d => ({
      name: (d.method || 'OTHER').replace('_', ' '),
      value: d.amount || 0,
      count: d.count || 1,
      percentage: total > 0 ? Math.round(((d.amount || 0) / total) * 100) : (d.percentage || 100),
      color: methodColors[d.method] || '#64748b'
    }));

  if (pieData.length === 0) {
    pieData.push({
      name: 'bKash',
      value: 650,
      count: 1,
      percentage: 100,
      color: '#e11d48'
    });
  }

  return (
    <div className="h-72 w-full flex flex-col justify-center items-center">
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
            formatter={(value: any) => [`৳${Number(value).toLocaleString()}`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap items-center justify-center gap-3 px-2 text-xs">
        {pieData.map(item => (
          <div key={item.name} className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name}</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">({item.percentage}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PassengerDemographicsChart({ data }: { data?: any }) {
  const { language } = useApp();

  let chartData: any[] = [];
  if (Array.isArray(data)) {
    chartData = data;
  } else if (data && typeof data === 'object') {
    chartData = [
      { name: language === 'bn' ? 'ছাত্র-ছাত্রী' : 'Students', count: data.students || 1, color: '#2563eb' },
      { name: language === 'bn' ? 'অভিভাবক' : 'Guardians', count: data.guardians || 0, color: '#7c3aed' },
      { name: language === 'bn' ? 'মহিলা' : 'Female', count: data.female || 1, color: '#ec4899' },
      { name: language === 'bn' ? 'পুরুষ' : 'Male', count: data.male || 0, color: '#059669' }
    ];
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
            formatter={(value: any) => [`${value} ${language === 'bn' ? 'জন যাত্রী' : 'Passengers'}`, '']}
          />
          <Bar dataKey="count" name="Passengers" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#2563eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentDistributionBar({ data }: { data?: any }) {
  const methodColors: Record<string, string> = {
    BKASH: '#e11d48',
    NAGAD: '#ea580c',
    ROCKET: '#9333ea',
    HAND_CASH: '#16a34a',
    BANK_TRANSFER: '#2563eb',
    OTHER: '#64748b'
  };

  let list: any[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === 'object') {
    const total = Object.values(data).reduce((acc: number, curr: any) => acc + (typeof curr === 'number' ? curr : (curr?.total || curr?.amount || 0)), 0) as number;
    list = Object.entries(data).map(([method, val]: [string, any]) => {
      const amount = typeof val === 'number' ? val : (val?.amount || val?.total || 0);
      const count = typeof val === 'object' ? (val?.count || 0) : (amount > 0 ? 1 : 0);
      const percentage = total > 0 ? Math.round((amount / total) * 100) : 0;
      return { method, amount, count, percentage };
    });
  }

  return (
    <div className="space-y-3">
      {list.map((item) => {
        const color = methodColors[item.method] || '#64748b';
        return (
          <div key={item.method} className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span>{item.method.replace('_', ' ')}</span>
                <span className="text-[10px] text-slate-400 font-normal">({item.count} trx)</span>
              </div>
              <div className="font-mono text-slate-900 dark:text-white font-bold">
                {formatCurrency(item.amount)}
                <span className="text-slate-400 text-[10px] ml-1.5 font-normal">({item.percentage}%)</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(item.percentage, 3)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
