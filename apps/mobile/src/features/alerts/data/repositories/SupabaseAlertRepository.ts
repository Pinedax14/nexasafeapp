import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../../core/api/database.types';
import { Alert } from '../../domain/entities/Alert';
import {
  AlertFailureReason,
  AlertRepository,
  AlertResult,
} from '../../domain/repositories/AlertRepository';

export type AlertClient = Pick<SupabaseClient<Database>, 'from' | 'rpc' | 'functions'>;

type ErrorLike = { code?: string; message?: string } | null;
type AlertRow = {
  id: string;
  estado: Alert['status'];
  creada_en: string;
  cancelable_hasta: string;
};

const CANCEL_ERRORS: Record<string, AlertFailureReason> = {
  INVALID_PIN: 'INVALID_PIN',
  INVALID_INPUT: 'INVALID_PIN',
  LOCKED: 'LOCKED',
  NOT_CANCELLABLE: 'NOT_CANCELLABLE',
  NOT_FOUND: 'FORBIDDEN',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'FORBIDDEN',
};

function failure(error: ErrorLike): AlertFailureReason {
  if (error?.code === '42501') return 'FORBIDDEN';
  if (error?.code === 'P0001') return 'NOT_ACTIVE';
  if (error?.code === 'NX429') return 'RATE_LIMITED';
  const message = error?.message ?? '';
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

async function cancelFailure(error: {
  name?: string;
  context?: unknown;
}): Promise<AlertFailureReason> {
  if (error.name === 'FunctionsFetchError') return 'NETWORK';
  const context = error.context as { json?: () => Promise<{ error?: string }> } | undefined;
  try {
    const code = context?.json ? (await context.json()).error : undefined;
    return CANCEL_ERRORS[code ?? ''] ?? 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

const toAlert = (row: AlertRow): Alert => ({
  id: row.id,
  status: row.estado,
  createdAt: row.creada_en,
  cancellableUntil: row.cancelable_hasta,
});

export class SupabaseAlertRepository implements AlertRepository {
  constructor(private readonly client: AlertClient) {}

  async trigger(): Promise<AlertResult<Alert>> {
    const { data, error } = await this.client.rpc('disparar_alerta');
    const row = Array.isArray(data) ? data[0] : undefined;
    if (error || !row) return { ok: false, reason: failure(error) };
    return { ok: true, value: toAlert(row) };
  }

  async cancel(alertId: string, pin: string): Promise<AlertResult<void>> {
    const { error } = await this.client.functions.invoke('auth-pin', {
      body: { accion: 'cancelar_alerta', alerta_id: alertId, pin },
    });
    if (error) return { ok: false, reason: await cancelFailure(error) };
    return { ok: true, value: undefined };
  }

  async active(): Promise<AlertResult<Alert | null>> {
    const { data, error } = await this.client
      .from('alertas')
      .select('id, estado, creada_en, cancelable_hasta')
      .in('estado', ['ENVIADA', 'ATENDIDA'])
      .limit(1);
    if (error || !data) return { ok: false, reason: failure(error) };
    return { ok: true, value: data[0] ? toAlert(data[0]) : null };
  }
}
