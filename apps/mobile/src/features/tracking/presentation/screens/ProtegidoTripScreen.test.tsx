import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from '../../../alerts/domain/entities/Alert';
import { AlertRepository } from '../../../alerts/domain/repositories/AlertRepository';
import { PanicAlerts } from '../../../alerts/domain/useCases/PanicAlerts';
import {
  ALERT_ACTIVE_MESSAGE,
  ALERT_CANCELLED_MESSAGE,
  ALERT_ERROR_MESSAGES,
  ALERT_SENT_TITLE,
} from '../../../alerts/presentation/alertMessages';
import { ProtegidoRepository } from '../../../profile/domain/repositories/ProtegidoRepository';
import { ListMyProtegidos } from '../../../profile/domain/useCases/ListMyProtegidos';
import { RouteRepository } from '../../../routes/domain/repositories/RouteRepository';
import { ManageRoutes } from '../../../routes/domain/useCases/ManageRoutes';
import { Trip } from '../../domain/entities/Trip';
import { TripRepository } from '../../domain/repositories/TripRepository';
import { TrackTrips } from '../../domain/useCases/TrackTrips';
import { formatTime, NO_ROUTES_MESSAGE, TRIP_ERROR_MESSAGES, tripSince } from '../tripMessages';
import { ACCOMPANIMENT_TEXT } from '../components/AccompanimentBanner';
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
  alerts?: Partial<jest.Mocked<AlertRepository>>;
};

const sentAlert: Alert = {
  id: 'al-1',
  status: 'ENVIADA',
  createdAt: '2026-10-15T12:00:00Z',
  cancellableUntil: '2026-10-15T12:00:10Z',
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
  const alerts: jest.Mocked<AlertRepository> = {
    trigger: jest.fn().mockResolvedValue({ ok: true, value: sentAlert }),
    cancel: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
    active: jest.fn().mockResolvedValue({ ok: true, value: null }),
    ...options.alerts,
  };

  await render(
    <ProtegidoTripScreen
      listMyProtegidos={new ListMyProtegidos(profiles)}
      manageRoutes={new ManageRoutes(routes)}
      trackTrips={new TrackTrips(trips)}
      panicAlerts={new PanicAlerts(alerts)}
      userName="Menor"
      onSignOut={jest.fn()}
    />,
  );
  return { trips, routes, alerts };
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

describe('ProtegidoTripScreen · indicador de acompañamiento (E4-04)', () => {
  it('al iniciar el trayecto aparece la banda "Te estamos acompañando"', async () => {
    await setup({ trips: [[], [trip]] });

    expect(await screen.findByLabelText('Iniciar trayecto Casa → colegio')).toBeTruthy();
    expect(screen.queryByText(ACCOMPANIMENT_TEXT)).toBeNull();

    await fireEvent.press(screen.getByLabelText('Iniciar trayecto Casa → colegio'));

    expect(await screen.findByText(ACCOMPANIMENT_TEXT)).toBeTruthy();
  });

  it('sin trayecto en curso no hay banda', async () => {
    await setup({ trips: [[]] });

    expect(await screen.findByText('¿A dónde vas?')).toBeTruthy();
    expect(screen.queryByText(ACCOMPANIMENT_TEXT)).toBeNull();
  });
});

describe('ProtegidoTripScreen · botón de pánico (E6-01, E6-03)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  async function hold(ms: number) {
    const button = await screen.findByLabelText('Botón de ayuda');
    await fireEvent(button, 'pressIn');
    await act(async () => {
      jest.advanceTimersByTime(ms);
    });
    await fireEvent(button, 'pressOut');
  }

  it('mantener presionado 3 s dispara la alerta y muestra la cuenta regresiva', async () => {
    const { alerts } = await setup();

    await hold(3000);

    expect(alerts.trigger).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(ALERT_SENT_TITLE)).toBeTruthy();
    expect(screen.getByLabelText('10 segundos para cancelar')).toBeTruthy();
    expect(screen.queryByLabelText('Botón de ayuda')).toBeNull();
  });

  it('soltar antes de 3 s no dispara nada', async () => {
    const { alerts } = await setup();

    await hold(2000);

    expect(alerts.trigger).not.toHaveBeenCalled();
    expect(screen.queryByText(ALERT_SENT_TITLE)).toBeNull();
  });

  it('el botón está también durante un trayecto', async () => {
    await setup({ trips: [[trip]] });

    expect(await screen.findByText(tripSince(trip.startedAt))).toBeTruthy();
    expect(screen.getByLabelText('Botón de ayuda')).toBeTruthy();
  });

  it('con el PIN correcto dentro de la ventana la alerta se cancela', async () => {
    const { alerts } = await setup();
    await hold(3000);

    await fireEvent.changeText(await screen.findByLabelText('PIN para cancelar'), '1234');
    await fireEvent.press(screen.getByText('Cancelar'));

    expect(alerts.cancel).toHaveBeenCalledWith('al-1', '1234');
    expect(await screen.findByText(ALERT_CANCELLED_MESSAGE)).toBeTruthy();
    expect(screen.getByLabelText('Botón de ayuda')).toBeTruthy();
  });

  it('un PIN incorrecto deja la alerta activa', async () => {
    await setup({
      alerts: { cancel: jest.fn().mockResolvedValue({ ok: false, reason: 'INVALID_PIN' }) },
    });
    await hold(3000);

    await fireEvent.changeText(await screen.findByLabelText('PIN para cancelar'), '9999');
    await fireEvent.press(screen.getByText('Cancelar'));

    expect(await screen.findByText(ALERT_ERROR_MESSAGES.INVALID_PIN)).toBeTruthy();
    expect(screen.getByText(ALERT_SENT_TITLE)).toBeTruthy();
  });

  it('pasados 10 s ya no se puede cancelar', async () => {
    await setup();
    await hold(3000);

    await act(async () => {
      jest.advanceTimersByTime(11000);
    });

    expect(await screen.findByText(ALERT_ACTIVE_MESSAGE)).toBeTruthy();
    expect(screen.queryByLabelText('PIN para cancelar')).toBeNull();
  });

  it('si el servidor dice que la ventana venció, se muestra la alerta activa', async () => {
    await setup({
      alerts: { cancel: jest.fn().mockResolvedValue({ ok: false, reason: 'NOT_CANCELLABLE' }) },
    });
    await hold(3000);

    await fireEvent.changeText(await screen.findByLabelText('PIN para cancelar'), '1234');
    await fireEvent.press(screen.getByText('Cancelar'));

    expect(await screen.findByText(ALERT_ERROR_MESSAGES.NOT_CANCELLABLE)).toBeTruthy();
    expect(screen.getByText(ALERT_ACTIVE_MESSAGE)).toBeTruthy();
  });

  it('muestra el error si no pudo disparar', async () => {
    await setup({
      alerts: { trigger: jest.fn().mockResolvedValue({ ok: false, reason: 'RATE_LIMITED' }) },
    });

    await hold(3000);

    expect(await screen.findByText(ALERT_ERROR_MESSAGES.RATE_LIMITED)).toBeTruthy();
  });

  it('al abrir la app recupera la alerta activa', async () => {
    await setup({
      alerts: { active: jest.fn().mockResolvedValue({ ok: true, value: sentAlert }) },
    });

    expect(await screen.findByText(ALERT_SENT_TITLE)).toBeTruthy();
    expect(screen.queryByLabelText('Botón de ayuda')).toBeNull();
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
