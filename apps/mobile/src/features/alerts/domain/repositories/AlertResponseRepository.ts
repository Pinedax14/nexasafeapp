import { AlertSummary, Classification, DailyCount, IncidentEvent } from '../entities/AlertSummary';
import { AlertResult } from './AlertRepository';

export interface AlertResponseRepository {
  /** Alertas que la sesión puede ver (RLS); las canceladas no se muestran. */
  list(onlyActive: boolean): Promise<AlertResult<AlertSummary[]>>;
  /** Bitácora de la alerta con el nombre de cada actor; lectura auditada. */
  log(alertId: string): Promise<AlertResult<IncidentEvent[]>>;
  /** "Voy en camino" (E7-02, D28). */
  respond(alertId: string): Promise<AlertResult<void>>;
  /** Cierre clasificado (E9-02, D29). */
  close(alertId: string, classification: Classification, note: string): Promise<AlertResult<void>>;
  /** Conteos del colegio para el gráfico del puesto de control (E8-01). */
  summary(days: number): Promise<AlertResult<DailyCount[]>>;
}
