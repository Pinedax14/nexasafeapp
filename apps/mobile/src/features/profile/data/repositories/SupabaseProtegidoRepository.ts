import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../../core/api/database.types';
import { PhotoFile, Protegido, SchoolOption } from '../../domain/entities/Protegido';
import {
  ProfileFailureReason,
  ProfileResult,
  ProtegidoRegistration,
  ProtegidoRepository,
} from '../../domain/repositories/ProtegidoRepository';

export const PHOTO_BUCKET = 'fotos-protegidos';

export type ProtegidoClient = Pick<SupabaseClient<Database>, 'from' | 'rpc' | 'storage'>;
export type ReadFile = (uri: string) => Promise<ArrayBuffer>;

type ErrorLike = { code?: string; message?: string; name?: string } | null;
type ProtegidoRow = Pick<
  Database['public']['Tables']['protegidos']['Row'],
  'id' | 'nombre' | 'colegio_id' | 'estado' | 'foto_path'
>;

const readFileWithFetch: ReadFile = async (uri) => (await fetch(uri)).arrayBuffer();

function failure(error: ErrorLike): ProfileFailureReason {
  if (error?.code === '42501') return 'FORBIDDEN';
  if (error?.code === 'P0001') return 'POLICY_OUTDATED';
  if (error?.code === '22023') return 'INVALID_DATA';
  const message = error?.message ?? '';
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

function extensionFor(mimeType: string): string {
  return mimeType === 'image/png' ? 'png' : 'jpg';
}

const toProtegido = (row: ProtegidoRow): Protegido => ({
  id: row.id,
  name: row.nombre,
  schoolId: row.colegio_id,
  status: row.estado,
  photoPath: row.foto_path,
});

export class SupabaseProtegidoRepository implements ProtegidoRepository {
  constructor(
    private readonly client: ProtegidoClient,
    private readonly readFile: ReadFile = readFileWithFetch,
    private readonly randomSuffix: () => string = () => Math.random().toString(36).slice(2, 10),
  ) {}

  async listMine(): Promise<ProfileResult<Protegido[]>> {
    const { data, error } = await this.client
      .from('protegidos')
      .select('id, nombre, colegio_id, estado, foto_path')
      .order('creado_en', { ascending: false });
    if (error || !data) return { ok: false, reason: failure(error) };
    return { ok: true, value: data.map(toProtegido) };
  }

  async listSchools(): Promise<ProfileResult<SchoolOption[]>> {
    const { data, error } = await this.client.from('colegios').select('id, nombre').order('nombre');
    if (error || !data) return { ok: false, reason: failure(error) };
    return { ok: true, value: data.map((row) => ({ id: row.id, name: row.nombre })) };
  }

  async currentPolicyVersion(): Promise<ProfileResult<string>> {
    const { data, error } = await this.client.rpc('version_politica_vigente');
    if (error || typeof data !== 'string') return { ok: false, reason: failure(error) };
    return { ok: true, value: data };
  }

  async uploadPhoto(guardianId: string, photo: PhotoFile): Promise<ProfileResult<string>> {
    const path = `${guardianId}/${Date.now()}-${this.randomSuffix()}.${extensionFor(photo.mimeType)}`;
    try {
      const body = await this.readFile(photo.uri);
      const { error } = await this.client.storage
        .from(PHOTO_BUCKET)
        .upload(path, body, { contentType: photo.mimeType, upsert: false });
      if (error) return { ok: false, reason: 'PHOTO_UPLOAD_FAILED' };
      return { ok: true, value: path };
    } catch {
      return { ok: false, reason: 'PHOTO_UPLOAD_FAILED' };
    }
  }

  async register(registration: ProtegidoRegistration): Promise<ProfileResult<string>> {
    const { data, error } = await this.client.rpc('registrar_protegido', {
      p_nombre: registration.name,
      p_documento: registration.document,
      p_colegio_id: registration.schoolId,
      p_foto_path: registration.photoPath,
      p_version_politica: registration.policyVersion,
    });
    if (error || typeof data !== 'string') return { ok: false, reason: failure(error) };
    return { ok: true, value: data };
  }
}
