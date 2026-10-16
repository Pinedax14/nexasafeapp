import {
  AlertSummary,
  Classification,
  CLASSIFICATIONS,
  DailyCount,
  DailyCountKey,
  DayTotals,
  IncidentEvent,
  ResponderRole,
} from '../entities/AlertSummary';
import { AlertResult } from '../repositories/AlertRepository';
import { AlertResponseRepository } from '../repositories/AlertResponseRepository';

/** D29: nota opcional del cierre. */
export const MAX_NOTE_LENGTH = 280;
/** E8-01: días que muestra el gráfico del puesto de control. */
export const CHART_DAYS = 14;

const COUNT_KEYS: DailyCountKey[] = [...CLASSIFICATIONS, 'SIN_CERRAR'];
const DAY_MS = 24 * 60 * 60 * 1000;

const emptyTotals = (): Record<DailyCountKey, number> =>
  Object.fromEntries(COUNT_KEYS.map((key) => [key, 0])) as Record<DailyCountKey, number>;

/** Fecha local (yyyy-mm-dd) de un instante. */
function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export const isActive = (alert: Pick<AlertSummary, 'status'>) =>
  alert.status === 'ENVIADA' || alert.status === 'ATENDIDA';

/** E7-02, E9-02, E8-01, E9-01: guardián, contacto de apoyo y puesto de control atienden la alerta. */
export class RespondToAlerts {
  constructor(private readonly repository: AlertResponseRepository) {}

  list(onlyActive: boolean): Promise<AlertResult<AlertSummary[]>> {
    return this.repository.list(onlyActive);
  }

  log(alertId: string): Promise<AlertResult<IncidentEvent[]>> {
    return this.repository.log(alertId);
  }

  /** D28: responden el guardián y el contacto de apoyo. */
  canRespond(role: ResponderRole, alert: AlertSummary): boolean {
    return isActive(alert) && (role === 'guardian' || role === 'apoyo');
  }

  /** D29: cierran el guardián y el personal del colegio. */
  canClose(role: ResponderRole, alert: AlertSummary): boolean {
    return isActive(alert) && (role === 'guardian' || role === 'institucion');
  }

  respond(alert: AlertSummary): Promise<AlertResult<void>> {
    if (!isActive(alert)) return Promise.resolve({ ok: false, reason: 'NOT_ACTIVE_ALERT' });
    return this.repository.respond(alert.id);
  }

  close(
    alert: AlertSummary,
    classification: Classification | null,
    note: string,
  ): Promise<AlertResult<void>> {
    if (!isActive(alert)) return Promise.resolve({ ok: false, reason: 'NOT_ACTIVE_ALERT' });
    const trimmed = note.trim();
    if (!classification || trimmed.length > MAX_NOTE_LENGTH) {
      return Promise.resolve({ ok: false, reason: 'INVALID_DATA' });
    }
    return this.repository.close(alert.id, classification, trimmed);
  }

  summary(): Promise<AlertResult<DailyCount[]>> {
    return this.repository.summary(CHART_DAYS);
  }

  /** Un registro por día de los últimos CHART_DAYS días, con ceros donde no hubo alertas. */
  dailyTotals(counts: DailyCount[], today: Date): DayTotals[] {
    const days: DayTotals[] = [];
    for (let i = CHART_DAYS - 1; i >= 0; i--) {
      days.push({
        day: localDay(new Date(today.getTime() - i * DAY_MS)),
        byClassification: emptyTotals(),
        total: 0,
      });
    }
    counts.forEach((count) => {
      const target = days.find((item) => item.day === count.day);
      if (!target) return;
      target.byClassification[count.classification] += count.total;
      target.total += count.total;
    });
    return days;
  }
}
