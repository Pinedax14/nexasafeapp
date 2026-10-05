import { EnrollmentDetail, PendingEnrollment } from '../entities/EnrollmentReview';
import { EnrollmentRepository, EnrollmentResult } from '../repositories/EnrollmentRepository';

/** E1-03: el personal activo del colegio revisa y valida la matrícula del menor (RF-03). */
export class ValidateEnrollment {
  constructor(private readonly repository: EnrollmentRepository) {}

  listPending(): Promise<EnrollmentResult<PendingEnrollment[]>> {
    return this.repository.listPending();
  }

  review(protegidoId: string): Promise<EnrollmentResult<EnrollmentDetail>> {
    return this.repository.getDetail(protegidoId);
  }

  validate(protegidoId: string): Promise<EnrollmentResult<void>> {
    return this.repository.validate(protegidoId);
  }
}
