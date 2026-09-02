import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAuditLogs } from '@/services/audit.service';
import { formatDateTime } from '@/lib/utils';
import { ShieldCheck, User, Terminal } from 'lucide-react';

export const revalidate = 0;

export default async function AuditLogsPage({
  searchParams
}: {
  searchParams: Promise<{ entity?: string; action?: string }>
}) {
  const params = await searchParams;
  const logs = await getAuditLogs({
    entity: params.entity,
    action: params.action,
    limit: 100
  });

  return (
    <div className="space-y-6 w-full">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="primary">Security & Traceability</Badge>
          <span className="text-xs font-mono text-slate-500">IMMUTABLE SYSTEM EVENT LOG</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">Audit Logs & Activity Timeline</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable forensic log of all bookings, seat locks, discount approvals, payment collections, and day closing events.
        </p>
      </div>

      {/* Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0 overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              বর্তমানে কোনো অডিট লগ রেকর্ড নেই।
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-mono text-[11px] uppercase">
                <tr>
                  <th className="px-5 py-3.5">Action Event</th>
                  <th className="px-4 py-3.5">Entity</th>
                  <th className="px-4 py-3.5">Actor (Staff)</th>
                  <th className="px-4 py-3.5">Snapshot / Diff Payload</th>
                  <th className="px-4 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 font-mono">
                    <td className="px-5 py-4">
                      <Badge variant={
                        log.action.includes('CREATED') ? 'primary' :
                        log.action.includes('APPROVED') ? 'success' :
                        log.action.includes('LOCKED') ? 'warning' :
                        log.action.includes('CANCELLED') ? 'danger' : 'default'
                      }>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-slate-900 font-bold font-sans">
                      {log.entity} <span className="text-[10px] text-slate-400 font-mono">({(log.entityId || '').slice(0, 8)}...)</span>
                    </td>
                    <td className="px-4 py-4 font-sans">
                      <span className="font-semibold text-slate-900 block">{log.user?.fullName || 'System Automated'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{log.user?.role?.name || 'SYSTEM'}</span>
                    </td>
                    <td className="px-4 py-4 max-w-sm truncate text-[11px] text-slate-600 font-mono bg-slate-50/80 p-2 rounded">
                      {log.newValue || log.previousValue || '—'}
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-[11px]">{log.ipAddress}</td>
                    <td className="px-5 py-4 text-right text-slate-500 font-normal">
                      {formatDateTime(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Mobile Card View (md:hidden) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            কোনো অডিট লগ নেই।
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant={
                    log.action.includes('CREATED') ? 'primary' :
                    log.action.includes('APPROVED') ? 'success' :
                    log.action.includes('LOCKED') ? 'warning' :
                    log.action.includes('CANCELLED') ? 'danger' : 'default'
                  } className="text-[10px]">
                    {log.action}
                  </Badge>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block mt-1">
                    {log.entity}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-[11px]">
                {log.newValue || log.previousValue || 'Event logged'}
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>{log.user?.fullName || 'System'}</span>
                <span className="font-mono text-[10px] text-slate-400">{log.ipAddress}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
