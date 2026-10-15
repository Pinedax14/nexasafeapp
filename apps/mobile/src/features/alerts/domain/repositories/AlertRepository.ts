import { Alert } from '../entities/Alert';

export type AlertFailureReason =
  | 'FORBIDDEN'
  | 'NOT_ACTIVE'
  | 'RATE_LIMITED'
  | 'INVALID_PIN'
  | 'LOCKED'
  | 'NOT_CANCELLABLE'
  | 'NETWORK'
  | 'UNKNOWN';

export type AlertResult<T> = { ok: true; value: T } | { ok: false; reason: AlertFailureReason };

export interface AlertRepository {
  /** Crea la alerta con la hora del servidor; si ya hay una activa, devuelve esa. */
  trigger(): Promise<AlertResult<Alert>>;
  /** El PIN se verifica solo en la Edge Function auth-pin (D23). */
  cancel(alertId: string, pin: string): Promise<AlertResult<void>>;
  /** Alerta ENVIADA o ATENDIDA del propio menor, o null. */
  active(): Promise<AlertResult<Alert | null>>;
}
