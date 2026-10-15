import { AlertStatus } from '../domain/entities/Alert';
import {
  Classification,
  DailyCountKey,
  IncidentEventType,
} from '../domain/entities/AlertSummary';
import { AlertFailureReason } from '../domain/repositories/AlertRepository';

export const ALERT_ERROR_MESSAGES: Record<AlertFailureReason, string> = {
  FORBIDDEN: 'Tu cuenta no tiene permiso para esta acción.',
  NOT_ACTIVE: 'El colegio todavía no ha validado tu cuenta.',
  RATE_LIMITED: 'Ya enviaste varias alertas. Tus acudientes ya fueron avisados.',
  INVALID_PIN: 'El PIN no es correcto.',
  LOCKED: 'Demasiados intentos con el PIN. La alerta sigue activa.',
  NOT_CANCELLABLE: 'Ya no se puede cancelar. Tus acudientes van a ser avisados.',
  INVALID_DATA: 'Elige cómo terminó la alerta. La nota puede tener hasta 280 caracteres.',
  NOT_ACTIVE_ALERT: 'Esta alerta ya fue cerrada.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  UNKNOWN: 'No se pudo completar la acción. Intenta de nuevo.',
};

export const PANIC_LABEL = 'AYUDA';
export const PANIC_HINT = 'Mantén presionado 3 segundos';
export const ALERT_SENT_TITLE = 'Alerta enviada';
export const CANCEL_PROMPT = '¿Fue un error? Escribe tu PIN para cancelar';
export const ALERT_ACTIVE_MESSAGE = 'Tu alerta está activa. Tus acudientes van a ser avisados.';
export const ALERT_CANCELLED_MESSAGE = 'Alerta cancelada.';

/** W11 · Alerta recibida, W12 · Cierre y W13 · Puesto de control (Sprint 04). */
export const CLASSIFICATION_LABELS: Record<Classification, string> = {
  FALSA_ALARMA: 'Falsa alarma',
  SITUACION_RESUELTA: 'Situación resuelta',
  REMITIDA_A_AUTORIDAD: 'Remitida a la autoridad',
};

export const COUNT_LABELS: Record<DailyCountKey, string> = {
  ...CLASSIFICATION_LABELS,
  SIN_CERRAR: 'Sin cerrar',
};

export const STATUS_LABELS: Record<AlertStatus, string> = {
  ENVIADA: 'Enviada',
  CANCELADA: 'Cancelada',
  ATENDIDA: 'Atendida',
  CERRADA: 'Cerrada',
};

export const EVENT_LABELS: Record<IncidentEventType, string> = {
  DISPARADA: 'Disparada',
  CANCELADA: 'Cancelada',
  NOTIFICADA: 'Notificada',
  VOY_EN_CAMINO: 'Voy en camino',
  CERRADA: 'Cerrada',
};

export const alertTitle = (childName: string) => `🚨 Alerta de ${childName}`;
export const NO_ACTIVE_ALERTS = 'No hay alertas activas.';
export const CLOSE_PROMPT = '¿Cómo terminó?';
export const NOTE_LABEL = 'Nota (opcional, hasta 280 caracteres)';
export const RESPONDED_MESSAGE = 'Avisamos que vas en camino.';
export const CLOSED_MESSAGE = 'La alerta quedó cerrada.';
export const CHART_TITLE = 'Alertas de los últimos 14 días';
