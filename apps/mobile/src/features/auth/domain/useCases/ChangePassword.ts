import { AuthRepository, ChangePasswordResult } from '../repositories/AuthRepository';
import { MIN_PASSWORD_LENGTH } from './RegisterGuardian';

export type ChangePasswordField = 'password' | 'confirmation';
export type ChangePasswordErrors = Partial<Record<ChangePasswordField, string>>;

export type ChangePasswordUseCaseResult =
  ChangePasswordResult | { ok: false; reason: 'INVALID_INPUT'; errors: ChangePasswordErrors };

export function validateNewPassword(password: string, confirmation: string): ChangePasswordErrors {
  const errors: ChangePasswordErrors = {};
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  } else if (password !== confirmation) {
    errors.confirmation = 'Las contraseñas no coinciden.';
  }
  return errors;
}

/** SEC-03: el personal institucional cambia la contraseña temporal en su primer ingreso. */
export class ChangePassword {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(password: string, confirmation: string): Promise<ChangePasswordUseCaseResult> {
    const errors = validateNewPassword(password, confirmation);
    if (Object.keys(errors).length > 0) {
      return { ok: false, reason: 'INVALID_INPUT', errors };
    }
    return this.authRepository.changePassword(password);
  }
}
