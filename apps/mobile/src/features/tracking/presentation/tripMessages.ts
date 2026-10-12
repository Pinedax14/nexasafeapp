import { TripFailureReason } from '../domain/repositories/TripRepository';

export const TRIP_ERROR_MESSAGES: Record<TripFailureReason, string> = {
  FORBIDDEN: 'Tu cuenta no tiene permiso para esta acción.',
  NOT_ACTIVE: 'El colegio todavía no ha validado tu cuenta.',
  ALREADY_ACTIVE: 'Ya tienes un trayecto en curso.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  UNKNOWN: 'No se pudo completar la acción. Intenta de nuevo.',
};

export const NO_ROUTES_MESSAGE = 'Tu acudiente todavía no ha definido tus rutas.';

/** Hora local en formato colombiano: "6:42 a. m.". */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours < 12 ? 'a. m.' : 'p. m.';
  return `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${suffix}`;
}

export const tripSince = (iso: string) => `En curso desde las ${formatTime(iso)}`;
