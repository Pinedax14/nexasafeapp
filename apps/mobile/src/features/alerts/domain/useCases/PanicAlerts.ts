import { Alert } from '../entities/Alert';
import { AlertRepository, AlertResult } from '../repositories/AlertRepository';

/** RF-20: el botón se mantiene presionado 3 s para evitar toques accidentales. */
export const HOLD_TO_TRIGGER_MS = 3000;
const PIN_PATTERN = /^[0-9]{4}$/;

/** E6-01 y E6-03: el menor dispara la alerta y puede cancelarla con su PIN dentro de 10 s. */
export class PanicAlerts {
  constructor(private readonly repository: AlertRepository) {}

  trigger(): Promise<AlertResult<Alert>> {
    return this.repository.trigger();
  }

  active(): Promise<AlertResult<Alert | null>> {
    return this.repository.active();
  }

  /**
   * Momento local en que vence la ventana de cancelación. Usa la duración que dio el
   * servidor y la hora en que llegó la respuesta, para no depender del reloj del teléfono.
   */
  cancelDeadline(alert: Alert, receivedAt: Date): Date {
    const window = Date.parse(alert.cancellableUntil) - Date.parse(alert.createdAt);
    return new Date(receivedAt.getTime() + Math.max(0, window));
  }

  /** Segundos que quedan para cancelar, redondeados hacia arriba. */
  secondsLeft(deadline: Date, now: Date): number {
    return Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / 1000));
  }

  async cancel(alert: Alert, pin: string): Promise<AlertResult<void>> {
    if (!PIN_PATTERN.test(pin)) return { ok: false, reason: 'INVALID_PIN' };
    if (alert.status !== 'ENVIADA') return { ok: false, reason: 'NOT_CANCELLABLE' };
    return this.repository.cancel(alert.id, pin);
  }
}
