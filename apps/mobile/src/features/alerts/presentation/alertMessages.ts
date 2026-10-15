import { AlertFailureReason } from '../domain/repositories/AlertRepository';

export const ALERT_ERROR_MESSAGES: Record<AlertFailureReason, string> = {
  FORBIDDEN: 'Tu cuenta no tiene permiso para esta acción.',
  NOT_ACTIVE: 'El colegio todavía no ha validado tu cuenta.',
  RATE_LIMITED: 'Ya enviaste varias alertas. Tus acudientes ya fueron avisados.',
  INVALID_PIN: 'El PIN no es correcto.',
  LOCKED: 'Demasiados intentos con el PIN. La alerta sigue activa.',
  NOT_CANCELLABLE: 'Ya no se puede cancelar. Tus acudientes van a ser avisados.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  UNKNOWN: 'No se pudo completar la acción. Intenta de nuevo.',
};

export const PANIC_LABEL = 'AYUDA';
export const PANIC_HINT = 'Mantén presionado 3 segundos';
export const ALERT_SENT_TITLE = 'Alerta enviada';
export const CANCEL_PROMPT = '¿Fue un error? Escribe tu PIN para cancelar';
export const ALERT_ACTIVE_MESSAGE = 'Tu alerta está activa. Tus acudientes van a ser avisados.';
export const ALERT_CANCELLED_MESSAGE = 'Alerta cancelada.';
