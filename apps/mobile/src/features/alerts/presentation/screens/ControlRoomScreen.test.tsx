import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PositionRepository } from '../../../tracking/domain/repositories/PositionRepository';
import { WatchLive } from '../../../tracking/domain/useCases/WatchLive';
import { AlertSummary, DayTotals } from '../../domain/entities/AlertSummary';
import { AlertResponseRepository } from '../../domain/repositories/AlertResponseRepository';
import { RespondToAlerts } from '../../domain/useCases/RespondToAlerts';
import { ALERT_ERROR_MESSAGES, NO_ACTIVE_ALERTS } from '../alertMessages';
import { ControlRoomScreen, dayDetail, shortDay } from './ControlRoomScreen';

const mockInjectJavaScript = jest.fn();
const mockChartProps: { stackData?: { label: string; onPress: () => void }[] } = {};

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

jest.mock('react-native-gifted-charts', () => ({
  BarChart: (props: typeof mockChartProps) => {
    Object.assign(mockChartProps, props);
    return null;
  },
}));

const alert: AlertSummary = {
  id: 'al-1',
  protegidoId: 'p-1',
  childName: 'Menor Uno Pérez',
  status: 'ENVIADA',
  createdAt: '2026-10-15T12:00:00Z',
  classification: null,
  closedAt: null,
};

const pad = (n: number) => String(n).padStart(2, '0');
const today = new Date();
const todayKey = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

async function setup(
  options: {
    list?: Awaited<ReturnType<AlertResponseRepository['list']>>;
    summary?: Awaited<ReturnType<AlertResponseRepository['summary']>>;
  } = {},
) {
  const responses: jest.Mocked<AlertResponseRepository> = {
    list: jest.fn().mockResolvedValue(options.list ?? { ok: true, value: [alert] }),
    log: jest.fn(),
    respond: jest.fn(),
    close: jest.fn(),
    summary: jest.fn().mockResolvedValue(
      options.summary ?? {
        ok: true,
        value: [
          { day: todayKey, classification: 'FALSA_ALARMA', total: 2 },
          { day: todayKey, classification: 'SIN_CERRAR', total: 1 },
        ],
      },
    ),
  };
  const positions: jest.Mocked<PositionRepository> = {
    send: jest.fn(),
    latest: jest.fn().mockResolvedValue({
      ok: true,
      value: { latitude: 4.6, longitude: -74.08, accuracyMeters: 8, receivedAt: '' },
    }),
    subscribe: jest.fn(),
  };
  const handlers = { onOpenAlert: jest.fn(), onOpenEnrollments: jest.fn(), onSignOut: jest.fn() };
  await render(
    <ControlRoomScreen
      respondToAlerts={new RespondToAlerts(responses)}
      watchLive={new WatchLive(positions)}
      userName="Coordinación"
      {...handlers}
    />,
  );
  return { responses, positions, handlers };
}

describe('ControlRoomScreen (E8-01, W13)', () => {
  beforeEach(() => mockInjectJavaScript.mockClear());

  it('muestra las alertas activas del colegio y abre una', async () => {
    const { handlers } = await setup();

    await fireEvent.press(await screen.findByLabelText('Abrir alerta de Menor Uno Pérez'));

    expect(handlers.onOpenAlert).toHaveBeenCalledWith(alert);
  });

  it('pide la posición de cada menor con alerta y la dibuja en el mapa', async () => {
    const { positions } = await setup();
    await screen.findByLabelText('Abrir alerta de Menor Uno Pérez');

    await fireEvent(screen.getByTestId('mapa-ruta'), 'message', {
      nativeEvent: { data: JSON.stringify({ type: 'ready' }) },
    });

    expect(positions.latest).toHaveBeenCalledWith('p-1');
    expect(mockInjectJavaScript.mock.calls.at(-1)?.[0]).toContain(
      '"alerts":[{"latitude":4.6,"longitude":-74.08}]',
    );
  });

  it('sin alertas activas lo dice', async () => {
    await setup({ list: { ok: true, value: [] } });

    expect(await screen.findByText(NO_ACTIVE_ALERTS)).toBeTruthy();
  });

  it('el gráfico tiene 14 días y al tocar un día muestra su detalle', async () => {
    await setup();
    await screen.findByLabelText('Abrir alerta de Menor Uno Pérez');

    expect(mockChartProps.stackData).toHaveLength(14);
    expect(mockChartProps.stackData?.[13].label).toBe(shortDay(todayKey));

    await act(async () => mockChartProps.stackData?.[13].onPress());

    expect(
      await screen.findByText(`${shortDay(todayKey)}: 1 Sin cerrar, 2 Falsa alarma`),
    ).toBeTruthy();
  });

  it('abre las matrículas pendientes', async () => {
    const { handlers } = await setup();

    await fireEvent.press(await screen.findByText('Matrículas pendientes ›'));

    expect(handlers.onOpenEnrollments).toHaveBeenCalled();
  });

  it('muestra el error si no puede leer el resumen', async () => {
    await setup({ summary: { ok: false, reason: 'FORBIDDEN' } });

    expect(await screen.findByText(ALERT_ERROR_MESSAGES.FORBIDDEN)).toBeTruthy();
  });
});

describe('dayDetail', () => {
  const day: DayTotals = {
    day: '2026-10-15',
    byClassification: {
      FALSA_ALARMA: 0,
      SITUACION_RESUELTA: 0,
      REMITIDA_A_AUTORIDAD: 0,
      SIN_CERRAR: 0,
    },
    total: 0,
  };

  it('dice cuándo no hubo alertas', () => {
    expect(dayDetail(day)).toBe('15/10: sin alertas');
  });
});
