import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../../core/api/database.types';
import { Trip } from '../../domain/entities/Trip';
import {
  TripFailureReason,
  TripRepository,
  TripResult,
} from '../../domain/repositories/TripRepository';

export type TripClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'>;

type ErrorLike = { code?: string; message?: string } | null;
type TripRow = Pick<
  Database['public']['Tables']['trayectos']['Row'],
  'id' | 'protegido_id' | 'ruta_id' | 'inicio_en' | 'estado'
>;

function failure(error: ErrorLike): TripFailureReason {
  const message = error?.message ?? '';
  if (error?.code === '42501') return 'FORBIDDEN';
  if (error?.code === 'P0001')
    return message.includes('en curso') ? 'ALREADY_ACTIVE' : 'NOT_ACTIVE';
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

const toTrip = (row: TripRow): Trip => ({
  id: row.id,
  protegidoId: row.protegido_id,
  routeId: row.ruta_id,
  startedAt: row.inicio_en,
  status: row.estado,
});

export class SupabaseTripRepository implements TripRepository {
  constructor(private readonly client: TripClient) {}

  async listActive(): Promise<TripResult<Trip[]>> {
    const { data, error } = await this.client
      .from('trayectos')
      .select('id, protegido_id, ruta_id, inicio_en, estado')
      .eq('estado', 'EN_CURSO');
    if (error || !data) return { ok: false, reason: failure(error) };
    return { ok: true, value: data.map(toTrip) };
  }

  async start(routeId: string): Promise<TripResult<string>> {
    const { data, error } = await this.client.rpc('iniciar_trayecto', { p_ruta_id: routeId });
    if (error || typeof data !== 'string') return { ok: false, reason: failure(error) };
    return { ok: true, value: data };
  }
}
