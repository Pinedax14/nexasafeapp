import { SupabaseClient } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Database } from '../../../../core/api/database.types';
import { colors } from '../../../../core/theme/colors';
import { PushNotifier } from '../../domain/repositories/PushNotifier';

export type PushClient = Pick<SupabaseClient<Database>, 'rpc'>;

/** Canal de Android de importancia máxima con sonido; notify-push lo usa (D25). */
export const ALERT_CHANNEL = 'alertas';

/** Con la app abierta la alerta también se muestra y suena. */
export const notificationBehavior: Notifications.NotificationBehavior = {
  shouldShowBanner: true,
  shouldShowList: true,
  shouldPlaySound: true,
  shouldSetBadge: false,
};

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({ handleNotification: async () => notificationBehavior });
}

/** Id de la alerta que trae la notificación, si es válido. */
export function alertIdFrom(response: Notifications.NotificationResponse | null): string | null {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
    return null;
  }
  const id = response.notification.request.content.data?.alerta_id;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

export class ExpoPushNotifier implements PushNotifier {
  private token: string | null = null;

  constructor(private readonly client: PushClient) {}

  async enable(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      // Android 13+: el canal debe existir antes de pedir el token.
      await Notifications.setNotificationChannelAsync(ALERT_CHANNEL, {
        name: 'Alertas',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 400, 200, 400],
        lightColor: colors.error,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
      });
      const current = await Notifications.getPermissionsAsync();
      const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
      if (!granted) return false;
      // El projectId sale de la configuración de EAS (app.json, extra.eas.projectId).
      const { data } = await Notifications.getExpoPushTokenAsync();
      const { error } = await this.client.rpc('registrar_dispositivo', { p_token: data });
      if (error) return false;
      this.token = data;
      return true;
    } catch {
      // Sin Firebase (FCM) el token no se puede obtener en Android.
      return false;
    }
  }

  async disable(): Promise<void> {
    if (!this.token) return;
    await this.client.rpc('borrar_dispositivo', { p_token: this.token });
    this.token = null;
  }

  onAlertOpened(handler: (alertId: string) => void): () => void {
    if (Platform.OS === 'web') return () => undefined;
    const open = (response: Notifications.NotificationResponse | null) => {
      const id = alertIdFrom(response);
      if (id) handler(id);
    };
    // La app pudo abrirse tocando la notificación.
    Notifications.getLastNotificationResponseAsync().then(open);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }
}
