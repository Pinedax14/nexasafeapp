import { PhotoFile, Protegido, SchoolOption } from '../entities/Protegido';

export type ProfileFailureReason =
  | 'FORBIDDEN'
  | 'POLICY_OUTDATED'
  | 'INVALID_DATA'
  | 'PHOTO_UPLOAD_FAILED'
  | 'NOT_ACTIVE'
  | 'DOCUMENT_HAS_PIN'
  | 'NETWORK'
  | 'UNKNOWN';

export type ProfileResult<T> = { ok: true; value: T } | { ok: false; reason: ProfileFailureReason };

export type ProtegidoRegistration = {
  name: string;
  document: string;
  schoolId: string;
  photoPath: string;
  policyVersion: string;
};

export interface ProtegidoRepository {
  listMine(): Promise<ProfileResult<Protegido[]>>;
  listSchools(): Promise<ProfileResult<SchoolOption[]>>;
  currentPolicyVersion(): Promise<ProfileResult<string>>;
  /** Sube la foto a la carpeta del guardián y devuelve su ruta en Storage. */
  uploadPhoto(guardianId: string, photo: PhotoFile): Promise<ProfileResult<string>>;
  /** Alta atómica: menor + foto + consentimiento (RF-02, RF-38). */
  register(registration: ProtegidoRegistration): Promise<ProfileResult<string>>;
  /** E1-04 (D5): el guardián asigna el PIN de 4 dígitos a su menor ACTIVO. */
  assignPin(protegidoId: string, pin: string): Promise<ProfileResult<void>>;
  /** E1-04: el servidor genera un PIN aleatorio, lo asigna y lo devuelve una sola vez. */
  generatePin(protegidoId: string): Promise<ProfileResult<string>>;
}
