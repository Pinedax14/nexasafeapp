import { School } from '../entities/School';
import { Staff } from '../entities/Staff';

export type AdminFailureReason =
  | 'FORBIDDEN'
  | 'DUPLICATE_NIT'
  | 'EMAIL_EXISTS'
  | 'WEAK_PASSWORD'
  | 'SCHOOL_NOT_FOUND'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'UNKNOWN';

export type AdminResult<T> = { ok: true; value: T } | { ok: false; reason: AdminFailureReason };

export type StaffRegistration = {
  schoolId: string;
  name: string;
  position: string | null;
  email: string;
  temporaryPassword: string;
};

export interface InstitutionAdminRepository {
  listSchools(): Promise<AdminResult<School[]>>;
  createSchool(name: string, nit: string): Promise<AdminResult<School>>;
  listStaff(schoolId: string): Promise<AdminResult<Staff[]>>;
  registerStaff(registration: StaffRegistration): Promise<AdminResult<string>>;
  setStaffActive(staffId: string, active: boolean): Promise<AdminResult<void>>;
}
