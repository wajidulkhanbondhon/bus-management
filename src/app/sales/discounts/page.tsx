import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export const revalidate = 0;

export default async function DiscountsPage() {
  const discounts: any[] = [];


  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Audit Log</Badge>
          <span className="text-xs font-mono text-slate-500">DISCOUNT & CONCESSION REGISTER</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Concessions & Discount Approvals</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Complete audit trail of all applied discounts, reason statements, and supervising approvers.
        </p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Booking #</th>
                <th className="px-4 py-3">Student / Passenger</th>
                <th className="px-4 py-3">Discount Reason</th>
                <th className="px-4 py-3 text-right">Amount (BDT)</th>
                <th className="px-4 py-3">Applied By</th>
                <th className="px-4 py-3">Approval Status</th>
                <th className="px-5 py-3 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4 font-mono font-bold text-blue-600">
                    {d.booking.bookingNumber}
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-bold text-slate-900 block">{d.booking.passengers[0]?.passengerName || 'Student'}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{d.booking.passengers[0]?.passengerPhone}</span>
                  </td>
                  <td className="px-4 py-4 max-w-xs font-semibold text-slate-800">
                    {d.reason}
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-purple-700">
                    {formatCurrency(d.discountAmount)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-slate-900 block">{d.appliedBy.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{d.appliedBy.role.name}</span>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={d.approvals[0]?.status === 'APPROVED' ? 'success' : 'warning'}>
                      {d.approvals[0]?.status || 'AUTO-APPROVED'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-slate-400">
                    {formatDateTime(d.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
