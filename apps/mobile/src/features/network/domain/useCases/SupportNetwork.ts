import {
  RegistrationErrors,
  validateRegistration,
} from '../../../auth/domain/useCases/RegisterGuardian';
import { Invitation, InvitationPreview, SupportContact } from '../entities/SupportContact';
import {
  NetworkResult,
  SupportNetworkRepository,
  SupportRegisterResult,
} from '../repositories/SupportNetworkRepository';

/** D14: enlace propio de la app; el mismo token sirve como código para pegarlo. */
export const INVITATION_LINK_PREFIX = 'nexasafe://invitacion/';
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,64}$/;

export function invitationLink(token: string): string {
  return `${INVITATION_LINK_PREFIX}${token}`;
}

/** Acepta el enlace completo o solo el código, con espacios alrededor. */
export function extractToken(input: string): string | null {
  const text = input.trim();
  const candidate = text.startsWith(INVITATION_LINK_PREFIX)
    ? text.slice(INVITATION_LINK_PREFIX.length)
    : text;
  return TOKEN_PATTERN.test(candidate) ? candidate : null;
}

export function invitationMessage(invitation: Invitation, guardianName: string): string {
  return (
    `${guardianName} te invita a la red de apoyo de NexaSafe.\n\n` +
    `Abre este enlace en tu celular con NexaSafe instalado:\n${invitationLink(invitation.token)}\n\n` +
    `O en NexaSafe toca "Tengo una invitación" y pega este código:\n${invitation.token}\n\n` +
    'La invitación sirve una sola vez y vence en 72 horas.'
  );
}

export type SupportRegisterUseCaseResult =
  SupportRegisterResult | { ok: false; reason: 'INVALID_INPUT'; errors: RegistrationErrors };

/** E2-01: el guardián invita contactos de apoyo; el contacto acepta creando su cuenta. */
export class SupportNetwork {
  constructor(private readonly repository: SupportNetworkRepository) {}

  listContacts(protegidoId: string): Promise<NetworkResult<SupportContact[]>> {
    return this.repository.listContacts(protegidoId);
  }

  invite(protegidoId: string): Promise<NetworkResult<Invitation>> {
    return this.repository.createInvitation(protegidoId);
  }

  async preview(
    input: string,
  ): Promise<NetworkResult<{ token: string; preview: InvitationPreview }>> {
    const token = extractToken(input);
    if (!token) return { ok: false, reason: 'INVALID_INVITATION' };
    const result = await this.repository.previewInvitation(token);
    if (!result.ok) return result;
    return { ok: true, value: { token, preview: result.value } };
  }

  async register(
    name: string,
    email: string,
    password: string,
    token: string,
  ): Promise<SupportRegisterUseCaseResult> {
    const errors = validateRegistration(name, email, password);
    if (Object.keys(errors).length > 0) return { ok: false, reason: 'INVALID_INPUT', errors };
    return this.repository.registerWithInvitation({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      token,
    });
  }
}
