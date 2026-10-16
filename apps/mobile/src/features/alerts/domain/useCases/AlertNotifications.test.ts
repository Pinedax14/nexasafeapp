import { PushNotifier } from '../repositories/PushNotifier';
import { AlertNotifications, receivesAlerts } from './AlertNotifications';

function setup() {
  const unsubscribe = jest.fn();
  const notifier: jest.Mocked<PushNotifier> = {
    enable: jest.fn().mockResolvedValue(true),
    disable: jest.fn().mockResolvedValue(undefined),
    onAlertOpened: jest.fn().mockReturnValue(unsubscribe),
  };
  return { notifier, unsubscribe, notifications: new AlertNotifications(notifier) };
}

describe('AlertNotifications (E7-01, D25)', () => {
  it.each(['guardian', 'apoyo', 'institucion'])(
    '%s registra su teléfono para el push',
    async (role) => {
      const { notifier, notifications } = setup();

      expect(await notifications.enableFor(role)).toBe(true);
      expect(notifier.enable).toHaveBeenCalled();
    },
  );

  it.each(['protegido', 'admin'])('%s no recibe avisos de alertas', async (role) => {
    const { notifier, notifications } = setup();

    expect(await notifications.enableFor(role)).toBe(false);
    expect(receivesAlerts(role)).toBe(false);
    expect(notifier.enable).not.toHaveBeenCalled();
  });

  it('quita el teléfono y escucha las notificaciones tocadas', async () => {
    const { notifier, unsubscribe, notifications } = setup();
    const handler = jest.fn();

    await notifications.disable();
    notifications.onAlertOpened(handler)();

    expect(notifier.disable).toHaveBeenCalled();
    expect(notifier.onAlertOpened).toHaveBeenCalledWith(handler);
    expect(unsubscribe).toHaveBeenCalled();
  });
});
