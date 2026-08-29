'use client';

// Re-export for backward compatibility with the new structured BangladeshRouteMap
export {
  BangladeshRouteMap,
  BangladeshMap,
  CITIES,
  BUS_ROUTES,
  getCityById,
  getRoutePath,
} from '@/components/home/bangladesh-route-map';

export type {
  BangladeshRouteMapProps,
  CityPoint,
  BusRoute,
} from '@/components/home/bangladesh-route-map';
