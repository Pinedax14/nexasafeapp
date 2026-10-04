import { AuthRepository, RegisterResult } from '../repositories/AuthRepository';

/** Longitud mínima de contraseña (decisión D7). */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_NAME_LENGTH = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegistrationField = 'name' | 'email' | 'password';

export type RegistrationErrors = Partial<Record<RegistrationField, string>>;

export type RegisterGuardianResult =
  RegisterResult | { ok: false; reason: 'INVALID_INPUT'; errors: RegistrationErrors };

export function validateRegistration(
  name: string,
  email: string,
  password: string,
): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const trimmedName = name.trim();

  if (!trimmedName) {
    errors.name = 'Ingresa tu nombre.';
  } else if (trimmedName.length > MAX_NAME_LENGTH) {
    errors.name = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }

  if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Ingresa un correo válido.';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  return errors;
}

export class RegisterGuardian {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(name: string, email: string, password: string): Promise<RegisterGuardianResult> {
    const errors = validateRegistration(name, email, password);
    if (Object.keys(errors).length > 0) {
      return { ok: false, reason: 'INVALID_INPUT', errors };
    }

    return this.authRepository.registerGuardian({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });
  }
}
