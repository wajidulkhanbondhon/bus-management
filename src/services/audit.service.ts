import { prisma } from '@/lib/db';

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(params: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        previousValue: params.previousValue ? JSON.stringify(params.previousValue) : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        ipAddress: params.ipAddress || '127.0.0.1',
        userAgent: params.userAgent || 'ATOMS Internal Server Engine'
      }
    });
  } catch (error) {
    console.error('Failed to write audit log entry:', error);
    return null;
  }
}

export async function getAuditLogs(filters?: {
  entity?: string;
  action?: string;
  userId?: string;
  limit?: number;
}) {
  const take = filters?.limit || 50;
  return prisma.auditLog.findMany({
    where: {
      entity: filters?.entity ? filters.entity : undefined,
      action: filters?.action ? filters.action : undefined,
      userId: filters?.userId ? filters.userId : undefined,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: { select: { name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take
  });
}
