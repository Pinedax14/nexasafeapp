// E7-01 · Edge Function notify-push (RF-26, RNF-09, D25).
// La llama la base de datos (trigger con pg_net) al crearse una alerta. Espera a que venza
// la ventana de cancelación de 10 s, toma la alerta solo si sigue ENVIADA (una sola vez) y
// envía el push por Expo a quienes deben enterarse. Se autentica con un secreto compartido.

export type AlertWindow = { cancelableHasta: string; estado: string };
export type Recipients = { menor: string; tokens: string[] };

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  priority: 'high';
  channelId: string;
  data: { alerta_id: string };
};

export type NotifyPushDeps = {
  secret: string;
  getAlert(alertaId: string): Promise<AlertWindow | null>;
  /** Marca la alerta como avisada y devuelve los destinatarios; null si ya no corresponde avisar. */
  claim(alertaId: string): Promise<Recipients | null>;
  sendPush(messages: PushMessage[]): Promise<boolean>;
  sleep(ms: number): Promise<void>;
  now(): Date;
};

/** Canal de Android de importancia máxima, creado por la app (D25). */
export const ALERT_CHANNEL = 'alertas';
/** Margen para que la hora del servidor ya haya pasado la ventana. */
export const WINDOW_MARGIN_MS = 500;
/** La ventana es de 10 s; nunca se espera más que esto. */
export const MAX_WAIT_MS = 15000;
/** Expo acepta hasta 100 mensajes por solicitud. */
export const BATCH_SIZE = 100;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Comparación en tiempo constante para no revelar el secreto por tiempos de respuesta. */
export function sameSecret(received: string, expected: string): boolean {
  if (!expected || received.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= received.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Texto mínimo: primer nombre y "pidió ayuda", sin ubicación (STRIDE E6/E7). */
export function buildMessages(alertaId: string, recipients: Recipients): PushMessage[] {
  return recipients.tokens.map((to) => ({
    to,
    title: `🚨 ${recipients.menor} pidió ayuda`,
    body: 'Abre NexaSafe para ver dónde está y responder.',
    sound: 'default',
    priority: 'high',
    channelId: ALERT_CHANNEL,
    data: { alerta_id: alertaId },
  }));
}

export function createHandler(deps: NotifyPushDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });
    if (!sameSecret(req.headers.get('x-nexasafe-secret') ?? '', deps.secret)) {
      return json(401, { error: 'UNAUTHORIZED' });
    }

    let alertaId = '';
    try {
      const body = await req.json();
      alertaId = typeof body?.alerta_id === 'string' ? body.alerta_id : '';
    } catch {
      return json(400, { error: 'INVALID_INPUT' });
    }
    if (!UUID_PATTERN.test(alertaId)) return json(400, { error: 'INVALID_INPUT' });

    const alert = await deps.getAlert(alertaId);
    if (!alert) return json(404, { error: 'NOT_FOUND' });
    if (alert.estado !== 'ENVIADA') return json(200, { sent: 0 });

    const wait = Date.parse(alert.cancelableHasta) - deps.now().getTime() + WINDOW_MARGIN_MS;
    if (wait > 0) await deps.sleep(Math.min(wait, MAX_WAIT_MS));

    const recipients = await deps.claim(alertaId);
    if (!recipients) return json(200, { sent: 0 });

    const messages = buildMessages(alertaId, recipients);
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
      if (!(await deps.sendPush(messages.slice(i, i + BATCH_SIZE)))) {
        return json(502, { error: 'PUSH_FAILED' });
      }
    }
    return json(200, { sent: messages.length });
  };
}
