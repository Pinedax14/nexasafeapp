import { User } from '../../../auth/domain/entities/User';
import { Invitation, InvitationPreview, SupportContact } from '../entities/SupportContact';

export type NetworkFailureReason =
  | 'FORBIDDEN'
  | 'NOT_ACTIVE'
  | 'RATE_LIMITED'
  | 'INVALID_INVITATION'
  | 'WEAK_PASSWORD'
  | 'NETWORK'
  | 'UNKNOWN';

export type NetworkResult<T> = { ok: true; value: T } | { ok: false; reason: NetworkFailureReason };

export type SupportRegistration = {
  name: string;
  email: string;
  password: string;
  token: string;
};

/** Como en E1-01 (D2): un correo ya registrado no se distingue de un registro nuevo. */
export type SupportRegisterResult =
  | { ok: true; status: 'SIGNED_IN'; user: User }
  | { ok: true; status: 'CONFIRMATION_PENDING' }
  | { ok: false; reason: NetworkFailureReason };

export interface SupportNetworkRepository {
  /** Invitaciones y contactos de un menor (RLS: solo los del guardián). */
  listContacts(protegidoId: string): Promise<NetworkResult<SupportContact[]>>;
  /** Token de un solo uso que vence en 72 h; máximo 10 por hora (D8). */
  createInvitation(protegidoId: string): Promise<NetworkResult<Invitation>>;
  previewInvitation(token: string): Promise<NetworkResult<InvitationPreview>>;
  /** La cuenta nace con rol apoyo y queda vinculada al menor en la misma transacción. */
  registerWithInvitation(registration: SupportRegistration): Promise<SupportRegisterResult>;
}
