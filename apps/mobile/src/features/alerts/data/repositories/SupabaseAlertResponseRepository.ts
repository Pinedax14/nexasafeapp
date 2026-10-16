import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../../core/api/database.types';
import {
  AlertSummary,
  Classification,
  DailyCount,
  DailyCountKey,
  IncidentEvent,
} from '../../domain/entities/AlertSummary';
import { AlertFailureReason, AlertResult } from '../../domain/repositories/AlertRepository';
import { AlertResponseRepository } from '../../domain/repositories/AlertResponseRepository';

export type AlertResponseClient = Pick<SupabaseClient<Database>, 'rpc'>;

type ErrorLike = { code?: string; message?: string } | null;
type Functions = Database['public']['Functions'];
type SummaryRow = Functions['listar_alertas']['Returns'][number];
type EventRow = Functions['obtener_bitacora']['Returns'][number];
type CountRow = Functions['resumen_alertas_colegio']['Returns'][number];

const COUNT_KEYS: DailyCountKey[] = [
  'FALSA_ALARMA',
  'SITUACION_RESUELTA',
  'REMITIDA_A_AUTORIDAD',
  'SIN_CERRAR',
];

function failure(error: ErrorLike): AlertFailureReason {
  if (error?.code === '42501') return 'FORBIDDEN';
  if (error?.code === 'P0001') return 'NOT_ACTIVE_ALERT';
  if (error?.code === '22023') return 'INVALID_DATA';
  const message = error?.message ?? '';
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

const toSummary = (row: SummaryRow): AlertSummary => ({
  id: row.id,
  protegidoId: row.protegido_id,
  childName: row.menor,
  status: row.estado,
  createdAt: row.creada_en,
  classification: row.clasificacion ?? null,
  closedAt: row.cerrada_en ?? null,
});

const toEvent = (row: EventRow): IncidentEvent => ({
  type: row.tipo_evento,
  actor: row.actor,
  detail: row.detalle ?? null,
  at: row.creado_en,
});

const toCount = (row: CountRow): DailyCount | null =>
  COUNT_KEYS.includes(row.clasificacion as DailyCountKey)
    ? { day: row.dia, classification: row.clasificacion as DailyCountKey, total: row.total }
    : null;

export class SupabaseAlertResponseRepository implements AlertResponseRepository {
  constructor(private readonly client: AlertResponseClient) {}

  async list(onlyActive: boolean): Promise<AlertResult<AlertSummary[]>> {
    const { data, error } = await this.client.rpc('listar_alertas', {
      p_solo_activas: onlyActive,
    });
    if (error || !Array.isArray(data)) return { ok: false, reason: failure(error) };
    return { ok: true, value: data.map(toSummary) };
  }

  async log(alertId: string): Promise<AlertResult<IncidentEvent[]>> {
    const { data, error } = await this.client.rpc('obtener_bitacora', { p_alerta_id: alertId });
    if (error || !Array.isArray(data)) return { ok: false, reason: failure(error) };
    return { ok: true, value: data.map(toEvent) };
  }

  async respond(alertId: string): Promise<AlertResult<void>> {
    const { error } = await this.client.rpc('responder_alerta', { p_alerta_id: alertId });
    if (error) return { ok: false, reason: failure(error) };
    return { ok: true, value: undefined };
  }

  async close(
    alertId: string,
    classification: Classification,
    note: string,
  ): Promise<AlertResult<void>> {
    const { error } = await this.client.rpc('cerrar_alerta', {
      p_alerta_id: alertId,
      p_clasificacion: classification,
      p_nota: note,
    });
    if (error) return { ok: false, reason: failure(error) };
    return { ok: true, value: undefined };
  }

  async summary(days: number): Promise<AlertResult<DailyCount[]>> {
    const { data, error } = await this.client.rpc('resumen_alertas_colegio', { p_dias: days });
    if (error || !Array.isArray(data)) return { ok: false, reason: failure(error) };
    return {
      ok: true,
      value: data.map(toCount).filter((count): count is DailyCount => count !== null),
    };
  }
}
