/** Notificaciones push de alertas en el teléfono (E7-01, D25). */
export interface PushNotifier {
  /** Pide permiso, crea el canal de alertas y registra el token del teléfono. false si no se pudo. */
  enable(): Promise<boolean>;
  /** Quita el token del teléfono para que la cuenta deje de recibir avisos aquí. */
  disable(): Promise<void>;
  /** Avisa el id de la alerta cuando se toca una notificación; devuelve cómo dejar de escuchar. */
  onAlertOpened(handler: (alertId: string) => void): () => void;
}
