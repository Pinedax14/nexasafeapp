import { Trip } from '../entities/Trip';
import { TripRepository, TripResult } from '../repositories/TripRepository';

/** E4-01: el protegido inicia su trayecto con un toque y el guardián lo ve EN_CURSO. */
export class TrackTrips {
  constructor(private readonly repository: TripRepository) {}

  listActive(): Promise<TripResult<Trip[]>> {
    return this.repository.listActive();
  }

  /** Trayecto en curso de un menor, o null si no tiene. */
  async activeFor(protegidoId: string): Promise<TripResult<Trip | null>> {
    const result = await this.repository.listActive();
    if (!result.ok) return result;
    return {
      ok: true,
      value: result.value.find((trip) => trip.protegidoId === protegidoId) ?? null,
    };
  }

  /** Un solo trayecto EN_CURSO por menor: el servidor también lo garantiza. */
  async start(routeId: string, current: Trip | null): Promise<TripResult<string>> {
    if (current?.status === 'EN_CURSO') return { ok: false, reason: 'ALREADY_ACTIVE' };
    return this.repository.start(routeId);
  }
}
