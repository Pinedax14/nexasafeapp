import { User } from '../entities/User';

export type LoginFailureReason =
  'INVALID_CREDENTIALS' | 'EMAIL_NOT_CONFIRMED' | 'NETWORK' | 'RATE_LIMITED' | 'LOCKED' | 'UNKNOWN';

export type LoginResult = { ok: true; user: User } | { ok: false; reason: LoginFailureReason };

export type RegisterFailureReason = 'WEAK_PASSWORD' | 'NETWORK' | 'RATE_LIMITED' | 'UNKNOWN';

export type RegisterResult =
  | { ok: true; status: 'CONFIRMATION_PENDING' }
  | { ok: true; status: 'SIGNED_IN'; user: User }
  | { ok: false; reason: RegisterFailureReason };

export type GuardianRegistration = {
  name: string;
  email: string;
  password: string;
};

export type ChangePasswordFailureReason =
  'SAME_PASSWORD' | 'WEAK_PASSWORD' | 'NETWORK' | 'RATE_LIMITED' | 'UNKNOWN';

export type ChangePasswordResult =
  { ok: true; user: User } | { ok: false; reason: ChangePasswordFailureReason };

export type SessionListener = (user: User | null) => void;

export interface AuthRepository {
  login(email: string, password: string): Promise<LoginResult>;
  /** E1-04: el protegido entra con su documento y un PIN de 4 dígitos (Edge Function auth-pin). */
  loginWithPin(document: string, pin: string): Promise<LoginResult>;
  registerGuardian(registration: GuardianRegistration): Promise<RegisterResult>;
  signOut(): Promise<void>;
  /** SEC-03: cambia la contraseña y renueva la sesión (el servidor quita la marca de temporal). */
  changePassword(newPassword: string): Promise<ChangePasswordResult>;
  /** Usuario de la sesión guardada en el dispositivo, renovándola si hace falta. */
  getCurrentUser(): Promise<User | null>;
  /** Avisa cada vez que la sesión empieza o termina. Devuelve la función para dejar de escuchar. */
  observeSession(listener: SessionListener): () => void;
}
