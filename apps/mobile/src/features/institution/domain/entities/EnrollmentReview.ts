/** Menor pendiente de validación, como lo ve el personal de su colegio (E1-03). */
export type PendingEnrollment = {
  id: string;
  name: string;
  registeredAt: string;
};

/** Datos para verificar la matrícula. Leerlos queda registrado en audit_log (D1). */
export type EnrollmentDetail = {
  id: string;
  name: string;
  document: string;
  photoUrl: string | null;
  status: 'PENDIENTE_VALIDACION' | 'ACTIVO' | 'INACTIVO';
};
