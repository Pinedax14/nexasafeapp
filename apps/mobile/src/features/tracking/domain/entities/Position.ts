/** Posición tomada por el GPS del teléfono del menor. */
export type Position = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  /** Hora del teléfono (ISO 8601). */
  capturedAt: string;
};

/** Respuesta del servidor a cada posición: dice qué sigue activo para saber cuándo parar. */
export type PositionReport = {
  accepted: boolean;
  tripActive: boolean;
  alertActive: boolean;
  /** El servidor cerró el trayecto por llegar al destino (E4-03, D21). */
  tripClosed: boolean;
};

/** Posición que ve el guardián en vivo (E4-02, D20). */
export type LivePosition = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  /** Hora del servidor (ISO 8601). */
  receivedAt: string;
};

/** D18: en el trayecto cada 15 s o 20 m; durante una alerta cada 5 s (RF-24). */
export type SharingMode = 'TRIP' | 'ALERT';

export type LocationPermission = 'GRANTED' | 'UNDETERMINED' | 'DENIED';
