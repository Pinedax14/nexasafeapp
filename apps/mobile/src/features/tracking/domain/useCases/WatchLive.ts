import { LivePosition } from '../entities/Position';
import { LiveHandlers, PositionRepository } from '../repositories/PositionRepository';
import { TripResult } from '../repositories/TripRepository';

/** E4-02 (D20): el guardián sigue en vivo la posición de su menor durante el trayecto. */
export class WatchLive {
  constructor(private readonly repository: PositionRepository) {}

  latest(protegidoId: string): Promise<TripResult<LivePosition | null>> {
    return this.repository.latest(protegidoId);
  }

  subscribe(protegidoId: string, handlers: LiveHandlers): () => void {
    return this.repository.subscribe(protegidoId, handlers);
  }

  /** Segundos desde la última posición, para "Última posición: hace 12 s". */
  secondsSince(position: LivePosition, now: Date): number {
    return Math.max(0, Math.round((now.getTime() - Date.parse(position.receivedAt)) / 1000));
  }
}
