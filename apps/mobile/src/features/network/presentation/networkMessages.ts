import { ContactStatus, SupportContact } from '../domain/entities/SupportContact';
import { NetworkFailureReason } from '../domain/repositories/SupportNetworkRepository';

export const INVALID_INVITATION_MESSAGE = 'Esta invitación ya no es válida. Pide una nueva.';

export const NETWORK_ERROR_MESSAGES: Record<NetworkFailureReason, string> = {
  FORBIDDEN: 'Tu cuenta no tiene permiso para esta acción.',
  NOT_ACTIVE: 'El colegio todavía no ha validado a este menor.',
  RATE_LIMITED: 'Creaste muchas invitaciones en poco tiempo. Espera un rato e intenta de nuevo.',
  INVALID_INVITATION: INVALID_INVITATION_MESSAGE,
  WEAK_PASSWORD: 'Esa contraseña es muy débil. Elige otra.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  UNKNOWN: 'No se pudo completar la acción. Intenta de nuevo.',
};

export const INVITE_NOTICE = 'El enlace sirve una sola vez y vence en 72 horas.';
export const SUPPORT_SCOPE_NOTICE = 'Solo verás las alertas del menor, no sus trayectos.';
export const NO_ALERTS_MESSAGE = 'Aún no hay alertas.';
export const SUPPORT_CONFIRMATION_MESSAGE =
  'Te enviamos un correo para confirmar tu cuenta. Después inicia sesión con tu correo y contraseña.';

const ddmm = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
};

export function contactLabel(contact: SupportContact, status: ContactStatus): string {
  if (status === 'ACEPTADA') return contact.name ?? 'Contacto de apoyo';
  return 'Invitación';
}

export function contactStatusLabel(contact: SupportContact, status: ContactStatus): string {
  if (status === 'ACEPTADA') return 'Aceptó';
  if (status === 'VENCIDA') return 'Vencida';
  return `Vence el ${ddmm(contact.expiresAt)}`;
}
