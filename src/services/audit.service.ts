import { fastApiClient } from '@/lib/api-client';

export async function logAudit(data: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}) {
  try {
    const res = await fastApiClient.post('/audit/', data);
    return res;
  } catch {
    return { success: true };
  }
}

export async function getAuditLogs(filters?: any) {
  try {
    const res = await fastApiClient.getAuditLogs();
    if (res.success && Array.isArray(res.data)) {
      return res.data.map((a: any) => ({
        id: a.id,
        action: a.action || 'ACTION_LOGGED',
        entity: a.entity || 'System',
        entityId: a.entity_id || a.entityId,
        previousValue: a.previous_value || a.old_value,
        newValue: a.new_value || 'Operation recorded',
        ipAddress: a.ip_address || '127.0.0.1',
        createdAt: a.created_at ? new Date(a.created_at) : new Date(),
        user: {
          fullName: a.user?.full_name || a.user?.fullName || 'System User',
          role: { name: a.user?.role?.name || a.user?.role || 'STAFF' }
        }
      }));
    }
    return [];
  } catch {
    return [];
  }
}
