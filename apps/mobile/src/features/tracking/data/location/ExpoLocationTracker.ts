import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { colors } from '../../../../core/theme/colors';
import { LocationPermission, Position, SharingMode } from '../../domain/entities/Position';
import { LocationTracker } from '../../domain/repositories/LocationTracker';
import { SHARING_SETTINGS } from '../../domain/useCases/ShareLocation';

export const LOCATION_TASK = 'nexasafe-ubicacion';

/** Notificación fija del servicio en primer plano de Android en el trayecto (D18). */
export const FOREGROUND_NOTIFICATION = {
  notificationTitle: 'NexaSafe te está acompañando',
  notificationBody:
    'Tu ubicación se comparte con tu acudiente mientras dura el trayecto o la alerta.',
  notificationColor: colors.primary,
};

/** E6-04 (D30): durante una alerta la notificación no revela que se pidió ayuda. */
export const DISCREET_NOTIFICATION = {
  notificationTitle: 'NexaSafe',
  notificationBody: 'Servicio activo',
  notificationColor: colors.textMuted,
};

type PositionsHandler = (positions: Position[]) => Promise<void>;
let positionsHandler: PositionsHandler | null = null;

export const toPosition = (location: Location.LocationObject): Position => ({
  latitude: location.coords.latitude,
  longitude: location.coords.longitude,
  accuracyMeters: location.coords.accuracy ?? 9999,
  capturedAt: new Date(location.timestamp).toISOString(),
});

/** Recibe las posiciones del sistema; se exporta para probarla sin el teléfono. */
export async function handleLocationTask({
  data,
  error,
}: {
  data: unknown;
  error: unknown;
}): Promise<void> {
  if (error || !positionsHandler) return;
  const locations = (data as { locations?: Location.LocationObject[] } | null)?.locations ?? [];
  if (locations.length > 0) await positionsHandler(locations.map(toPosition));
}

// La tarea debe definirse en el ámbito global del bundle: Android puede iniciar la app en
// segundo plano solo para entregar posiciones (documentación de expo-task-manager, SDK 54).
if (Platform.OS !== 'web' && !TaskManager.isTaskDefined(LOCATION_TASK)) {
  TaskManager.defineTask(LOCATION_TASK, handleLocationTask);
}

function toPermission(response: { granted: boolean; canAskAgain: boolean }): LocationPermission {
  if (response.granted) return 'GRANTED';
  return response.canAskAgain ? 'UNDETERMINED' : 'DENIED';
}

export class ExpoLocationTracker implements LocationTracker {
  private mode: SharingMode | null = null;

  async permission(): Promise<LocationPermission> {
    const foreground = toPermission(await Location.getForegroundPermissionsAsync());
    if (foreground !== 'GRANTED') return foreground;
    return toPermission(await Location.getBackgroundPermissionsAsync());
  }

  async requestPermission(): Promise<LocationPermission> {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) return 'DENIED';
    const background = await Location.requestBackgroundPermissionsAsync();
    return background.granted ? 'GRANTED' : 'DENIED';
  }

  async start(mode: SharingMode): Promise<boolean> {
    if (Platform.OS === 'web' || !(await TaskManager.isAvailableAsync())) return false;
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: SHARING_SETTINGS[mode].intervalMs,
        distanceInterval: SHARING_SETTINGS[mode].distanceMeters,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          ...(mode === 'ALERT' ? DISCREET_NOTIFICATION : FOREGROUND_NOTIFICATION),
          killServiceOnDestroy: false,
        },
      });
      this.mode = mode;
      return true;
    } catch {
      return false;
    }
  }

  async stop(): Promise<void> {
    this.mode = null;
    if (Platform.OS === 'web') return;
    if (await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
  }

  async currentMode(): Promise<SharingMode | null> {
    if (Platform.OS === 'web') return null;
    if (!(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK))) return null;
    // Si la app se reinició con la captura activa, se asume el modo del trayecto.
    return this.mode ?? 'TRIP';
  }

  onPositions(handler: PositionsHandler): void {
    positionsHandler = handler;
  }
}
