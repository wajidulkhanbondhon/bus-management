import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLiveDashboardData } from '@/services/dashboard.service';
import { formatCurrency } from '@/lib/utils';
import { ProgressiveSalesChart } from '@/components/dashboard/dashboard-charts';

export const revalidate = 0;

export default async function ProgressiveSalesPage() {
  const dashboard = await getLiveDashboardData();

  return (
    <div className="space-y-6 w-full">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Progressive Telemetry</Badge>
          <span className="text-xs font-mono text-slate-500">HOURLY CUMULATIVE REVENUE</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Live Progressive Sales Stream</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time hour-by-hour cumulative intake tracking to evaluate peak admission desk hours.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cumulative Sales Curve (Dhaka Business Day)</CardTitle>
        </CardHeader>
        <CardContent>
          <ProgressiveSalesChart data={dashboard.progressiveSales} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hourly Progression Matrix</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Time Window</th>
                <th className="px-4 py-3 text-center">Cumulative Bookings</th>
                <th className="px-4 py-3 text-right">Cumulative Net Sales</th>
                <th className="px-4 py-3 text-right">Cumulative Cash/Digital Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono font-medium text-slate-700">
              {dashboard.progressiveSales.map((slot) => (
                <tr key={slot.time} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-bold text-slate-900">{slot.time} (Dhaka)</td>
                  <td className="px-4 py-3.5 text-center text-blue-600 font-bold">{slot.bookings}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">{formatCurrency(slot.sales)}</td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-600">{formatCurrency(slot.collected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
