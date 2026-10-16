import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PositionRepository } from '../../../tracking/domain/repositories/PositionRepository';
import { WatchLive } from '../../../tracking/domain/useCases/WatchLive';
import { NO_LIVE_POSITION } from '../../../tracking/presentation/tripMessages';
import { AlertSummary, ResponderRole } from '../../domain/entities/AlertSummary';
import { AlertResponseRepository } from '../../domain/repositories/AlertResponseRepository';
import { RespondToAlerts } from '../../domain/useCases/RespondToAlerts';
import {
  ALERT_ERROR_MESSAGES,
  alertTitle,
  CLOSED_MESSAGE,
  RESPONDED_MESSAGE,
} from '../alertMessages';
import { POSITION_REFRESH_MS } from '../viewModels/useAlertDetailViewModel';
import { AlertDetailScreen } from './AlertDetailScreen';

jest.mock('react-native-webview', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    WebView: forwardRef((props: object, ref: unknown) => {
      useImperativeHandle(ref, () => ({ injectJavaScript: jest.fn() }));
      return <View {...props} />;
    }),
  };
});

const alert: AlertSummary = {
  id: 'al-1',
  protegidoId: 'p-1',
  childName: 'Menor Uno',
  status: 'ENVIADA',
  createdAt: '2026-10-15T12:00:00Z',
  classification: null,
  closedAt: null,
};

type Options = {
  role?: ResponderRole;
  alert?: AlertSummary;
  respond?: Awaited<ReturnType<AlertResponseRepository['respond']>>;
  close?: Awaited<ReturnType<AlertResponseRepository['close']>>;
  log?: Awaited<ReturnType<AlertResponseRepository['log']>>;
  latest?: Awaited<ReturnType<PositionRepository['latest']>>;
};

async function setup(options: Options = {}) {
  const responses: jest.Mocked<AlertResponseRepository> = {
    list: jest.fn(),
    log: jest.fn().mockResolvedValue(
      options.log ?? {
        ok: true,
        value: [
          { type: 'DISPARADA', actor: 'Menor', detail: null, at: '2026-10-15T12:00:00Z' },
          { type: 'NOTIFICADA', actor: 'NexaSafe', detail: null, at: '2026-10-15T12:00:11Z' },
        ],
      },
    ),
    respond: jest.fn().mockResolvedValue(options.respond ?? { ok: true, value: undefined }),
    close: jest.fn().mockResolvedValue(options.close ?? { ok: true, value: undefined }),
    summary: jest.fn(),
  };
  const positions: jest.Mocked<PositionRepository> = {
    send: jest.fn(),
    latest: jest.fn().mockResolvedValue(
      options.latest ?? {
        ok: true,
        value: {
          latitude: 4.6,
          longitude: -74.08,
          accuracyMeters: 8,
          receivedAt: new Date().toISOString(),
        },
      },
    ),
    subscribe: jest.fn(),
  };
  const onBack = jest.fn();
  await render(
    <AlertDetailScreen
      respondToAlerts={new RespondToAlerts(responses)}
      watchLive={new WatchLive(positions)}
      alert={options.alert ?? alert}
      role={options.role ?? 'guardian'}
      onBack={onBack}
    />,
  );
  return { responses, positions, onBack };
}

