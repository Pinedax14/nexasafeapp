import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { RouteRepository } from '../../../routes/domain/repositories/RouteRepository';
import { ManageRoutes } from '../../../routes/domain/useCases/ManageRoutes';
import { LivePosition } from '../../domain/entities/Position';
import { LiveHandlers, PositionRepository } from '../../domain/repositories/PositionRepository';
import { TripRepository } from '../../domain/repositories/TripRepository';
import { TrackTrips } from '../../domain/useCases/TrackTrips';
import { WatchLive } from '../../domain/useCases/WatchLive';
import { arrivedAtText, NO_LIVE_POSITION, TRIP_ERROR_MESSAGES, tripSince } from '../tripMessages';
import { GuardianLiveScreen } from './GuardianLiveScreen';

const mockInjectJavaScript = jest.fn();

jest.mock('react-native-webview', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    WebView: forwardRef((props: object, ref: unknown) => {
      useImperativeHandle(ref, () => ({ injectJavaScript: mockInjectJavaScript }));
      return <View {...props} />;
    }),
  };
});

const route = {
  id: 'r-1',
  direction: 'CASA_COLEGIO' as const,
  points: [
    { latitude: 4.6, longitude: -74.08 },
    { latitude: 4.61, longitude: -74.07 },
  ],
  corridorMeters: 50,
  expectedMinutes: 25,
  updatedAt: '2026-10-12T15:00:00Z',
};

const trip = {
  id: 't-1',
  protegidoId: 'p-1',
  routeId: 'r-1',
  startedAt: '2026-10-15T11:42:00Z',
  status: 'EN_CURSO' as const,
};

const live: LivePosition = {
  latitude: 4.605,
  longitude: -74.075,
  accuracyMeters: 8,
  receivedAt: new Date().toISOString(),
};

type Options = {
  latest?: Awaited<ReturnType<PositionRepository['latest']>>;
  trips?: Awaited<ReturnType<TripRepository['listActive']>>;
};

async function setup(options: Options = {}) {
  let handlers: LiveHandlers | null = null;
  const unsubscribe = jest.fn();
  const positions: jest.Mocked<PositionRepository> = {
    send: jest.fn(),
    latest: jest.fn().mockResolvedValue(options.latest ?? { ok: true, value: null }),
    subscribe: jest.fn((_id, next) => {
      handlers = next;
      return unsubscribe;
    }),
  };
  const trips: jest.Mocked<TripRepository> = {
    listActive: jest.fn().mockResolvedValue(options.trips ?? { ok: true, value: [trip] }),
    start: jest.fn(),
  };
  const routes: jest.Mocked<RouteRepository> = {
    list: jest.fn().mockResolvedValue({ ok: true, value: [route] }),
    save: jest.fn(),
  };
  const onBack = jest.fn();
  const view = await render(
    <GuardianLiveScreen
      watchLive={new WatchLive(positions)}
      trackTrips={new TrackTrips(trips)}
      manageRoutes={new ManageRoutes(routes)}
      protegidoId="p-1"
      protegidoName="Menor Uno"
      onBack={onBack}
    />,
  );
  return { positions, unsubscribe, onBack, view, handlers: () => handlers as LiveHandlers | null };
}

const lastRender = () => mockInjectJavaScript.mock.calls.at(-1)?.[0] as string | undefined;

describe('GuardianLiveScreen (E4-02, E4-03)', () => {
  beforeEach(() => mockInjectJavaScript.mockClear());

  it('muestra la ruta del trayecto y espera la primera posición', async () => {
    await setup();

    expect(await screen.findByText('Menor Uno · Casa → colegio')).toBeTruthy();
    expect(screen.getByText(tripSince(trip.startedAt))).toBeTruthy();
    expect(screen.getByText(NO_LIVE_POSITION)).toBeTruthy();
  });

  it('dibuja la última posición sobre el mapa', async () => {
    await setup({ latest: { ok: true, value: live } });

    expect(await screen.findByText(/Última posición: hace \d+ s/)).toBeTruthy();
    await fireEvent(screen.getByTestId('mapa-ruta'), 'message', {
      nativeEvent: { data: JSON.stringify({ type: 'ready' }) },
    });
    expect(lastRender()).toContain('"live":{"latitude":4.605,"longitude":-74.075}');
  });

  it('las posiciones que llegan por el canal actualizan el mapa', async () => {
    const { handlers } = await setup();
    await screen.findByText(NO_LIVE_POSITION);

    await act(async () => handlers()?.onPosition({ ...live, latitude: 4.607 }));

    expect(await screen.findByText(/Última posición: hace \d+ s/)).toBeTruthy();
  });

  it('cuando el menor llega muestra la hora de llegada (E4-03)', async () => {
    const { handlers } = await setup({ latest: { ok: true, value: live } });
    await screen.findByText(/Última posición/);

    await act(async () => handlers()?.onTripClosed());

    expect(screen.getByText(/^Llegó a las /)).toBeTruthy();
    expect(arrivedAtText('2026-10-15T12:05:00Z')).toMatch(/^Llegó a las /);
  });

  it('deja de escuchar el canal al salir de la pantalla', async () => {
    const { unsubscribe, view } = await setup();
    await screen.findByText(NO_LIVE_POSITION);

    await view.unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  it('muestra el error si no puede leer la posición', async () => {
    await setup({ latest: { ok: false, reason: 'FORBIDDEN' } });

    expect(await screen.findByText(TRIP_ERROR_MESSAGES.FORBIDDEN)).toBeTruthy();
  });

  it('muestra el error si no puede leer el trayecto', async () => {
    await setup({ trips: { ok: false, reason: 'NETWORK' } });

    expect(await screen.findByText(TRIP_ERROR_MESSAGES.NETWORK)).toBeTruthy();
  });

  it('vuelve a Mis menores', async () => {
    const { onBack } = await setup();

    await fireEvent.press(await screen.findByText('‹ Mis menores'));

    expect(onBack).toHaveBeenCalled();
  });
});
