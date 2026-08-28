import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2"></div>
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
        <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    </div>
  );
}
