import { Trip } from '../entities/Trip';

export type TripFailureReason =
  'FORBIDDEN' | 'NOT_ACTIVE' | 'ALREADY_ACTIVE' | 'NETWORK' | 'UNKNOWN';

export type TripResult<T> = { ok: true; value: T } | { ok: false; reason: TripFailureReason };

export interface TripRepository {
  /** Trayectos EN_CURSO visibles para la sesión: el propio (protegido) o los de sus menores (guardián). */
  listActive(): Promise<TripResult<Trip[]>>;
  /** Crea el trayecto con la hora del servidor y devuelve su id. */
  start(routeId: string): Promise<TripResult<string>>;
}
