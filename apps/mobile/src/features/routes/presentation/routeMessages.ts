import { RouteDirection } from '../domain/entities/Route';
import { RouteFailureReason } from '../domain/repositories/RouteRepository';

export const ROUTE_ERROR_MESSAGES: Record<RouteFailureReason, string> = {
  FORBIDDEN: 'Tu cuenta no tiene permiso para esta acción.',
  NOT_ACTIVE: 'El colegio todavía no ha validado a este menor.',
  INVALID_DATA: 'Revisa la ruta, el corredor y la duración e intenta de nuevo.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  UNKNOWN: 'No se pudo completar la acción. Intenta de nuevo.',
};

export const DIRECTION_LABELS: Record<RouteDirection, string> = {
  CASA_COLEGIO: 'Casa → colegio',
  COLEGIO_CASA: 'Colegio → casa',
};

export const ROUTE_NOT_DEFINED = 'Sin definir';

/** E3-01b: sin conexión se muestran las rutas guardadas en el teléfono, solo para ver. */
export const ROUTES_OFFLINE_NOTICE =
  'Sin conexión: estas son las rutas guardadas en el teléfono. Solo puedes verlas.';

export const ROUTE_READ_ONLY_NOTICE = 'Modo lectura: sin conexión no se pueden guardar cambios.';
