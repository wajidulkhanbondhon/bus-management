export async function logAudit(data: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}) {
  return { success: true };
}

export async function getAuditLogs(filters?: any) {
  return [
    {
      id: 'audit-1',
      action: 'BOOKING_CREATED',
      entity: 'Booking',
      entityId: 'bk-1',
      previousValue: null,
      newValue: 'Booking created with 1 seat (A1)',
      ipAddress: '127.0.0.1',
      createdAt: new Date(),
      user: { fullName: 'Rahim Chowdhury (Desk Officer)', role: { name: 'BOOKING_STAFF' } }
    }
  ];
}
