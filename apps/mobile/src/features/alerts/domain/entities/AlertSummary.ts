import { AlertStatus } from './Alert';

/** alertas.clasificacion (D29). */
export type Classification = 'FALSA_ALARMA' | 'SITUACION_RESUELTA' | 'REMITIDA_A_AUTORIDAD';

export const CLASSIFICATIONS: Classification[] = [
  'FALSA_ALARMA',
  'SITUACION_RESUELTA',
  'REMITIDA_A_AUTORIDAD',
];

/** Alerta vista por quien responde: guardián, contacto de apoyo o puesto de control (D26). */
export type AlertSummary = {
  id: string;
  protegidoId: string;
  /** Nombre del menor; el contacto de apoyo solo recibe el primer nombre (D17). */
  childName: string;
  status: AlertStatus;
  /** Hora del servidor (ISO 8601). */
  createdAt: string;
  classification: Classification | null;
  closedAt: string | null;
};

/** eventos_incidente.tipo_evento (D27). */
export type IncidentEventType =
  'DISPARADA' | 'CANCELADA' | 'NOTIFICADA' | 'VOY_EN_CAMINO' | 'CERRADA';

/** Una línea de la bitácora (E9-01). */
export type IncidentEvent = {
  type: IncidentEventType;
  actor: string;
  detail: string | null;
  /** Hora del servidor (ISO 8601). */
  at: string;
};

export type DailyCountKey = Classification | 'SIN_CERRAR';

/** Conteo de alertas del colegio por día y clasificación, sin datos personales (D26). */
export type DailyCount = { day: string; classification: DailyCountKey; total: number };

/** Un día del gráfico con sus alertas por clasificación. */
export type DayTotals = {
  day: string;
  byClassification: Record<DailyCountKey, number>;
  total: number;
};

/** Roles de la app que atienden alertas. */
export type ResponderRole = 'guardian' | 'apoyo' | 'institucion';