describe('AlertDetailScreen (W11, W12)', () => {
  it('muestra la alerta, la posición y la bitácora', async () => {
    await setup();

    expect(screen.getByText(alertTitle('Menor Uno'))).toBeTruthy();
    expect(await screen.findByText(/Última posición: hace \d+ s/)).toBeTruthy();
    expect(await screen.findByText(/Disparada · Menor/)).toBeTruthy();
    expect(screen.getByText(/Notificada · NexaSafe/)).toBeTruthy();
  });

  it('el contacto de apoyo marca "voy en camino" pero no puede cerrar (D28, D29)', async () => {
    const { responses } = await setup({ role: 'apoyo' });

    expect(screen.queryByText('Cerrar alerta')).toBeNull();
    await fireEvent.press(await screen.findByText('Voy en camino'));

    expect(responses.respond).toHaveBeenCalledWith('al-1');
    expect(await screen.findByText(RESPONDED_MESSAGE)).toBeTruthy();
    expect(screen.getByText(/Atendida/)).toBeTruthy();
    expect(responses.log).toHaveBeenCalledTimes(2);
  });

  it('el colegio cierra pero no marca "voy en camino"', async () => {
    await setup({ role: 'institucion' });

    expect(await screen.findByText('Cerrar alerta')).toBeTruthy();
    expect(screen.queryByText('Voy en camino')).toBeNull();
  });

  it('el guardián cierra la alerta eligiendo una clasificación (E9-02)', async () => {
    const { responses } = await setup();

    await fireEvent.press(await screen.findByText('Cerrar alerta'));
    await fireEvent.press(screen.getByText(/Situación resuelta/));
    await fireEvent.changeText(screen.getByLabelText('Nota del cierre'), 'Llegó a casa');
    await fireEvent.press(screen.getByLabelText('Confirmar cierre'));

    expect(responses.close).toHaveBeenCalledWith('al-1', 'SITUACION_RESUELTA', 'Llegó a casa');
    expect(await screen.findByText(CLOSED_MESSAGE)).toBeTruthy();
    expect(screen.queryByText('Voy en camino')).toBeNull();
    expect(screen.queryByTestId('mapa-ruta')).toBeNull();
  });

  it('sin clasificación no cierra y lo explica', async () => {
    const { responses } = await setup();

    await fireEvent.press(await screen.findByText('Cerrar alerta'));
    await fireEvent.press(screen.getByLabelText('Confirmar cierre'));

    expect(responses.close).not.toHaveBeenCalled();
    expect(await screen.findByText(ALERT_ERROR_MESSAGES.INVALID_DATA)).toBeTruthy();
  });

  it('se puede volver del formulario de cierre', async () => {
    await setup();

    await fireEvent.press(await screen.findByText('Cerrar alerta'));
    await fireEvent.press(screen.getByText('Volver a la alerta'));

    expect(screen.queryByLabelText('Confirmar cierre')).toBeNull();
  });

  it('muestra el error del servidor al responder o cerrar', async () => {
    await setup({ respond: { ok: false, reason: 'NOT_ACTIVE_ALERT' } });

    await fireEvent.press(await screen.findByText('Voy en camino'));

    expect(await screen.findByText(ALERT_ERROR_MESSAGES.NOT_ACTIVE_ALERT)).toBeTruthy();
  });

  it('muestra el error del cierre', async () => {
    await setup({ close: { ok: false, reason: 'FORBIDDEN' } });

    await fireEvent.press(await screen.findByText('Cerrar alerta'));
    await fireEvent.press(screen.getByText(/Falsa alarma/));
    await fireEvent.press(screen.getByLabelText('Confirmar cierre'));

    expect(await screen.findByText(ALERT_ERROR_MESSAGES.FORBIDDEN)).toBeTruthy();
  });

  it('una alerta cerrada muestra su clasificación y no ofrece acciones', async () => {
    const { positions } = await setup({
      alert: { ...alert, status: 'CERRADA', classification: 'FALSA_ALARMA' },
    });

    expect(screen.getByText(/Cerrada · Falsa alarma/)).toBeTruthy();
    expect(screen.queryByText('Voy en camino')).toBeNull();
    expect(screen.queryByText('Cerrar alerta')).toBeNull();
    expect(positions.latest).not.toHaveBeenCalled();
  });

  it('la bitácora muestra la clasificación del cierre', async () => {
    await setup({
      log: {
        ok: true,
        value: [
          { type: 'CERRADA', actor: 'Ana', detail: 'FALSA_ALARMA', at: '2026-10-15T12:05:00Z' },
        ],
      },
    });

    expect(await screen.findByText(/Cerrada · Ana · Falsa alarma/)).toBeTruthy();
  });

  it('muestra el error si no puede leer la bitácora', async () => {
    await setup({ log: { ok: false, reason: 'FORBIDDEN' } });

    expect(await screen.findByText(ALERT_ERROR_MESSAGES.FORBIDDEN)).toBeTruthy();
  });

  it('consulta la posición cada 5 s mientras la alerta está activa', async () => {
    jest.useFakeTimers();
    try {
      const { positions } = await setup();
      expect(positions.latest).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(POSITION_REFRESH_MS);
      });

      expect(positions.latest).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('sin posición todavía lo dice', async () => {
    const { positions } = await setup({ latest: { ok: true, value: null } });

    expect(positions.latest).toHaveBeenCalledWith('p-1');
    expect(screen.getByText(NO_LIVE_POSITION)).toBeTruthy();
  });

  it('vuelve atrás', async () => {
    const { onBack } = await setup();

    await fireEvent.press(screen.getByText('Volver'));

    expect(onBack).toHaveBeenCalled();
  });
});
