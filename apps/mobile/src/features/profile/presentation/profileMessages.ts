import { ProtegidoStatus } from '../domain/entities/Protegido';
import { ProfileFailureReason } from '../domain/repositories/ProtegidoRepository';

export const PROFILE_ERROR_MESSAGES: Record<ProfileFailureReason, string> = {
  FORBIDDEN: 'Tu cuenta no tiene permiso para esta acción.',
  POLICY_OUTDATED:
    'La política de tratamiento cambió. Vuelve a abrir el formulario y acéptala de nuevo.',
  INVALID_DATA: 'Revisa los datos del menor e intenta de nuevo.',
  PHOTO_UPLOAD_FAILED: 'No se pudo subir la foto. Revisa tu conexión e intenta de nuevo.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  UNKNOWN: 'No se pudo completar la acción. Intenta de nuevo.',
};

export const STATUS_LABELS: Record<ProtegidoStatus, string> = {
  PENDIENTE_VALIDACION: 'Pendiente de validación del colegio',
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
};
