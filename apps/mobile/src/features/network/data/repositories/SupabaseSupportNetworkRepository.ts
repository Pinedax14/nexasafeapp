import { AuthError, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../../core/api/database.types';
import { toDomainUser } from '../../../auth/data/repositories/SupabaseAuthRepository';
import {
  Invitation,
  InvitationPreview,
  SupportContact,
} from '../../domain/entities/SupportContact';
import {
  NetworkFailureReason,
  NetworkResult,
  SupportNetworkRepository,
  SupportRegisterResult,
  SupportRegistration,
} from '../../domain/repositories/SupportNetworkRepository';

export type SupportNetworkClient = Pick<SupabaseClient<Database>, 'from' | 'rpc'> & {
  auth: Pick<SupabaseClient<Database>['auth'], 'signUp'>;
};

type ErrorLike = { code?: string; message?: string } | null;

function failure(error: ErrorLike): NetworkFailureReason {
  if (error?.code === '42501') return 'FORBIDDEN';
  if (error?.code === 'P0001') return 'NOT_ACTIVE';
  if (error?.code === 'NX429') return 'RATE_LIMITED';
  if (error?.code === 'NX410') return 'INVALID_INVITATION';
  const message = error?.message ?? '';
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

/** Si la invitación no sirve, el trigger rechaza el alta y Supabase Auth responde 500. */
function signUpFailure(error: AuthError): NetworkFailureReason {
  if (error.name === 'AuthRetryableFetchError' || error.status === 0) return 'NETWORK';
  if (error.code === 'weak_password') return 'WEAK_PASSWORD';
  if (error.status === 429 || (error.code ?? '').startsWith('over_')) return 'RATE_LIMITED';
  if (error.status === 500 || error.code === 'unexpected_failure') return 'INVALID_INVITATION';
  return 'UNKNOWN';
}

export class SupabaseSupportNetworkRepository implements SupportNetworkRepository {
  constructor(private readonly client: SupportNetworkClient) {}

  async listContacts(protegidoId: string): Promise<NetworkResult<SupportContact[]>> {
    const { data, error } = await this.client
      .from('contactos_apoyo')
      .select('id, protegido_id, nombre, aceptada_en, vence_en')
      .eq('protegido_id', protegidoId)
      .order('creado_en', { ascending: false });
    if (error || !data) return { ok: false, reason: failure(error) };
    return {
      ok: true,
      value: data.map((row) => ({
        id: row.id,
        protegidoId: row.protegido_id,
        name: row.nombre,
        acceptedAt: row.aceptada_en,
        expiresAt: row.vence_en,
      })),
    };
  }

  async createInvitation(protegidoId: string): Promise<NetworkResult<Invitation>> {
    const { data, error } = await this.client.rpc('crear_invitacion', {
      p_protegido_id: protegidoId,
    });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) return { ok: false, reason: failure(error) };
    return { ok: true, value: { id: row.id, token: row.token, expiresAt: row.vence_en } };
  }

  async previewInvitation(token: string): Promise<NetworkResult<InvitationPreview>> {
    const { data, error } = await this.client.rpc('ver_invitacion', { p_token: token });
    const row = Array.isArray(data) ? data[0] : null;
    if (error || !row) return { ok: false, reason: error ? failure(error) : 'INVALID_INVITATION' };
    return { ok: true, value: { childFirstName: row.menor, guardianName: row.guardian } };
  }

  async registerWithInvitation({
    name,
    email,
    password,
    token,
  }: SupportRegistration): Promise<SupportRegisterResult> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { nombre: name, invitacion: token } },
    });
    if (error?.code === 'user_already_exists') return { ok: true, status: 'CONFIRMATION_PENDING' };
    if (error) return { ok: false, reason: signUpFailure(error) };
    if (data.session && data.user) {
      return { ok: true, status: 'SIGNED_IN', user: toDomainUser(data.user) };
    }
    return { ok: true, status: 'CONFIRMATION_PENDING' };
  }
}
