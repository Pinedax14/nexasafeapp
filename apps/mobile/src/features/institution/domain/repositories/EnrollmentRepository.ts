import { EnrollmentDetail, PendingEnrollment } from '../entities/EnrollmentReview';

export type EnrollmentFailureReason = 'FORBIDDEN' | 'ALREADY_VALIDATED' | 'NETWORK' | 'UNKNOWN';

export type EnrollmentResult<T> =
  { ok: true; value: T } | { ok: false; reason: EnrollmentFailureReason };

export interface EnrollmentRepository {
  /** Menores en PENDIENTE_VALIDACION del colegio del usuario (RLS). */
  listPending(): Promise<EnrollmentResult<PendingEnrollment[]>>;
  getDetail(protegidoId: string): Promise<EnrollmentResult<EnrollmentDetail>>;
  validate(protegidoId: string): Promise<EnrollmentResult<void>>;
}
