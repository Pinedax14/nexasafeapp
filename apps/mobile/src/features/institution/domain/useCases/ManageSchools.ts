import { School } from '../entities/School';
import {
  AdminResult,
  InstitutionAdminRepository,
} from '../repositories/InstitutionAdminRepository';

export const MAX_SCHOOL_NAME_LENGTH = 150;
const NIT_PATTERN = /^[0-9]{6,15}(-[0-9])?$/;

export type SchoolField = 'name' | 'nit';
export type SchoolErrors = Partial<Record<SchoolField, string>>;

export type CreateSchoolResult =
  AdminResult<School> | { ok: false; reason: 'INVALID_INPUT'; errors: SchoolErrors };

export function validateSchool(name: string, nit: string): SchoolErrors {
  const errors: SchoolErrors = {};
  const trimmedName = name.trim();
  if (!trimmedName || trimmedName.length > MAX_SCHOOL_NAME_LENGTH) {
    errors.name = 'Ingresa el nombre del colegio.';
  }
  if (!NIT_PATTERN.test(nit.trim())) {
    errors.nit = 'Ingresa un NIT válido (solo números, con dígito de verificación opcional).';
  }
  return errors;
}

/** E1-06: el administrador consulta y crea colegios. */
export class ManageSchools {
  constructor(private readonly repository: InstitutionAdminRepository) {}

  list(): Promise<AdminResult<School[]>> {
    return this.repository.listSchools();
  }

  async create(name: string, nit: string): Promise<CreateSchoolResult> {
    const errors = validateSchool(name, nit);
    if (Object.keys(errors).length > 0) {
      return { ok: false, reason: 'INVALID_INPUT', errors };
    }
    return this.repository.createSchool(name.trim(), nit.trim());
  }
}
