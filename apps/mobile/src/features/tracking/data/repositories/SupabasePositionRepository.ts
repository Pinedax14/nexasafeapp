import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../../core/api/database.types';
import { LivePosition, Position, PositionReport } from '../../domain/entities/Position';
import { LiveHandlers, PositionRepository } from '../../domain/repositories/PositionRepository';
import { TripFailureReason, TripResult } from '../../domain/repositories/TripRepository';

export type PositionClient = Pick<
  SupabaseClient<Database>,
  'rpc' | 'channel' | 'removeChannel' | 'realtime'
>;

type ErrorLike = { code?: string; message?: string } | null;
type LivePayload = { lat?: unknown; lng?: unknown; precision_m?: unknown; recibida_en?: unknown };

function failure(error: ErrorLike): TripFailureReason {
  if (error?.code === '42501') return 'FORBIDDEN';
  if (error?.code === 'NX409') return 'NOT_ACTIVE';
  const message = error?.message ?? '';
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Canal privado de Realtime del menor (D20). */
export const liveChannel = (protegidoId: string) => `protegido:${protegidoId}`;

function toLive(payload: LivePayload): LivePosition | null {
  if (!isNumber(payload.lat) || !isNumber(payload.lng) || !isNumber(payload.precision_m)) {
    return null;
  }
  return {
    latitude: payload.lat,
    longitude: payload.lng,
    accuracyMeters: payload.precision_m,
    receivedAt: typeof payload.recibida_en === 'string' ? payload.recibida_en : '',
  };
}

export class SupabasePositionRepository implements PositionRepository {
  constructor(private readonly client: PositionClient) {}

  async send(position: Position): Promise<TripResult<PositionReport>> {
    const { data, error } = await this.client.rpc('registrar_posicion', {
      p_lat: position.latitude,
      p_lng: position.longitude,
      p_precision_m: position.accuracyMeters,
      p_capturada_en: position.capturedAt,
    });
    const row = Array.isArray(data) ? data[0] : undefined;
    if (error || !row) return { ok: false, reason: failure(error) };
    return {
      ok: true,
      value: {
        accepted: row.aceptada,
        tripActive: row.trayecto_activo,
        alertActive: row.alerta_activa,
        tripClosed: row.trayecto_cerrado,
      },
    };
  }

  async latest(protegidoId: string): Promise<TripResult<LivePosition | null>> {
    const { data, error } = await this.client.rpc('obtener_ultima_posicion', {
      p_protegido_id: protegidoId,
    });
    if (error || !Array.isArray(data)) return { ok: false, reason: failure(error) };
    const row = data[0];
    return {
      ok: true,
      value: row
        ? {
            latitude: row.lat,
            longitude: row.lng,
            accuracyMeters: row.precision_m,
            receivedAt: row.recibida_en,
          }
        : null,
    };
  }

  subscribe(protegidoId: string, handlers: LiveHandlers): () => void {
    const channel = this.client.channel(liveChannel(protegidoId), { config: { private: true } });
    channel
      .on('broadcast', { event: 'posicion' }, ({ payload }) => {
        const position = toLive((payload ?? {}) as LivePayload);
        if (position) handlers.onPosition(position);
      })
      .on('broadcast', { event: 'trayecto' }, ({ payload }) => {
        if ((payload as { estado?: unknown } | undefined)?.estado === 'CERRADO') {
          handlers.onTripClosed();
        }
      });
    // Los canales privados necesitan el token de la sesión antes de suscribirse.
    this.client.realtime.setAuth().then(() => channel.subscribe());
    return () => {
      this.client.removeChannel(channel);
    };
  }
}
