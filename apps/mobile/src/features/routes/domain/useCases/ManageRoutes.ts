import { GeoPoint, Route, RouteDraft } from '../entities/Route';
import { RouteRepository, RouteResult } from '../repositories/RouteRepository';

/** D10: rango del corredor y de la duración esperada. */
export const CORRIDOR_MIN_METERS = 25;
export const CORRIDOR_MAX_METERS = 200;
export const CORRIDOR_DEFAULT_METERS = 50;
export const CORRIDOR_STEP_METERS = 25;
export const DURATION_MIN_MINUTES = 5;
export const DURATION_MAX_MINUTES = 120;

/** D15: los mismos límites que valida el servidor en guardar_ruta. */
export const ROUTE_MIN_POINTS = 2;
export const ROUTE_MAX_POINTS = 200;
export const ROUTE_MAX_LENGTH_METERS = 30000;
const COLOMBIA = { minLatitude: -4.3, maxLatitude: 13.5, minLongitude: -82, maxLongitude: -66 };

const EARTH_RADIUS_METERS = 6371008.8;

export type RouteField = 'points' | 'corridor' | 'duration';
export type RouteErrors = Partial<Record<RouteField, string>>;

export type SaveRouteResult =
  RouteResult<string> | { ok: false; reason: 'INVALID_INPUT'; errors: RouteErrors };

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

export function routeLengthMeters(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += distanceMeters(points[i - 1], points[i]);
  return total;
}

export function isInsideColombia(point: GeoPoint): boolean {
  return (
    point.latitude >= COLOMBIA.minLatitude &&
    point.latitude <= COLOMBIA.maxLatitude &&
    point.longitude >= COLOMBIA.minLongitude &&
    point.longitude <= COLOMBIA.maxLongitude
  );
}

export function validateRoute(draft: RouteDraft): RouteErrors {
  const errors: RouteErrors = {};
  const { points } = draft;
  if (points.length < ROUTE_MIN_POINTS) {
    errors.points = 'Marca al menos 2 puntos en el mapa.';
  } else if (points.length > ROUTE_MAX_POINTS) {
    errors.points = `La ruta puede tener máximo ${ROUTE_MAX_POINTS} puntos.`;
  } else if (!points.every(isInsideColombia)) {
    errors.points = 'La ruta debe quedar dentro de Colombia.';
  } else if (routeLengthMeters(points) > ROUTE_MAX_LENGTH_METERS) {
    errors.points = 'La ruta no puede medir más de 30 km.';
  }

  if (
    !Number.isInteger(draft.corridorMeters) ||
    draft.corridorMeters < CORRIDOR_MIN_METERS ||
    draft.corridorMeters > CORRIDOR_MAX_METERS
  ) {
    errors.corridor = `El corredor va de ${CORRIDOR_MIN_METERS} a ${CORRIDOR_MAX_METERS} metros.`;
  }

  if (
    !Number.isInteger(draft.expectedMinutes) ||
    draft.expectedMinutes < DURATION_MIN_MINUTES ||
    draft.expectedMinutes > DURATION_MAX_MINUTES
  ) {
    errors.duration = `La duración va de ${DURATION_MIN_MINUTES} a ${DURATION_MAX_MINUTES} minutos.`;
  }
  return errors;
}

/** Sube o baja el corredor un paso, sin salir del rango de D10. */
export function stepCorridor(current: number, direction: 1 | -1): number {
  const next = current + direction * CORRIDOR_STEP_METERS;
  return Math.min(CORRIDOR_MAX_METERS, Math.max(CORRIDOR_MIN_METERS, next));
}

/** E3-01a, E3-02, E3-03: el guardián define las rutas de su menor. */
export class ManageRoutes {
  constructor(private readonly repository: RouteRepository) {}

  list(protegidoId: string): Promise<RouteResult<Route[]>> {
    return this.repository.list(protegidoId);
  }

  async save(protegidoId: string, draft: RouteDraft): Promise<SaveRouteResult> {
    const errors = validateRoute(draft);
    if (Object.keys(errors).length > 0) {
      return { ok: false, reason: 'INVALID_INPUT', errors };
    }
    return this.repository.save(protegidoId, draft);
  }
}
