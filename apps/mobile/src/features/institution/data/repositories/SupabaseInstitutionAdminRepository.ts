import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../../core/api/database.types';
import { School } from '../../domain/entities/School';
import { Staff } from '../../domain/entities/Staff';
import {
  AdminFailureReason,
  AdminResult,
  InstitutionAdminRepository,
  StaffRegistration,
} from '../../domain/repositories/InstitutionAdminRepository';

export type InstitutionAdminClient = Pick<SupabaseClient<Database>, 'from' | 'functions'>;

type PostgrestErrorLike = { code?: string; message?: string } | null;
type SchoolRow = Database['public']['Tables']['colegios']['Row'];
type StaffRow = Database['public']['Tables']['personal_institucion']['Row'];

const FUNCTION_ERRORS: Record<string, AdminFailureReason> = {
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'FORBIDDEN',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  SCHOOL_NOT_FOUND: 'SCHOOL_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
};

function databaseFailure(error: PostgrestErrorLike): AdminFailureReason {
  if (error?.code === '23505') return 'DUPLICATE_NIT';
  if (error?.code === '42501') return 'FORBIDDEN';
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

async function functionFailure(error: {
  name?: string;
  context?: unknown;
}): Promise<AdminFailureReason> {
  if (error.name === 'FunctionsFetchError') return 'NETWORK';
  const context = error.context as { json?: () => Promise<{ error?: string }> } | undefined;
  if (context?.json) {
    try {
      const body = await context.json();
      return FUNCTION_ERRORS[body.error ?? ''] ?? 'UNKNOWN';
    } catch {
      return 'UNKNOWN';
    }
  }
  return 'UNKNOWN';
}

const toSchool = (row: Pick<SchoolRow, 'id' | 'nombre' | 'nit'>): School => ({
  id: row.id,
  name: row.nombre,
  nit: row.nit,
});

const toStaff = (
  row: Pick<StaffRow, 'id' | 'colegio_id' | 'nombre' | 'cargo' | 'activo'>,
): Staff => ({
  id: row.id,
  schoolId: row.colegio_id,
  name: row.nombre,
  position: row.cargo,
  active: row.activo,
});

export class SupabaseInstitutionAdminRepository implements InstitutionAdminRepository {
  constructor(private readonly client: InstitutionAdminClient) {}

  async listSchools(): Promise<AdminResult<School[]>> {
    const { data, error } = await this.client
      .from('colegios')
      .select('id, nombre, nit')
      .order('nombre');
    if (error || !data) return { ok: false, reason: databaseFailure(error) };
    return { ok: true, value: data.map(toSchool) };
  }

  async createSchool(name: string, nit: string): Promise<AdminResult<School>> {
    const { data, error } = await this.client
      .from('colegios')
      .insert({ nombre: name, nit })
      .select('id, nombre, nit')
      .single();
    if (error || !data) return { ok: false, reason: databaseFailure(error) };
    return { ok: true, value: toSchool(data) };
  }

  async listStaff(schoolId: string): Promise<AdminResult<Staff[]>> {
    const { data, error } = await this.client
      .from('personal_institucion')
      .select('id, colegio_id, nombre, cargo, activo')
      .eq('colegio_id', schoolId)
      .order('nombre');
    if (error || !data) return { ok: false, reason: databaseFailure(error) };
    return { ok: true, value: data.map(toStaff) };
  }

  async registerStaff(registration: StaffRegistration): Promise<AdminResult<string>> {
    const { data, error } = await this.client.functions.invoke<{ id: string }>('admin-personal', {
      body: {
        colegio_id: registration.schoolId,
        nombre: registration.name,
        cargo: registration.position,
        email: registration.email,
        password: registration.temporaryPassword,
      },
    });
    if (error || !data?.id) {
      return { ok: false, reason: error ? await functionFailure(error) : 'UNKNOWN' };
    }
    return { ok: true, value: data.id };
  }

  async setStaffActive(staffId: string, active: boolean): Promise<AdminResult<void>> {
    const { error } = await this.client
      .from('personal_institucion')
      .update({ activo: active })
      .eq('id', staffId);
    if (error) return { ok: false, reason: databaseFailure(error) };
    return { ok: true, value: undefined };
  }
}
