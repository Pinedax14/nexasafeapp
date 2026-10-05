import { PhotoFile, Protegido, SchoolOption } from '../entities/Protegido';

export type ProfileFailureReason =
  'FORBIDDEN' | 'POLICY_OUTDATED' | 'INVALID_DATA' | 'PHOTO_UPLOAD_FAILED' | 'NETWORK' | 'UNKNOWN';

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
}
