import { prisma } from '@/lib/db';
import { logAudit } from './audit.service';

export interface LayoutGridCell {
  type: 'SEAT' | 'AISLE' | 'DOOR' | 'DRIVER' | 'EMPTY' | 'STAIRS';
  label?: string; // e.g. "A1", "A2", "Door", "Driver"
  seatType?: 'STANDARD' | 'VIP' | 'STAFF' | 'RESERVED' | 'EMERGENCY' | 'DISABLED';
  genderAllowed?: 'MALE_ONLY' | 'FEMALE_ONLY' | 'ANY';
  fareZoneId?: string;
  baseFare?: number;
}

export interface CustomLayoutInput {
  id?: string;
  name: string;
  description?: string;
  totalRows: number;
  totalCols: number;
  layoutGrid: LayoutGridCell[][]; // row x col matrix
  extraSeats?: any[];
}

export async function getAllLayouts() {
  return prisma.seatLayout.findMany({
    include: {
      seats: {
        include: { fareZone: true }
      },
      buses: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getLayoutById(id: string) {
  return prisma.seatLayout.findUnique({
    where: { id },
    include: {
      seats: {
        include: { fareZone: true },
        orderBy: [{ rowIndex: 'asc' }, { colIndex: 'asc' }]
      },
      buses: true
    }
  });
}

export async function getAllFareZones() {
  return prisma.fareZone.findMany({
    orderBy: { defaultFare: 'desc' }
  });
}

export async function createFareZone(data: { name: string; description?: string; defaultFare: number }, userId?: string) {
  const zone = await prisma.fareZone.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim(),
      defaultFare: data.defaultFare
    }
  });

  if (userId) {
    await logAudit({
      userId,
      action: 'FARE_ZONE_CREATED',
      entity: 'FareZone',
      entityId: zone.id,
      newValue: zone
    });
  }

  return zone;
}

export async function updateFareZone(id: string, data: { name?: string; description?: string; defaultFare?: number }, userId?: string) {
  const existing = await prisma.fareZone.findUnique({ where: { id } });
  if (!existing) throw new Error('Fare zone not found');

  const zone = await prisma.fareZone.update({
    where: { id },
    data: {
      name: data.name !== undefined ? data.name.trim() : undefined,
      description: data.description !== undefined ? data.description?.trim() : undefined,
      defaultFare: data.defaultFare !== undefined ? data.defaultFare : undefined
    }
  });

  if (userId) {
    await logAudit({
      userId,
      action: 'FARE_ZONE_UPDATED',
      entity: 'FareZone',
      entityId: zone.id,
      previousValue: existing,
      newValue: zone
    });
  }

  return zone;
}

export async function deleteFareZone(id: string, userId?: string) {
  const existing = await prisma.fareZone.findUnique({ where: { id } });
  if (!existing) throw new Error('Fare zone not found');

  await prisma.fareZone.delete({ where: { id } });

  if (userId) {
    await logAudit({
      userId,
      action: 'FARE_ZONE_DELETED',
      entity: 'FareZone',
      entityId: id,
      previousValue: existing
    });
  }

  return { success: true };
}

export async function deleteSeatLayout(id: string, userId?: string) {
  const existing = await prisma.seatLayout.findUnique({ where: { id } });
  if (!existing) throw new Error('Seat layout not found');

  await prisma.seat.deleteMany({ where: { seatLayoutId: id } });
  await prisma.seatLayout.delete({ where: { id } });

  if (userId) {
    await logAudit({
      userId,
      action: 'SEAT_LAYOUT_DELETED',
      entity: 'SeatLayout',
      entityId: id,
      previousValue: existing
    });
  }

  return { success: true };
}

export async function createCustomLayout(input: CustomLayoutInput, userId?: string) {
  // 1. Calculate actual seats
  const seatCells: { cell: LayoutGridCell; r: number; c: number }[] = [];
  for (let r = 0; r < input.layoutGrid.length; r++) {
    for (let c = 0; c < input.layoutGrid[r].length; c++) {
      const cell = input.layoutGrid[r][c];
      if (cell.type === 'SEAT' && cell.label) {
        seatCells.push({ cell, r, c });
      }
    }
  }

  const layoutJsonStr = JSON.stringify({
    grid: input.layoutGrid,
    extraSeats: input.extraSeats || [],
    totalRows: input.totalRows,
    totalCols: input.totalCols
  });

  let layout;
  if (input.id) {
    const existing = await prisma.seatLayout.findUnique({ where: { id: input.id } });
    if (existing) {
      // Delete existing seats to replace with updated layout
      await prisma.seat.deleteMany({ where: { seatLayoutId: input.id } });
      layout = await prisma.seatLayout.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          totalRows: input.totalRows,
          totalCols: input.totalCols,
          totalSeats: seatCells.length + (input.extraSeats?.length || 0),
          layoutJson: layoutJsonStr
        }
      });
    }
  }

  if (!layout) {
    layout = await prisma.seatLayout.create({
      data: {
        name: input.name,
        description: input.description,
        totalRows: input.totalRows,
        totalCols: input.totalCols,
        totalSeats: seatCells.length + (input.extraSeats?.length || 0),
        layoutJson: layoutJsonStr
      }
    });
  }

  // 3. Create individual Seat records
  for (const { cell, r, c } of seatCells) {
    await prisma.seat.create({
      data: {
        seatLayoutId: layout.id,
        seatNumber: cell.label || `S-${r+1}-${c+1}`,
        rowIndex: r,
        colIndex: c,
        seatType: cell.seatType || 'STANDARD',
        genderAllowed: cell.genderAllowed || 'ANY',
        fareZoneId: cell.fareZoneId || null,
        baseFare: cell.baseFare || 500.0
      }
    });
  }

  if (userId) {
    await logAudit({
      userId,
      action: input.id ? 'SEAT_LAYOUT_UPDATED' : 'SEAT_LAYOUT_CREATED',
      entity: 'SeatLayout',
      entityId: layout.id,
      newValue: { name: layout.name, totalSeats: layout.totalSeats }
    });
  }

  return getLayoutById(layout.id);
}
