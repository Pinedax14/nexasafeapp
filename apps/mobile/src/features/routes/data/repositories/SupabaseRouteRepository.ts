import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '../../../../core/api/database.types';
import { GeoPoint, Route, RouteDraft } from '../../domain/entities/Route';
import {
  RouteFailureReason,
  RouteRepository,
  RouteResult,
} from '../../domain/repositories/RouteRepository';

export type RouteClient = Pick<SupabaseClient<Database>, 'rpc'>;

type ErrorLike = { code?: string; message?: string } | null;
type RouteRow = Database['public']['Functions']['obtener_rutas']['Returns'][number];

function failure(error: ErrorLike): RouteFailureReason {
  if (error?.code === '42501') return 'FORBIDDEN';
  if (error?.code === 'P0001') return 'NOT_ACTIVE';
  if (error?.code === '22023') return 'INVALID_DATA';
  const message = error?.message ?? '';
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

/** GeoJSON guarda [longitud, latitud]. */
function toPoints(geojson: Json): GeoPoint[] | null {
  const coordinates = (geojson as { coordinates?: unknown } | null)?.coordinates;
  if (!Array.isArray(coordinates)) return null;
  const points: GeoPoint[] = [];
  for (const pair of coordinates) {
    if (!Array.isArray(pair) || typeof pair[0] !== 'number' || typeof pair[1] !== 'number') {
      return null;
    }
    points.push({ longitude: pair[0], latitude: pair[1] });
  }
  return points;
}

export function toLineString(points: GeoPoint[]): Json {
  return {
    type: 'LineString',
    coordinates: points.map((point) => [point.longitude, point.latitude]),
  };
}

function toRoute(row: RouteRow): Route | null {
  const points = toPoints(row.geojson);
  if (!points) return null;
  return {
    id: row.id,
    direction: row.sentido,
    points,
    corridorMeters: row.corredor_m,
    expectedMinutes: row.duracion_esperada_min,
    updatedAt: row.actualizado_en,
  };
}

export class SupabaseRouteRepository implements RouteRepository {
  constructor(private readonly client: RouteClient) {}

  async list(protegidoId: string): Promise<RouteResult<Route[]>> {
    const { data, error } = await this.client.rpc('obtener_rutas', {
      p_protegido_id: protegidoId,
    });
    if (error || !data) return { ok: false, reason: failure(error) };
    const routes = data.map(toRoute);
    if (routes.some((route) => route === null)) return { ok: false, reason: 'UNKNOWN' };
    return { ok: true, value: routes as Route[] };
  }

  async save(protegidoId: string, draft: RouteDraft): Promise<RouteResult<string>> {
    const { data, error } = await this.client.rpc('guardar_ruta', {
      p_protegido_id: protegidoId,
      p_sentido: draft.direction,
      p_geojson: toLineString(draft.points),
      p_corredor_m: draft.corridorMeters,
      p_duracion_min: draft.expectedMinutes,
    });
    if (error || typeof data !== 'string') return { ok: false, reason: failure(error) };
    return { ok: true, value: data };
  }
}
