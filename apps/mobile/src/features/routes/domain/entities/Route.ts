/** D12: hasta 2 rutas por menor, una por sentido. */
export type RouteDirection = 'CASA_COLEGIO' | 'COLEGIO_CASA';

export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type Route = {
  id: string;
  direction: RouteDirection;
  points: GeoPoint[];
  corridorMeters: number;
  expectedMinutes: number;
  updatedAt: string;
};

export type RouteDraft = {
  direction: RouteDirection;
  points: GeoPoint[];
  corridorMeters: number;
  expectedMinutes: number;
};

export const ROUTE_DIRECTIONS: RouteDirection[] = ['CASA_COLEGIO', 'COLEGIO_CASA'];
