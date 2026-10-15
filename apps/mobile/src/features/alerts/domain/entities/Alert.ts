/** alertas.estado (Diseño, cap. 6). En el Sprint 03 solo se usan ENVIADA y CANCELADA. */
export type AlertStatus = 'ENVIADA' | 'CANCELADA' | 'ATENDIDA' | 'CERRADA';

export type Alert = {
  id: string;
  status: AlertStatus;
  /** Hora del servidor (ISO 8601). */
  createdAt: string;
  /** Fin de la ventana de cancelación con PIN, hora del servidor (D22). */
  cancellableUntil: string;
};
