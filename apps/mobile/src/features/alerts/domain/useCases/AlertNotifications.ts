import { PushNotifier } from '../repositories/PushNotifier';

/** D25: reciben el aviso el guardián, el contacto de apoyo y el personal del colegio. */
const PUSH_ROLES = ['guardian', 'apoyo', 'institucion'];

export const receivesAlerts = (role: string) => PUSH_ROLES.includes(role);

/** E7-01: el teléfono de quien atiende alertas recibe el push con sonido prioritario. */
export class AlertNotifications {
  constructor(private readonly notifier: PushNotifier) {}

  /** El menor y el administrador no reciben avisos. */
  async enableFor(role: string): Promise<boolean> {
    if (!receivesAlerts(role)) return false;
    return this.notifier.enable();
  }

  disable(): Promise<void> {
    return this.notifier.disable();
  }

  onAlertOpened(handler: (alertId: string) => void): () => void {
    return this.notifier.onAlertOpened(handler);
  }
}
