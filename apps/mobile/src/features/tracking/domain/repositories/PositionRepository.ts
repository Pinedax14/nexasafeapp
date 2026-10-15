import { LivePosition, Position, PositionReport } from '../entities/Position';
import { TripResult } from './TripRepository';

export type LiveHandlers = {
  onPosition: (position: LivePosition) => void;
  onTripClosed: () => void;
};

export interface PositionRepository {
  /** Solo se acepta con un trayecto EN_CURSO o una alerta activa (RF-41). */
  send(position: Position): Promise<TripResult<PositionReport>>;
  /** Última posición del menor mientras haya trayecto o alerta activos; lectura auditada. */
  latest(protegidoId: string): Promise<TripResult<LivePosition | null>>;
  /** Escucha el canal privado del menor; devuelve la función para dejar de escuchar. */
  subscribe(protegidoId: string, handlers: LiveHandlers): () => void;
}
