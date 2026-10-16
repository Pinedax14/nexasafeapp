import * as Notifications from 'expo-notifications';
import {
  ALERT_CHANNEL,
  alertIdFrom,
  ExpoPushNotifier,
  notificationBehavior,
  PushClient,
} from './ExpoPushNotifier';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { MAX: 5 },
  AndroidNotificationVisibility: { PRIVATE: 0 },
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

const notifications = Notifications as jest.Mocked<typeof Notifications>;
const handlerAtLoad = [...notifications.setNotificationHandler.mock.calls];
const TOKEN = 'ExponentPushToken[telefono-1]';
type Permission = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

function response(alertaId: unknown, action = 'expo.modules.notifications.actions.DEFAULT') {
  return {
    actionIdentifier: action,
    notification: { request: { content: { data: { alerta_id: alertaId } } } },
  } as unknown as Notifications.NotificationResponse;
}

function setup(rpcError: unknown = null) {
  const client = { rpc: jest.fn().mockResolvedValue({ data: null, error: rpcError }) };
  return { client, notifier: new ExpoPushNotifier(client as unknown as PushClient) };
}

beforeEach(() => {
  jest.clearAllMocks();
  notifications.getPermissionsAsync.mockResolvedValue({ granted: true } as Permission);
  notifications.getExpoPushTokenAsync.mockResolvedValue({ type: 'expo', data: TOKEN });
  notifications.getLastNotificationResponseAsync.mockResolvedValue(null);
  notifications.addNotificationResponseReceivedListener.mockReturnValue({ remove: jest.fn() });
});

describe('ExpoPushNotifier (E7-01, D25)', () => {
  it('con la app abierta la alerta se muestra y suena', async () => {
    expect(handlerAtLoad).toHaveLength(1);
    const { handleNotification } = handlerAtLoad[0][0] as {
      handleNotification: () => Promise<unknown>;
    };
    expect(await handleNotification()).toEqual(notificationBehavior);
    expect(notificationBehavior.shouldPlaySound).toBe(true);
  });

  it('crea el canal de máxima prioridad antes de pedir el token y lo registra', async () => {
    const { client, notifier } = setup();

    expect(await notifier.enable()).toBe(true);

    expect(notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
      ALERT_CHANNEL,
      expect.objectContaining({ importance: 5, sound: 'default' }),
    );
    expect(notifications.setNotificationChannelAsync.mock.invocationCallOrder[0]).toBeLessThan(
      notifications.getExpoPushTokenAsync.mock.invocationCallOrder[0],
    );
    expect(client.rpc).toHaveBeenCalledWith('registrar_dispositivo', { p_token: TOKEN });
  });

  it('pide el permiso si no lo tiene y no registra si lo niegan', async () => {
    notifications.getPermissionsAsync.mockResolvedValue({ granted: false } as Permission);
    notifications.requestPermissionsAsync.mockResolvedValue({ granted: false } as Permission);
    const { client, notifier } = setup();

    expect(await notifier.enable()).toBe(false);
    expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
    expect(client.rpc).not.toHaveBeenCalled();
  });

  it('sin Firebase el token falla y no se rompe nada', async () => {
    notifications.getExpoPushTokenAsync.mockRejectedValue(new Error('FCM no configurado'));
    const { notifier } = setup();

    expect(await notifier.enable()).toBe(false);
  });

  it('si el servidor rechaza el token informa false y no lo borra luego', async () => {
    const { client, notifier } = setup({ code: '42501' });

    expect(await notifier.enable()).toBe(false);
    await notifier.disable();

    expect(client.rpc).toHaveBeenCalledTimes(1);
  });

  it('al cerrar sesión quita el token registrado', async () => {
    const { client, notifier } = setup();
    await notifier.enable();

    await notifier.disable();
    await notifier.disable();

    expect(client.rpc).toHaveBeenCalledWith('borrar_dispositivo', { p_token: TOKEN });
    expect(client.rpc).toHaveBeenCalledTimes(2);
  });

  it('abre la alerta de la notificación tocada, también si abrió la app', async () => {
    notifications.getLastNotificationResponseAsync.mockResolvedValue(response('al-0'));
    const remove = jest.fn();
    notifications.addNotificationResponseReceivedListener.mockReturnValue({ remove });
    const handler = jest.fn();
    const { notifier } = setup();

    const stop = notifier.onAlertOpened(handler);
    await Promise.resolve();
    const listener = notifications.addNotificationResponseReceivedListener.mock.calls[0][0];
    listener(response('al-1'));
    stop();

    expect(handler).toHaveBeenNthCalledWith(1, 'al-0');
    expect(handler).toHaveBeenNthCalledWith(2, 'al-1');
    expect(remove).toHaveBeenCalled();
  });

  it('ignora respuestas sin alerta o con otra acción', () => {
    expect(alertIdFrom(null)).toBeNull();
    expect(alertIdFrom(response(''))).toBeNull();
    expect(alertIdFrom(response(5))).toBeNull();
    expect(alertIdFrom(response('al-1', 'otra'))).toBeNull();
    expect(alertIdFrom(response('al-1'))).toBe('al-1');
  });
});
