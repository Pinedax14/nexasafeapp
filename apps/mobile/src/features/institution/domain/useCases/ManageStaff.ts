import { MIN_PASSWORD_LENGTH } from '../../../auth/domain/useCases/RegisterGuardian';
import { Staff } from '../entities/Staff';
import {
  AdminResult,
  InstitutionAdminRepository,
} from '../repositories/InstitutionAdminRepository';

export const MAX_STAFF_TEXT_LENGTH = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type StaffField = 'name' | 'position' | 'email' | 'temporaryPassword';
export type StaffErrors = Partial<Record<StaffField, string>>;

export type StaffForm = Record<StaffField, string>;

export type RegisterStaffResult =
  AdminResult<string> | { ok: false; reason: 'INVALID_INPUT'; errors: StaffErrors };

export function validateStaff(form: StaffForm): StaffErrors {
  const errors: StaffErrors = {};
  const name = form.name.trim();
  if (!name || name.length > MAX_STAFF_TEXT_LENGTH) errors.name = 'Ingresa el nombre.';
  if (form.position.trim().length > MAX_STAFF_TEXT_LENGTH)
    errors.position = 'El cargo es muy largo.';
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Ingresa un correo válido.';
  if (form.temporaryPassword.length < MIN_PASSWORD_LENGTH) {
    errors.temporaryPassword = `La contraseña temporal debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return errors;
}

/** E1-06: el administrador registra, consulta y activa o desactiva personal institucional. */
export class ManageStaff {
  constructor(private readonly repository: InstitutionAdminRepository) {}

  list(schoolId: string): Promise<AdminResult<Staff[]>> {
    return this.repository.listStaff(schoolId);
  }

  async register(schoolId: string, form: StaffForm): Promise<RegisterStaffResult> {
    const errors = validateStaff(form);
    if (Object.keys(errors).length > 0) {
      return { ok: false, reason: 'INVALID_INPUT', errors };
    }
    return this.repository.registerStaff({
      schoolId,
      name: form.name.trim(),
      position: form.position.trim() || null,
      email: form.email.trim().toLowerCase(),
      temporaryPassword: form.temporaryPassword,
    });
  }

  setActive(staffId: string, active: boolean): Promise<AdminResult<void>> {
    return this.repository.setStaffActive(staffId, active);
  }
}
