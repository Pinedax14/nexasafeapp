import { AuthError, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { Role, User } from '../../domain/entities/User';
import {
  AuthRepository,
  GuardianRegistration,
  LoginFailureReason,
  LoginResult,
  RegisterFailureReason,
  RegisterResult,
} from '../../domain/repositories/AuthRepository';

export type SupabaseAuthClient = Pick<
  SupabaseClient['auth'],
  'signInWithPassword' | 'signUp' | 'signOut'
>;

const ROLES: readonly Role[] = ['guardian', 'institucion', 'admin', 'protegido', 'apoyo'];

function toRole(value: unknown): Role | null {
  return ROLES.includes(value as Role) ? (value as Role) : null;
}

export function toDomainUser(user: SupabaseUser): User {
  const email = user.email ?? '';
  const name = typeof user.user_metadata?.nombre === 'string' ? user.user_metadata.nombre : '';
  return {
    id: user.id,
    email,
    name: name || email,
    role: toRole(user.app_metadata?.rol),
  };
}

function isNetworkError(error: AuthError): boolean {
  return error.name === 'AuthRetryableFetchError' || error.status === 0;
}

function isRateLimited(error: AuthError): boolean {
  return error.status === 429 || (error.code ?? '').startsWith('over_');
}

function loginFailureReason(error: AuthError): LoginFailureReason {
  if (isNetworkError(error)) return 'NETWORK';
  if (isRateLimited(error)) return 'RATE_LIMITED';
  if (error.code === 'email_not_confirmed') return 'EMAIL_NOT_CONFIRMED';
  if (error.code === 'invalid_credentials' || error.status === 400) return 'INVALID_CREDENTIALS';
  return 'UNKNOWN';
}

function registerFailureReason(error: AuthError): RegisterFailureReason {
  if (isNetworkError(error)) return 'NETWORK';
  if (isRateLimited(error)) return 'RATE_LIMITED';
  if (error.code === 'weak_password') return 'WEAK_PASSWORD';
  return 'UNKNOWN';
}

export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly auth: SupabaseAuthClient) {}

  async login(email: string, password: string): Promise<LoginResult> {
    const { data, error } = await this.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return { ok: false, reason: error ? loginFailureReason(error) : 'UNKNOWN' };
    }
    return { ok: true, user: toDomainUser(data.user) };
  }

  async registerGuardian({ name, email, password }: GuardianRegistration): Promise<RegisterResult> {
    const { data, error } = await this.auth.signUp({
      email,
      password,
      options: { data: { nombre: name } },
    });

    // D2: un correo ya registrado no se distingue de un registro nuevo.
    if (error?.code === 'user_already_exists') {
      return { ok: true, status: 'CONFIRMATION_PENDING' };
    }
    if (error) {
      return { ok: false, reason: registerFailureReason(error) };
    }
    if (data.session && data.user) {
      return { ok: true, status: 'SIGNED_IN', user: toDomainUser(data.user) };
    }
    return { ok: true, status: 'CONFIRMATION_PENDING' };
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
  }
}
