import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import {
  ExpoLocationTracker,
  FOREGROUND_NOTIFICATION,
  handleLocationTask,
  LOCATION_TASK,
  toPosition,
} from './ExpoLocationTracker';

jest.mock('expo-location', () => ({
  Accuracy: { High: 4 },
  getForegroundPermissionsAsync: jest.fn(),
  getBackgroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  hasStartedLocationUpdatesAsync: jest.fn(),
}));

jest.mock('expo-task-manager', () => ({
  isTaskDefined: jest.fn(() => false),
  defineTask: jest.fn(),
  isAvailableAsync: jest.fn(),
}));

const location = Location as jest.Mocked<typeof Location>;
const taskManager = TaskManager as jest.Mocked<typeof TaskManager>;
// Llamadas hechas al importar el módulo, antes de que beforeEach limpie los mocks.
const definedAtLoad = [...taskManager.defineTask.mock.calls];
const answer = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain }) as Awaited<ReturnType<typeof Location.getForegroundPermissionsAsync>>;

const fix = {
  coords: {
    latitude: 4.6,
    longitude: -74.08,
    accuracy: 8,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.parse('2026-10-15T12:00:00Z'),
};

beforeEach(() => {
  jest.clearAllMocks();
  location.hasStartedLocationUpdatesAsync.mockResolvedValue(false);
  taskManager.isAvailableAsync.mockResolvedValue(true);
});

describe('ExpoLocationTracker (D18)', () => {
  it('la tarea de ubicación se define al cargar el módulo', () => {
    expect(definedAtLoad).toEqual([[LOCATION_TASK, handleLocationTask]]);
  });

  it('convierte la posición del sistema y usa una precisión mala si no viene', () => {
    expect(toPosition(fix)).toEqual({
      latitude: 4.6,
      longitude: -74.08,
      accuracyMeters: 8,
      capturedAt: '2026-10-15T12:00:00.000Z',
    });
    expect(toPosition({ ...fix, coords: { ...fix.coords, accuracy: null } }).accuracyMeters).toBe(
      9999,
    );
  });

  it('el permiso es GRANTED solo con primer plano y "todo el tiempo"', async () => {
    const tracker = new ExpoLocationTracker();

    location.getForegroundPermissionsAsync.mockResolvedValue(answer(false));
    expect(await tracker.permission()).toBe('UNDETERMINED');

    location.getForegroundPermissionsAsync.mockResolvedValue(answer(false, false));
    expect(await tracker.permission()).toBe('DENIED');

    location.getForegroundPermissionsAsync.mockResolvedValue(answer(true));
    location.getBackgroundPermissionsAsync.mockResolvedValue(answer(false));
    expect(await tracker.permission()).toBe('UNDETERMINED');

    location.getBackgroundPermissionsAsync.mockResolvedValue(answer(true));
    expect(await tracker.permission()).toBe('GRANTED');
  });

  it('pide primero la ubicación en primer plano y luego "todo el tiempo"', async () => {
    const tracker = new ExpoLocationTracker();

    location.requestForegroundPermissionsAsync.mockResolvedValue(answer(false));
    expect(await tracker.requestPermission()).toBe('DENIED');
    expect(location.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();

    location.requestForegroundPermissionsAsync.mockResolvedValue(answer(true));
    location.requestBackgroundPermissionsAsync.mockResolvedValue(answer(false));
    expect(await tracker.requestPermission()).toBe('DENIED');

    location.requestBackgroundPermissionsAsync.mockResolvedValue(answer(true));
    expect(await tracker.requestPermission()).toBe('GRANTED');
  });

  it('arranca con el servicio en primer plano y la frecuencia del modo', async () => {
    const tracker = new ExpoLocationTracker();

    expect(await tracker.start('ALERT')).toBe(true);
    expect(location.startLocationUpdatesAsync).toHaveBeenCalledWith(LOCATION_TASK, {
      accuracy: 4,
      timeInterval: 5000,
      distanceInterval: 0,
      pausesUpdatesAutomatically: false,
      foregroundService: { ...FOREGROUND_NOTIFICATION, killServiceOnDestroy: false },
    });
    location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    expect(await tracker.currentMode()).toBe('ALERT');
  });

  it('sin TaskManager disponible no arranca', async () => {
    taskManager.isAvailableAsync.mockResolvedValue(false);

    expect(await new ExpoLocationTracker().start('TRIP')).toBe(false);
    expect(location.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });

  it('si el sistema rechaza el arranque informa false', async () => {
    location.startLocationUpdatesAsync.mockRejectedValue(new Error('denegado'));

    expect(await new ExpoLocationTracker().start('TRIP')).toBe(false);
  });

  it('se detiene solo si estaba capturando', async () => {
    const tracker = new ExpoLocationTracker();

    await tracker.stop();
    expect(location.stopLocationUpdatesAsync).not.toHaveBeenCalled();

    location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    await tracker.stop();
    expect(location.stopLocationUpdatesAsync).toHaveBeenCalledWith(LOCATION_TASK);
  });

  it('sin captura el modo es null; tras reiniciar la app con captura se asume TRIP', async () => {
    const tracker = new ExpoLocationTracker();

    expect(await tracker.currentMode()).toBeNull();
    location.hasStartedLocationUpdatesAsync.mockResolvedValue(true);
    expect(await tracker.currentMode()).toBe('TRIP');
  });

  it('la tarea entrega las posiciones al manejador registrado', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    new ExpoLocationTracker().onPositions(handler);

    await handleLocationTask({ data: { locations: [fix] }, error: null });
    await handleLocationTask({ data: { locations: [] }, error: null });
    await handleLocationTask({ data: null, error: null });
    await handleLocationTask({ data: { locations: [fix] }, error: new Error('x') });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith([toPosition(fix)]);
  });
});
