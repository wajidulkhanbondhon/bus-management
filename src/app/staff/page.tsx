import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { prisma } from '@/lib/db';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { Users, Shield, Lock, BadgePercent, Check } from 'lucide-react';

export const revalidate = 0;

export default async function StaffPage() {
  const [users, roles] = await Promise.all([
    prisma.user.findMany({
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } }
          }
        },
        _count: {
          select: { createdBookings: true, receivedPayments: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.role.findMany({
      include: {
        permissions: { include: { permission: true } }
      }
    })
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Access Governance</Badge>
          <span className="text-xs font-mono text-slate-500">ROLE-BASED ACCESS CONTROL (RBAC)</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Staff Accounts & Permissions</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Role-Based Access Control matrix, discount authorization ceilings, and staff audit counters.
        </p>
      </div>

      {/* Staff Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Staff Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">Staff Name & Email</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Contact Phone</th>
                <th className="px-4 py-3 text-right">Discount Limit</th>
                <th className="px-4 py-3 text-center">Bookings Created</th>
                <th className="px-4 py-3 text-center">Payments Collected</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <div className="font-bold text-slate-900">{u.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={u.role.name === 'SUPER_ADMIN' ? 'purple' : (u.role.name === 'ACCOUNTANT' ? 'warning' : 'primary')}>
                      {u.role.name}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-600">{u.phone || '—'}</td>
                  <td className="px-4 py-4 text-right font-mono font-bold text-blue-600">
                    {u.discountLimit >= 99999 ? 'Unlimited' : `৳${u.discountLimit}`}
                  </td>
                  <td className="px-4 py-4 text-center font-mono font-semibold">{u._count.createdBookings}</td>
                  <td className="px-4 py-4 text-center font-mono font-semibold">{u._count.receivedPayments}</td>
                  <td className="px-5 py-4 text-center">
                    <Badge variant="success">Active</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Role Permission Matrix Card */}
      <Card>
        <CardHeader>
          <CardTitle>Role Permission Capabilities Matrix</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div key={r.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-900 text-xs font-mono">{r.name}</span>
                  <Badge variant="primary">{r.permissions.length} Perms</Badge>
                </div>
                <p className="text-[11px] text-slate-500">{r.description || 'System operational role'}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {r.permissions.slice(0, 5).map((p) => (
                    <span key={p.id} className="px-1.5 py-0.5 bg-white border border-slate-200 text-slate-600 rounded text-[9px] font-mono">
                      {p.permission.code}
                    </span>
                  ))}
                  {r.permissions.length > 5 && (
                    <span className="text-[9px] text-slate-400 font-mono">+{r.permissions.length - 5} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
