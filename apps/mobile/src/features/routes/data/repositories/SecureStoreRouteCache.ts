import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  createSecureSessionStorage,
  SessionStorage,
} from '../../../../core/storage/secureSessionStorage';
import { Route, ROUTE_DIRECTIONS } from '../../domain/entities/Route';
import { RouteCache } from '../../domain/repositories/RouteCache';

/** Clave única: todas las rutas en caché, agrupadas por menor. */
export const ROUTE_CACHE_KEY = 'nexasafe-rutas';

type CacheContent = Record<string, Route[]>;

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

function isRoute(value: unknown): value is Route {
  const route = value as Partial<Route> | null;
  return (
    !!route &&
    typeof route.id === 'string' &&
    ROUTE_DIRECTIONS.includes(route.direction as Route['direction']) &&
    Array.isArray(route.points) &&
    route.points.every((p) => isNumber(p?.latitude) && isNumber(p?.longitude)) &&
    isNumber(route.corridorMeters) &&
    isNumber(route.expectedMinutes) &&
    typeof route.updatedAt === 'string'
  );
}

/**
 * E3-01b (D11): las rutas se guardan cifradas con expo-secure-store (Keystore de
 * Android), partidas en trozos como la sesión (E1-05). Una copia dañada se ignora.
 */
export class SecureStoreRouteCache implements RouteCache {
  constructor(private readonly storage: SessionStorage) {}

  private async read(): Promise<CacheContent> {
    const raw = await this.storage.getItem(ROUTE_CACHE_KEY);
    if (!raw) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as CacheContent)
        : {};
    } catch {
      return {};
    }
  }

  async load(protegidoId: string): Promise<Route[] | null> {
    const routes = (await this.read())[protegidoId];
    return Array.isArray(routes) && routes.every(isRoute) ? routes : null;
  }

  async save(protegidoId: string, routes: Route[]): Promise<void> {
    const content = await this.read();
    content[protegidoId] = routes;
    await this.storage.setItem(ROUTE_CACHE_KEY, JSON.stringify(content));
  }

  clear(): Promise<void> {
    return this.storage.removeItem(ROUTE_CACHE_KEY);
  }
}

/** En el navegador no hay SecureStore: allí no se guarda caché (como la sesión). */
export function createRouteCache(): RouteCache | undefined {
  if (Platform.OS === 'web') return undefined;
  return new SecureStoreRouteCache(createSecureSessionStorage(SecureStore));
}
