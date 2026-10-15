/** Estado que ve el guardián de cada invitación (W5); no tiene columna propia. */
export type ContactStatus = 'PENDIENTE' | 'VENCIDA' | 'ACEPTADA';

export type SupportContact = {
  id: string;
  protegidoId: string;
  /** Nombre del contacto; null mientras no acepte. */
  name: string | null;
  acceptedAt: string | null;
  expiresAt: string;
};

export type Invitation = {
  id: string;
  /** Se muestra una sola vez: el servidor solo guarda su hash. */
  token: string;
  expiresAt: string;
};

/** D17: solo el primer nombre del menor y el nombre del guardián. */
export type InvitationPreview = {
  childFirstName: string;
  guardianName: string;
};

export function contactStatus(contact: SupportContact, now: Date): ContactStatus {
  if (contact.acceptedAt) return 'ACEPTADA';
  return new Date(contact.expiresAt) <= now ? 'VENCIDA' : 'PENDIENTE';
}
