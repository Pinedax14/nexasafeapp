import { Route, RouteDraft } from '../entities/Route';

export type RouteFailureReason =
  'FORBIDDEN' | 'NOT_ACTIVE' | 'INVALID_DATA' | 'NETWORK' | 'UNKNOWN';

export type RouteResult<T> = { ok: true; value: T } | { ok: false; reason: RouteFailureReason };

export interface RouteRepository {
  /** Rutas del menor; el servidor registra la lectura en audit_log (D1). */
  list(protegidoId: string): Promise<RouteResult<Route[]>>;
  /** Crea o reemplaza la ruta de ese sentido (D12). */
  save(protegidoId: string, draft: RouteDraft): Promise<RouteResult<string>>;
}
