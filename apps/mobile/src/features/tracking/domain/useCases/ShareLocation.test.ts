import { Position, PositionReport, SharingMode } from '../entities/Position';
import { LocationTracker } from '../repositories/LocationTracker';
import { PositionRepository } from '../repositories/PositionRepository';
import { SHARING_SETTINGS, ShareLocation, sharingModeFor } from './ShareLocation';

const position: Position = {
  latitude: 4.6,
  longitude: -74.08,
  accuracyMeters: 8,
  capturedAt: '2026-10-15T12:00:00Z',
};

const report = (overrides: Partial<PositionReport> = {}): PositionReport => ({
  accepted: true,
  tripActive: true,
  alertActive: false,
  tripClosed: false,
  ...overrides,
});

function setup(options: { mode?: SharingMode | null; permission?: 'GRANTED' | 'DENIED' } = {}) {
  let mode: SharingMode | null = options.mode ?? null;
  let handler: ((positions: Position[]) => Promise<void>) | null = null;
  const tracker: jest.Mocked<LocationTracker> = {
    permission: jest.fn().mockResolvedValue(options.permission ?? 'GRANTED'),
    requestPermission: jest.fn().mockResolvedValue('GRANTED'),
    start: jest.fn(async (next: SharingMode) => {
      mode = next;
      return true;
    }),
    stop: jest.fn(async () => {
      mode = null;
    }),
    currentMode: jest.fn(async () => mode),
    onPositions: jest.fn((next) => {
      handler = next;
    }),
  };
  const repository: jest.Mocked<PositionRepository> = {
    send: jest.fn().mockResolvedValue({ ok: true, value: report() }),
    latest: jest.fn(),
    subscribe: jest.fn(),
  };
  const share = new ShareLocation(repository, tracker);
  return { tracker, repository, share, deliver: (positions: Position[]) => handler?.(positions) };
}

describe('ShareLocation (E4-02, E6-05, E4-03)', () => {
  it('D18: trayecto cada 15 s o 20 m; alerta cada 5 s', () => {
    expect(SHARING_SETTINGS.TRIP).toEqual({ intervalMs: 15000, distanceMeters: 20 });
    expect(SHARING_SETTINGS.ALERT).toEqual({ intervalMs: 5000, distanceMeters: 0 });
  });

  it('la alerta manda sobre el trayecto y sin ninguno no se captura (RF-41)', () => {
    expect(sharingModeFor(true, true)).toBe('ALERT');
    expect(sharingModeFor(false, true)).toBe('ALERT');
    expect(sharingModeFor(true, false)).toBe('TRIP');
    expect(sharingModeFor(false, false)).toBeNull();
  });

  it('con trayecto arranca la captura del trayecto', async () => {
    const { tracker, share } = setup();

    expect(await share.sync(true, false)).toBe(true);
    expect(tracker.start).toHaveBeenCalledWith('TRIP');
  });

  it('si ya captura en el modo correcto no la reinicia', async () => {
    const { tracker, share } = setup({ mode: 'TRIP' });

    expect(await share.sync(true, false)).toBe(true);
    expect(tracker.start).not.toHaveBeenCalled();
    expect(tracker.stop).not.toHaveBeenCalled();
  });

  it('al disparar una alerta cambia a cada 5 s (E6-05)', async () => {
    const { tracker, share } = setup({ mode: 'TRIP' });

    await share.sync(true, true);

    expect(tracker.stop).toHaveBeenCalled();
    expect(tracker.start).toHaveBeenCalledWith('ALERT');
  });

  it('sin trayecto ni alerta detiene la captura', async () => {
    const { tracker, share } = setup({ mode: 'TRIP' });

    expect(await share.sync(false, false)).toBe(true);
    expect(tracker.stop).toHaveBeenCalled();
  });

  it('sin permiso no arranca', async () => {
    const { tracker, share } = setup({ permission: 'DENIED' });

    expect(await share.sync(true, false)).toBe(false);
    expect(tracker.start).not.toHaveBeenCalled();
  });

  it('pide y consulta el permiso al GPS', async () => {
    const { tracker, share } = setup();

    expect(await share.permission()).toBe('GRANTED');
    expect(await share.requestPermission()).toBe('GRANTED');
    expect(tracker.requestPermission).toHaveBeenCalled();
  });

  it('envía la posición más reciente de cada entrega', async () => {
    const { repository, deliver } = setup({ mode: 'TRIP' });
    const newer = { ...position, latitude: 4.61 };

    await deliver([position, newer]);

    expect(repository.send).toHaveBeenCalledTimes(1);
    expect(repository.send).toHaveBeenCalledWith(newer);
  });

  it('una entrega vacía no envía nada', async () => {
    const { repository, share } = setup();

    await share.handlePositions([]);

    expect(repository.send).not.toHaveBeenCalled();
  });

  it('cuando el servidor cierra el trayecto deja de capturar y lo avisa (E4-03)', async () => {
    const { tracker, repository, share } = setup({ mode: 'TRIP' });
    repository.send.mockResolvedValue({
      ok: true,
      value: report({ tripActive: false, tripClosed: true }),
    });
    const listener = jest.fn();
    share.onReport(listener);

    await share.handlePositions([position]);

    expect(tracker.stop).toHaveBeenCalled();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ tripClosed: true }));
  });

  it('si el servidor ya no ve nada activo, deja de capturar', async () => {
    const { tracker, repository, share } = setup({ mode: 'ALERT' });
    repository.send.mockResolvedValue({ ok: false, reason: 'NOT_ACTIVE' });

    await share.handlePositions([position]);

    expect(tracker.stop).toHaveBeenCalled();
  });

  it('un error de red no detiene la captura', async () => {
    const { tracker, repository, share } = setup({ mode: 'TRIP' });
    repository.send.mockResolvedValue({ ok: false, reason: 'NETWORK' });

    await share.handlePositions([position]);

    expect(tracker.stop).not.toHaveBeenCalled();
  });

  it('se puede dejar de escuchar las respuestas', async () => {
    const { share } = setup({ mode: 'TRIP' });
    const listener = jest.fn();
    const unsubscribe = share.onReport(listener);

    unsubscribe();
    await share.handlePositions([position]);

    expect(listener).not.toHaveBeenCalled();
  });
});
