import { Route } from '../entities/Route';

/** E3-01b (D11): copia local de las rutas para verlas sin conexión. */
export interface RouteCache {
  load(protegidoId: string): Promise<Route[] | null>;
  /** Reemplaza la copia anterior del menor. */
  save(protegidoId: string, routes: Route[]): Promise<void>;
  /** Se llama al cerrar sesión. */
  clear(): Promise<void>;
}
