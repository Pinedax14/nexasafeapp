import { PhotoFile, SchoolOption } from '../entities/Protegido';
import { ProfileResult, ProtegidoRepository } from '../repositories/ProtegidoRepository';

export const MAX_NAME_LENGTH = 100;
/** Límite del bucket fotos-protegidos (2 MB). */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png'];
const DOCUMENT_PATTERN = /^[A-Za-z0-9]{5,20}$/;

export type ProtegidoField = 'name' | 'document' | 'school' | 'photo' | 'consent';
export type ProtegidoErrors = Partial<Record<ProtegidoField, string>>;

export type ProtegidoForm = {
  name: string;
  document: string;
  schoolId: string | null;
  photo: PhotoFile | null;
  consentAccepted: boolean;
  policyVersion: string;
};

export type RegisterProtegidoResult =
  ProfileResult<string> | { ok: false; reason: 'INVALID_INPUT'; errors: ProtegidoErrors };

/** El documento se guarda sin espacios, puntos ni guiones. */
export function normalizeDocument(document: string): string {
  return document.replace(/[\s.-]/g, '');
}

export function validateProtegido(form: ProtegidoForm): ProtegidoErrors {
  const errors: ProtegidoErrors = {};
  const name = form.name.trim();
  if (!name || name.length > MAX_NAME_LENGTH) errors.name = 'Ingresa el nombre del menor.';
  if (!DOCUMENT_PATTERN.test(normalizeDocument(form.document))) {
    errors.document = 'Ingresa el número de documento (entre 5 y 20 letras o números).';
  }
  if (!form.schoolId) errors.school = 'Elige el colegio.';
  if (!form.photo) {
    errors.photo = 'Agrega una foto del menor.';
  } else if (!ALLOWED_PHOTO_TYPES.includes(form.photo.mimeType)) {
    errors.photo = 'La foto debe ser JPG o PNG.';
  } else if (form.photo.sizeBytes !== null && form.photo.sizeBytes > MAX_PHOTO_BYTES) {
    errors.photo = 'La foto no puede pesar más de 2 MB.';
  }
  if (!form.consentAccepted) {
    errors.consent = 'Debes aceptar la política de tratamiento de datos para registrar al menor.';
  }
  return errors;
}

/**
 * E1-02 + E11-01: registra al menor en PENDIENTE_VALIDACION con su foto y el
 * consentimiento del acudiente. Sin consentimiento no se sube ni se guarda nada.
 */
export class RegisterProtegido {
  constructor(private readonly repository: ProtegidoRepository) {}

  async loadForm(): Promise<ProfileResult<{ schools: SchoolOption[]; policyVersion: string }>> {
    const [schools, policyVersion] = await Promise.all([
      this.repository.listSchools(),
      this.repository.currentPolicyVersion(),
    ]);
    if (!schools.ok) return schools;
    if (!policyVersion.ok) return policyVersion;
    return { ok: true, value: { schools: schools.value, policyVersion: policyVersion.value } };
  }

  async execute(guardianId: string, form: ProtegidoForm): Promise<RegisterProtegidoResult> {
    const errors = validateProtegido(form);
    if (Object.keys(errors).length > 0 || !form.photo || !form.schoolId) {
      return { ok: false, reason: 'INVALID_INPUT', errors };
    }

    const upload = await this.repository.uploadPhoto(guardianId, form.photo);
    if (!upload.ok) return upload;

    return this.repository.register({
      name: form.name.trim(),
      document: normalizeDocument(form.document),
      schoolId: form.schoolId,
      photoPath: upload.value,
      policyVersion: form.policyVersion,
    });
  }
}
