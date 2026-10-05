import { EnrollmentFailureReason } from '../domain/repositories/EnrollmentRepository';

export const ENROLLMENT_ERROR_MESSAGES: Record<EnrollmentFailureReason, string> = {
  FORBIDDEN: 'No tienes acceso a este menor. Verifica que tu cuenta esté activa en el colegio.',
  ALREADY_VALIDATED: 'Este menor ya no está pendiente de validación.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  UNKNOWN: 'No se pudo completar la acción. Intenta de nuevo.',
};

export const ENROLLMENT_VALIDATED_MESSAGE =
  'Matrícula validada. El menor ya está activo y su acudiente puede usar NexaSafe con él.';
