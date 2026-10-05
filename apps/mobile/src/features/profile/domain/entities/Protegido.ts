export type ProtegidoStatus = 'PENDIENTE_VALIDACION' | 'ACTIVO' | 'INACTIVO';

export type Protegido = {
  id: string;
  name: string;
  schoolId: string;
  status: ProtegidoStatus;
  photoPath: string | null;
};

export type SchoolOption = {
  id: string;
  name: string;
};

/** Foto elegida en el dispositivo, antes de subirla. */
export type PhotoFile = {
  uri: string;
  mimeType: string;
  sizeBytes: number | null;
};
