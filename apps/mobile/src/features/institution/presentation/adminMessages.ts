import { AdminFailureReason } from '../domain/repositories/InstitutionAdminRepository';

export const ADMIN_ERROR_MESSAGES: Record<AdminFailureReason, string> = {
  FORBIDDEN: 'Tu cuenta no tiene permiso para esta acción.',
  DUPLICATE_NIT: 'Ya existe un colegio con ese NIT.',
  EMAIL_EXISTS: 'Ya existe una cuenta con ese correo.',
  WEAK_PASSWORD: 'La contraseña temporal es muy débil.',
  SCHOOL_NOT_FOUND: 'El colegio ya no existe.',
  RATE_LIMITED: 'Registraste muchas cuentas seguidas. Espera unos minutos.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  UNKNOWN: 'No se pudo completar la acción. Intenta de nuevo.',
};
