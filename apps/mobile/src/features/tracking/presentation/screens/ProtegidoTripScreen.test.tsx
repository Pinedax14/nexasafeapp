import { fireEvent, render, screen } from '@testing-library/react-native';
import { ProtegidoRepository } from '../../../profile/domain/repositories/ProtegidoRepository';
import { ListMyProtegidos } from '../../../profile/domain/useCases/ListMyProtegidos';
import { RouteRepository } from '../../../routes/domain/repositories/RouteRepository';
import { ManageRoutes } from '../../../routes/domain/useCases/ManageRoutes';
import { Trip } from '../../domain/entities/Trip';
import { TripRepository } from '../../domain/repositories/TripRepository';
import { TrackTrips } from '../../domain/useCases/TrackTrips';
import { formatTime, NO_ROUTES_MESSAGE, TRIP_ERROR_MESSAGES, tripSince } from '../tripMessages';
import { ProtegidoTripScreen } from './ProtegidoTripScreen';

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

const trip: Trip = {
  id: 't-1',
  protegidoId: 'p-1',
  routeId: 'r-1',
  startedAt: '2026-10-12T11:42:00Z',
  status: 'EN_CURSO',
};

type Options = {
  routes?: Awaited<ReturnType<RouteRepository['list']>>;
  trips?: Trip[][];
  start?: Awaited<ReturnType<TripRepository['start']>>;
  profile?: Awaited<ReturnType<ProtegidoRepository['listMine']>>;
};

async function setup(options: Options = {}) {
  const profiles: jest.Mocked<ProtegidoRepository> = {
    listMine: jest.fn().mockResolvedValue(
      options.profile ?? {
        ok: true,
        value: [{ id: 'p-1', name: 'Menor', schoolId: 's-1', status: 'ACTIVO', photoPath: null }],
      },
    ),
    listSchools: jest.fn(),
    currentPolicyVersion: jest.fn(),
    uploadPhoto: jest.fn(),
    register: jest.fn(),
    assignPin: jest.fn(),
    generatePin: jest.fn(),
  };
  const routes: jest.Mocked<RouteRepository> = {
    list: jest.fn().mockResolvedValue(options.routes ?? { ok: true, value: [route] }),
    save: jest.fn(),
  };
  const sequence = options.trips ?? [[]];
  const trips: jest.Mocked<TripRepository> = {
    listActive: jest.fn(),
    start: jest.fn().mockResolvedValue(options.start ?? { ok: true, value: 't-1' }),
  };
  sequence.forEach((value) => trips.listActive.mockResolvedValueOnce({ ok: true, value }));
  trips.listActive.mockResolvedValue({ ok: true, value: sequence[sequence.length - 1] });

  await render(
    <ProtegidoTripScreen
      listMyProtegidos={new ListMyProtegidos(profiles)}
      manageRoutes={new ManageRoutes(routes)}
      trackTrips={new TrackTrips(trips)}
      userName="Menor"
      onSignOut={jest.fn()}
    />,
  );
  return { trips, routes };
}

describe('ProtegidoTripScreen (E4-01)', () => {
  it('el protegido inicia su trayecto con un toque', async () => {
    const { trips } = await setup({ trips: [[], [trip]] });

    await fireEvent.press(await screen.findByLabelText('Iniciar trayecto Casa → colegio'));

    expect(trips.start).toHaveBeenCalledWith('r-1');
    expect(await screen.findByText(tripSince(trip.startedAt))).toBeTruthy();
    expect(screen.getByText('Tu acudiente sabe que vas en camino.')).toBeTruthy();
  });

  it('con un trayecto en curso no muestra los botones para iniciar otro', async () => {
    await setup({ trips: [[trip]] });

    expect(await screen.findByText(tripSince(trip.startedAt))).toBeTruthy();
    expect(screen.queryByLabelText('Iniciar trayecto Casa → colegio')).toBeNull();
  });

  it('si el servidor dice que ya hay un trayecto, muestra el trayecto en curso', async () => {
    await setup({ trips: [[], [trip]], start: { ok: false, reason: 'ALREADY_ACTIVE' } });

    await fireEvent.press(await screen.findByLabelText('Iniciar trayecto Casa → colegio'));

    expect(await screen.findByText(tripSince(trip.startedAt))).toBeTruthy();
  });

  it('sin rutas definidas explica por qué no puede iniciar', async () => {
    await setup({ routes: { ok: true, value: [] } });

    expect(await screen.findByText(NO_ROUTES_MESSAGE)).toBeTruthy();
    expect(screen.queryByText('¿A dónde vas?')).toBeNull();
  });

  it('sin conexión no dice que faltan rutas', async () => {
    await setup({ routes: { ok: false, reason: 'NETWORK' } });

    expect(await screen.findByText(TRIP_ERROR_MESSAGES.NETWORK)).toBeTruthy();
    expect(screen.queryByText(NO_ROUTES_MESSAGE)).toBeNull();
  });

  it('muestra el error si no pudo iniciar', async () => {
    await setup({ start: { ok: false, reason: 'NOT_ACTIVE' } });

    await fireEvent.press(await screen.findByLabelText('Iniciar trayecto Casa → colegio'));

    expect(await screen.findByText(TRIP_ERROR_MESSAGES.NOT_ACTIVE)).toBeTruthy();
  });

  it('muestra un error si no encuentra el perfil del menor', async () => {
    await setup({ profile: { ok: true, value: [] } });

    expect(await screen.findByText(TRIP_ERROR_MESSAGES.UNKNOWN)).toBeTruthy();
  });
});

describe('formatTime', () => {
  it('usa el formato colombiano de 12 horas', () => {
    const at = (h: number, m: number) => new Date(2026, 9, 12, h, m).toISOString();

    expect(formatTime(at(6, 42))).toBe('6:42 a. m.');
    expect(formatTime(at(0, 5))).toBe('12:05 a. m.');
    expect(formatTime(at(12, 0))).toBe('12:00 p. m.');
    expect(formatTime(at(18, 7))).toBe('6:07 p. m.');
  });
});
