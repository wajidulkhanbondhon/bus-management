'use server';

import { createBus, createRoute, updateBus, deleteBus, CreateBusInput } from '@/services/bus.service';
import {
  createCustomLayout,
  createFareZone,
  updateFareZone,
  deleteFareZone,
  deleteSeatLayout,
  CustomLayoutInput
} from '@/services/seat-layout.service';
import { getCurrentUser, requirePermission } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

function safeRevalidatePath(path: string, type?: 'page' | 'layout') {
  try {
    revalidatePath(path, type);
  } catch {
    // Ignore static generation context error in Server Actions
  }
}

export async function createBusAction(data: CreateBusInput) {
  try {
    const user = await requirePermission('bus_trip:manage');
    const bus = await createBus(data, user.id);
    safeRevalidatePath('/');
    safeRevalidatePath('/buses');
    safeRevalidatePath('/buses/create');
    safeRevalidatePath('/trips');
    safeRevalidatePath('/trips/create');
    safeRevalidatePath('/dashboard');
    return { success: true, bus };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create bus' };
  }
}

export async function updateBusAction(id: string, data: Partial<CreateBusInput>) {
  try {
    const user = await requirePermission('bus_trip:manage');
    const bus = await updateBus(id, data, user.id);
    safeRevalidatePath('/buses');
    safeRevalidatePath('/dashboard');
    return { success: true, bus };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update bus' };
  }
}

export async function deleteBusAction(id: string) {
  try {
    const user = await requirePermission('bus_trip:manage');
    await deleteBus(id, user.id);
    safeRevalidatePath('/buses');
    safeRevalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete bus' };
  }
}

export async function createCustomLayoutAction(input: CustomLayoutInput): Promise<{ success: boolean; layout?: any; error?: string }> {
  try {
    const user = await requirePermission('bus_trip:manage');
    const layout = await createCustomLayout(input, user.id);
    safeRevalidatePath('/buses/seat-builder');
    safeRevalidatePath('/buses');
    safeRevalidatePath('/buses/create');
    safeRevalidatePath('/trips/create');
    safeRevalidatePath('/bookings/new');
    return { success: true, layout };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save seat layout' };
  }
}

export async function deleteSeatLayoutAction(id: string) {
  try {
    const user = await requirePermission('bus_trip:manage');
    await deleteSeatLayout(id, user.id);
    safeRevalidatePath('/buses/seat-builder');
    safeRevalidatePath('/buses');
    safeRevalidatePath('/buses/create');
    safeRevalidatePath('/trips/create');
    safeRevalidatePath('/bookings/new');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete layout' };
  }
}

export async function createFareZoneAction(data: { name: string; description?: string; defaultFare: number }) {
  try {
    const user = await requirePermission('bus_trip:manage');
    const zone = await createFareZone(data, user.id);
    safeRevalidatePath('/buses/seat-builder');
    return { success: true, zone };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create fare zone' };
  }
}

export async function updateFareZoneAction(id: string, data: { name?: string; description?: string; defaultFare?: number }) {
  try {
    const user = await requirePermission('bus_trip:manage');
    const zone = await updateFareZone(id, data, user.id);
    safeRevalidatePath('/buses/seat-builder');
    return { success: true, zone };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update fare zone' };
  }
}

export async function deleteFareZoneAction(id: string) {
  try {
    const user = await requirePermission('bus_trip:manage');
    await deleteFareZone(id, user.id);
    safeRevalidatePath('/buses/seat-builder');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete fare zone' };
  }
}

export async function createRouteAction(data: {
  routeName: string;
  origin: string;
  destination: string;
  distanceKm?: number;
  estDuration?: string;
}) {
  try {
    const user = await requirePermission('bus_trip:manage');
    const route = await createRoute(data, user.id);
    safeRevalidatePath('/trips/create');
    return { success: true, route };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to create route' };
  }
}
