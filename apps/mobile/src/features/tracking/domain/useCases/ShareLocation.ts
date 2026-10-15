import { LocationPermission, Position, PositionReport, SharingMode } from '../entities/Position';
import { LocationTracker } from '../repositories/LocationTracker';
import { PositionRepository } from '../repositories/PositionRepository';

/** D18: frecuencia de la captura según lo que esté activo (RNF-11, RF-24). */
export const SHARING_SETTINGS: Record<SharingMode, { intervalMs: number; distanceMeters: number }> =
  {
    TRIP: { intervalMs: 15000, distanceMeters: 20 },
    ALERT: { intervalMs: 5000, distanceMeters: 0 },
  };

/** Una alerta activa manda sobre el trayecto; sin ninguno de los dos no se captura (RF-41). */
export function sharingModeFor(tripActive: boolean, alertActive: boolean): SharingMode | null {
  if (alertActive) return 'ALERT';
  if (tripActive) return 'TRIP';
  return null;
}

/**
 * E4-02, E6-05 y E4-03: el teléfono del menor comparte su ubicación solo mientras tenga un
 * trayecto EN_CURSO o una alerta activa, y deja de hacerlo cuando el servidor dice que ya no.
 */
export class ShareLocation {
  private readonly listeners = new Set<(report: PositionReport) => void>();

  constructor(
    private readonly repository: PositionRepository,
    private readonly tracker: LocationTracker,
  ) {
    tracker.onPositions((positions) => this.handlePositions(positions));
  }

  permission(): Promise<LocationPermission> {
    return this.tracker.permission();
  }

  requestPermission(): Promise<LocationPermission> {
    return this.tracker.requestPermission();
  }

  /** Arranca, cambia de frecuencia o detiene la captura. false si falta el permiso. */
  async sync(tripActive: boolean, alertActive: boolean): Promise<boolean> {
    const mode = sharingModeFor(tripActive, alertActive);
    const current = await this.tracker.currentMode();
    if (mode === current) return true;
    if (!mode) {
      await this.tracker.stop();
      return true;
    }
    if ((await this.tracker.permission()) !== 'GRANTED') return false;
    if (current) await this.tracker.stop();
    return this.tracker.start(mode);
  }

  /** Envía la posición más reciente y ajusta la captura según la respuesta del servidor. */
  async handlePositions(positions: Position[]): Promise<void> {
    const latest = positions[positions.length - 1];
    if (!latest) return;
    const result = await this.repository.send(latest);
    if (!result.ok) {
      // El servidor ya no ve trayecto ni alerta activos: se deja de capturar.
      if (result.reason === 'NOT_ACTIVE') await this.sync(false, false);
      return;
    }
    await this.sync(result.value.tripActive, result.value.alertActive);
    this.listeners.forEach((listener) => listener(result.value));
  }

  /** Avisa cada respuesta del servidor (por ejemplo, el cierre del trayecto). */
  onReport(listener: (report: PositionReport) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
