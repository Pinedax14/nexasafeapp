import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../../core/api/database.types';
import { EnrollmentDetail, PendingEnrollment } from '../../domain/entities/EnrollmentReview';
import {
  EnrollmentFailureReason,
  EnrollmentRepository,
  EnrollmentResult,
} from '../../domain/repositories/EnrollmentRepository';

export const PHOTO_BUCKET = 'fotos-protegidos';
/** La URL firmada de la foto vence pronto: solo sirve mientras se revisa. */
export const PHOTO_URL_TTL_SECONDS = 120;

export type EnrollmentClient = Pick<SupabaseClient<Database>, 'from' | 'rpc' | 'storage'>;

type ErrorLike = { code?: string; message?: string } | null;

function failure(error: ErrorLike): EnrollmentFailureReason {
  if (error?.code === '42501') return 'FORBIDDEN';
  if (error?.code === 'P0001') return 'ALREADY_VALIDATED';
  const message = error?.message ?? '';
  if (message.includes('Failed to fetch') || message.includes('Network request failed')) {
    return 'NETWORK';
  }
  return 'UNKNOWN';
}

export class SupabaseEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly client: EnrollmentClient) {}

  async listPending(): Promise<EnrollmentResult<PendingEnrollment[]>> {
    const { data, error } = await this.client
      .from('protegidos')
      .select('id, nombre, creado_en')
      .eq('estado', 'PENDIENTE_VALIDACION')
      .order('creado_en');
    if (error || !data) return { ok: false, reason: failure(error) };
    return {
      ok: true,
      value: data.map((row) => ({ id: row.id, name: row.nombre, registeredAt: row.creado_en })),
    };
  }

  async getDetail(protegidoId: string): Promise<EnrollmentResult<EnrollmentDetail>> {
    const { data, error } = await this.client.rpc('obtener_protegido', {
      p_protegido_id: protegidoId,
    });
    const row = Array.isArray(data) ? data[0] : undefined;
    if (error || !row) return { ok: false, reason: failure(error) };

    let photoUrl: string | null = null;
    if (row.foto_path) {
      const signed = await this.client.storage
        .from(PHOTO_BUCKET)
        .createSignedUrl(row.foto_path, PHOTO_URL_TTL_SECONDS);
      photoUrl = signed.data?.signedUrl ?? null;
    }

    return {
      ok: true,
      value: {
        id: row.id,
        name: row.nombre,
        document: row.documento,
        photoUrl,
        status: row.estado,
      },
    };
  }

  async validate(protegidoId: string): Promise<EnrollmentResult<void>> {
    const { error } = await this.client.rpc('validar_protegido', { p_protegido_id: protegidoId });
    if (error) return { ok: false, reason: failure(error) };
    return { ok: true, value: undefined };
  }
}
