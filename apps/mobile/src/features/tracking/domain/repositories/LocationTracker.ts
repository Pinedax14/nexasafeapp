import { LocationPermission, Position, SharingMode } from '../entities/Position';

/** GPS del teléfono con el servicio en primer plano de Android (D18). */
export interface LocationTracker {
  permission(): Promise<LocationPermission>;
  /** Pide la ubicación en primer plano y luego "todo el tiempo". */
  requestPermission(): Promise<LocationPermission>;
  /** false si el teléfono no permite seguir la ubicación (por ejemplo, en el navegador). */
  start(mode: SharingMode): Promise<boolean>;
  stop(): Promise<void>;
  /** Modo con el que está capturando, o null si no captura. */
  currentMode(): Promise<SharingMode | null>;
  /** Recibe las posiciones que entrega el sistema, aunque la app esté en segundo plano. */
  onPositions(handler: (positions: Position[]) => Promise<void>): void;
}
