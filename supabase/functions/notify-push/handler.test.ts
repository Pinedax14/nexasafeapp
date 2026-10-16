import { deepStrictEqual as assertEquals } from 'node:assert/strict';
import {
  ALERT_CHANNEL,
  AlertWindow,
  buildMessages,
  createHandler,
  MAX_WAIT_MS,
  NotifyPushDeps,
  PushMessage,
  Recipients,
  sameSecret,
  WINDOW_MARGIN_MS,
} from './handler.ts';

const NOW = new Date('2026-10-15T12:00:00Z');
const ALERTA_ID = 'e0000000-0000-0000-0000-000000000001';
const SECRET = 'clave-falsa';

type Calls = { slept: number[]; claimed: string[]; batches: PushMessage[][] };

function fakeDeps(
  options: {
    alert?: AlertWindow | null;
    recipients?: Recipients | null;
    pushOk?: boolean;
  } = {},
): NotifyPushDeps & Calls {
  const calls: Calls = { slept: [], claimed: [], batches: [] };
  return {
    ...calls,
    secret: SECRET,
    getAlert: () =>
      Promise.resolve(
        options.alert === undefined
          ? { cancelableHasta: '2026-10-15T12:00:08Z', estado: 'ENVIADA' }
          : options.alert,
      ),
    claim: (id) => {
      calls.claimed.push(id);
      return Promise.resolve(
        options.recipients === undefined
          ? { menor: 'Menor', tokens: ['ExponentPushToken[a]', 'ExponentPushToken[b]'] }
          : options.recipients,
      );
    },
    sendPush: (messages) => {
      calls.batches.push(messages);
      return Promise.resolve(options.pushOk ?? true);
    },
    sleep: (ms) => {
      calls.slept.push(ms);
      return Promise.resolve();
    },
    now: () => NOW,
  };
}

function post(body: unknown, secret: string | null = SECRET, method = 'POST'): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (secret !== null) headers.set('x-nexasafe-secret', secret);
  return new Request('http://localhost/notify-push', {
    method,
    headers,
    body: method === 'POST' ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

Deno.test('espera a que venza la ventana y avisa a todos los destinatarios', async () => {
  const deps = fakeDeps();
  const response = await createHandler(deps)(post({ alerta_id: ALERTA_ID }));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { sent: 2 });
  assertEquals(deps.slept, [8000 + WINDOW_MARGIN_MS]);
  assertEquals(deps.claimed, [ALERTA_ID]);
  assertEquals(
    deps.batches[0].map((m) => m.to),
    ['ExponentPushToken[a]', 'ExponentPushToken[b]'],
  );
});

Deno.test('si la ventana ya venció no espera', async () => {
  const deps = fakeDeps({ alert: { cancelableHasta: '2026-10-15T11:59:00Z', estado: 'ENVIADA' } });
  await createHandler(deps)(post({ alerta_id: ALERTA_ID }));

  assertEquals(deps.slept, []);
});

Deno.test('nunca espera más de 15 s aunque la ventana diga otra cosa', async () => {
  const deps = fakeDeps({ alert: { cancelableHasta: '2026-10-15T13:00:00Z', estado: 'ENVIADA' } });
  await createHandler(deps)(post({ alerta_id: ALERTA_ID }));

  assertEquals(deps.slept, [MAX_WAIT_MS]);
});

Deno.test('si la alerta se canceló dentro de la ventana no se avisa a nadie', async () => {
  const deps = fakeDeps({ recipients: null });
  const response = await createHandler(deps)(post({ alerta_id: ALERTA_ID }));

  assertEquals(await response.json(), { sent: 0 });
  assertEquals(deps.batches, []);
});

Deno.test('una alerta que ya no está ENVIADA no se avisa ni se espera', async () => {
  const deps = fakeDeps({ alert: { cancelableHasta: '2026-10-15T12:00:08Z', estado: 'CANCELADA' } });
  const response = await createHandler(deps)(post({ alerta_id: ALERTA_ID }));

  assertEquals(await response.json(), { sent: 0 });
  assertEquals(deps.slept, []);
  assertEquals(deps.claimed, []);
});

Deno.test('una alerta inexistente responde 404', async () => {
  const response = await createHandler(fakeDeps({ alert: null }))(post({ alerta_id: ALERTA_ID }));
  assertEquals(response.status, 404);
});

Deno.test('sin el secreto correcto no hace nada', async () => {
  const deps = fakeDeps();
  const handler = createHandler(deps);

  assertEquals((await handler(post({ alerta_id: ALERTA_ID }, null))).status, 401);
  assertEquals((await handler(post({ alerta_id: ALERTA_ID }, 'clave-otra!'))).status, 401);
  assertEquals(deps.claimed, []);
});

Deno.test('rechaza otros métodos y cuerpos inválidos', async () => {
  const handler = createHandler(fakeDeps());

  assertEquals((await handler(post(null, SECRET, 'GET'))).status, 405);
  assertEquals((await handler(post('no-es-json'))).status, 400);
  assertEquals((await handler(post({ alerta_id: 'x' }))).status, 400);
});

Deno.test('envía en lotes de 100 mensajes', async () => {
  const tokens = Array.from({ length: 150 }, (_, i) => `ExponentPushToken[t${i}]`);
  const deps = fakeDeps({ recipients: { menor: 'Menor', tokens } });
  const response = await createHandler(deps)(post({ alerta_id: ALERTA_ID }));

  assertEquals(await response.json(), { sent: 150 });
  assertEquals(
    deps.batches.map((batch) => batch.length),
    [100, 50],
  );
});

Deno.test('si Expo falla responde 502', async () => {
  const response = await createHandler(fakeDeps({ pushOk: false }))(post({ alerta_id: ALERTA_ID }));
  assertEquals(response.status, 502);
});

Deno.test('el mensaje solo lleva el primer nombre, sin ubicación, con sonido y prioridad alta', () => {
  const [message] = buildMessages(ALERTA_ID, { menor: 'Menor', tokens: ['ExponentPushToken[a]'] });

  assertEquals(message, {
    to: 'ExponentPushToken[a]',
    title: '🚨 Menor pidió ayuda',
    body: 'Abre NexaSafe para ver dónde está y responder.',
    sound: 'default',
    priority: 'high',
    channelId: ALERT_CHANNEL,
    data: { alerta_id: ALERTA_ID },
  });
});

Deno.test('compara el secreto completo', () => {
  assertEquals(sameSecret(SECRET, SECRET), true);
  assertEquals(sameSecret('clave-falsx', SECRET), false);
  assertEquals(sameSecret('corto', SECRET), false);
  assertEquals(sameSecret('', ''), false);
});
