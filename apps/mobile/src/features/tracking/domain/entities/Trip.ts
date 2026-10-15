/** trayectos.estado en la fase 1. DESVIADO, ALERTA y VENCIDO llegan en la fase 2 (E5). */
export type TripStatus = 'EN_CURSO' | 'CERRADO';

export type Trip = {
  id: string;
  protegidoId: string;
  routeId: string;
  /** Hora del servidor (ISO 8601). */
  startedAt: string;
  status: TripStatus;
};
