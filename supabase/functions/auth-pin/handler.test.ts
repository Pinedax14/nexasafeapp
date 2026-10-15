import { deepStrictEqual as assertEquals } from 'node:assert/strict';
import {
  AuthPinDeps,
  clientIp,
  createHandler,
  generatePin,
  LOCK_DURATION_MS,
  LoginCandidate,
  MAX_FAILED_ATTEMPTS,
  normalizeDocument,
  ProtegidoForPin,
  WEAK_PINS,
} from './handler.ts';

const NOW = new Date('2026-10-05T12:00:00Z');
const PROTEGIDO_ID = 'a0000000-0000-0000-0000-000000000001';

const protegido: ProtegidoForPin = {
  id: PROTEGIDO_ID,
  guardianId: 'guardian-1',
  estado: 'ACTIVO',
  documentoHuella: 'huella-1001',
  usuarioId: null,
  nombre: 'Menor Uno',
};

const candidate: LoginCandidate = {
  id: PROTEGIDO_ID,
  estado: 'ACTIVO',
  usuarioId: 'usuario-protegido-1',
  pinHash: 'hash-de-1234',
  intentosFallidos: 0,
  bloqueadoHasta: null,
};

type Calls = {
  saved: Array<[string, string, string]>;
  failures: Array<[string, number, string | null]>;
  successes: string[];
  audits: Array<[string | null, string, string]>;
  verifiedAgainst: Array<string | null>;
  ipFailures: string[];
  cancelled: Array<[string, string, string]>;
};

function fakeDeps(overrides: Partial<AuthPinDeps> = {}): AuthPinDeps & Calls {
  const calls: Calls = {
    saved: [],
    failures: [],
    successes: [],
    audits: [],
    verifiedAgainst: [],
    ipFailures: [],
    cancelled: [],
  };
  return {
    ...calls,
    getCaller: () => Promise.resolve({ id: 'guardian-1', rol: 'guardian' }),
    getProtegido: () => Promise.resolve(protegido),
    documentHasOtherPin: () => Promise.resolve(false),
    hashPin: (pin) => Promise.resolve(`hash-de-${pin}`),
    verifyPin: (pin, hash) => {
      calls.verifiedAgainst.push(hash);
      return Promise.resolve(hash === `hash-de-${pin}`);
    },
    ensureLoginUser: () => Promise.resolve('usuario-protegido-1'),
    savePin: (id, usuario, hash) => {
      calls.saved.push([id, usuario, hash]);
      return Promise.resolve(true);
    },
    fingerprint: (doc) => Promise.resolve(`huella-${doc}`),
    findLoginCandidate: (huella) =>
      Promise.resolve(huella === 'huella-1023456789' ? candidate : null),
    recordFailure: (id, intentos, hasta) => {
      calls.failures.push([id, intentos, hasta]);
      return Promise.resolve();
    },
    recordSuccess: (id) => {
      calls.successes.push(id);
      return Promise.resolve();
    },
    createSession: () => Promise.resolve({ access_token: 'at', refresh_token: 'rt' }),
    findProtegidoByUser: (usuarioId) =>
      Promise.resolve(usuarioId === candidate.usuarioId ? candidate : null),
    cancelAlert: (alertaId, protegidoId, actorId) => {
      calls.cancelled.push([alertaId, protegidoId, actorId]);
      return Promise.resolve(true);
    },
    audit: (actor, id, accion) => {
      calls.audits.push([actor, id, accion]);
      return Promise.resolve();
    },
    randomInt: () => 4826,
    ipBlocked: (ip) => Promise.resolve(calls.ipFailures.filter((x) => x === ip).length >= 20),
    recordIpFailure: (ip) => {
      calls.ipFailures.push(ip);
      return Promise.resolve();
    },
    now: () => NOW,
    ...overrides,
  };
}

function post(body: unknown, authorization: string | null = 'Bearer token'): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (authorization) headers.set('Authorization', authorization);
  return new Request('http://localhost/auth-pin', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const assignBody = { accion: 'asignar', protegido_id: PROTEGIDO_ID, pin: '1234' };
const loginBody = { accion: 'ingresar', documento: '1023456789', pin: '1234' };

// ---------------------------------------------------------------------------
// Asignar PIN (D5)
// ---------------------------------------------------------------------------

Deno.test('el guardián asigna un PIN a su menor activo', async () => {
  const deps = fakeDeps();
  const response = await createHandler(deps)(post(assignBody));

  assertEquals(response.status, 200);
  assertEquals(deps.saved, [[PROTEGIDO_ID, 'usuario-protegido-1', 'hash-de-1234']]);
  assertEquals(deps.audits, [['guardian-1', PROTEGIDO_ID, 'ASIGNAR_PIN']]);
});

Deno.test('el servidor genera un PIN aleatorio y lo devuelve una sola vez', async () => {
  const deps = fakeDeps();
  const response = await createHandler(deps)(
    post({ accion: 'asignar', protegido_id: PROTEGIDO_ID, generar: true }),
  );

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { ok: true, pin: '4826' });
  assertEquals(deps.saved, [[PROTEGIDO_ID, 'usuario-protegido-1', 'hash-de-4826']]);
  assertEquals(deps.audits, [['guardian-1', PROTEGIDO_ID, 'ASIGNAR_PIN']]);
});

Deno.test('el PIN asignado por el guardián no se devuelve', async () => {
  const response = await createHandler(fakeDeps())(post(assignBody));
  assertEquals(await response.json(), { ok: true });
});

Deno.test('el PIN generado tiene 4 dígitos y nunca es fácil de adivinar', () => {
  const values = [1234, 0, 7, 9999, 305];
  const pin = generatePin(() => values.shift() as number);
  assertEquals(pin, '0007');
  for (const weak of WEAK_PINS) assertEquals(weak === pin, false);
  assertEquals(
    generatePin(() => 305),
    '0305',
  );
});

Deno.test('reutiliza la cuenta del menor si ya tenía PIN', async () => {
  let created = false;
  const deps = fakeDeps({
    getProtegido: () => Promise.resolve({ ...protegido, usuarioId: 'usuario-existente' }),
    ensureLoginUser: () => {
      created = true;
      return Promise.resolve('otra');
    },
  });

  await createHandler(deps)(post(assignBody));

  assertEquals(created, false);
  assertEquals(deps.saved[0][1], 'usuario-existente');
});

Deno.test('solo un guardián con sesión puede asignar PIN', async () => {
  assertEquals(
    (
      await createHandler(fakeDeps({ getCaller: () => Promise.resolve(null) }))(
        post(assignBody, null),
      )
    ).status,
    401,
  );
  for (const rol of ['institucion', 'admin', 'protegido', 'apoyo']) {
    const deps = fakeDeps({ getCaller: () => Promise.resolve({ id: 'x', rol }) });
    assertEquals((await createHandler(deps)(post(assignBody))).status, 403);
  }
});

Deno.test('el PIN debe tener exactamente 4 dígitos (RNF-15)', async () => {
  for (const pin of ['123', '12345', 'abcd', '']) {
    const response = await createHandler(fakeDeps())(post({ ...assignBody, pin }));
    assertEquals(response.status, 400);
  }
});

Deno.test('no asigna PIN a un menor ajeno (responde como si no existiera)', async () => {
  const deps = fakeDeps({
    getProtegido: () => Promise.resolve({ ...protegido, guardianId: 'otro-guardian' }),
  });
  const response = await createHandler(deps)(post(assignBody));

  assertEquals(response.status, 404);
  assertEquals(deps.saved.length, 0);
});

Deno.test('no asigna PIN a un menor que no está ACTIVO', async () => {
  const deps = fakeDeps({
    getProtegido: () => Promise.resolve({ ...protegido, estado: 'PENDIENTE_VALIDACION' }),
  });

  assertEquals((await createHandler(deps)(post(assignBody))).status, 409);
});

Deno.test('no asigna PIN si el documento ya tiene PIN en otro registro', async () => {
  const deps = fakeDeps({ documentHasOtherPin: () => Promise.resolve(true) });
  const response = await createHandler(deps)(post(assignBody));

  assertEquals(response.status, 409);
  assertEquals(await response.json(), { error: 'DOCUMENT_HAS_PIN' });
});

Deno.test('informa un error si no puede crear la cuenta o guardar el PIN', async () => {
  const noUser = fakeDeps({ ensureLoginUser: () => Promise.resolve(null) });
  assertEquals((await createHandler(noUser)(post(assignBody))).status, 500);

  const notSaved = fakeDeps({ savePin: () => Promise.resolve(false) });
  assertEquals((await createHandler(notSaved)(post(assignBody))).status, 500);
});

// ---------------------------------------------------------------------------
// Ingresar con documento + PIN (E1-04)
// ---------------------------------------------------------------------------

Deno.test('el protegido activo entra con su documento y PIN correcto', async () => {
  const deps = fakeDeps();
  const response = await createHandler(deps)(post(loginBody, null));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { access_token: 'at', refresh_token: 'rt' });
  assertEquals(deps.successes, [PROTEGIDO_ID]);
  assertEquals(deps.audits, [['usuario-protegido-1', PROTEGIDO_ID, 'INGRESO_PIN']]);
});

Deno.test('acepta el documento con puntos, espacios o guiones', async () => {
  const response = await createHandler(fakeDeps())(
    post({ ...loginBody, documento: ' 1.023.456-789 ' }),
  );

  assertEquals(response.status, 200);
  assertEquals(normalizeDocument(' 1.023 456-7 '), '10234567');
});

Deno.test('un PIN incorrecto suma un intento fallido', async () => {
  const deps = fakeDeps();
  const response = await createHandler(deps)(post({ ...loginBody, pin: '9999' }));

  assertEquals(response.status, 401);
  assertEquals(await response.json(), { error: 'INVALID_CREDENTIALS' });
  assertEquals(deps.failures, [[PROTEGIDO_ID, 1, null]]);
  assertEquals(deps.audits, [[null, PROTEGIDO_ID, 'INGRESO_PIN_FALLIDO']]);
});

Deno.test('el quinto PIN incorrecto bloquea 15 minutos (D7)', async () => {
  const deps = fakeDeps({
    findLoginCandidate: () =>
      Promise.resolve({ ...candidate, intentosFallidos: MAX_FAILED_ATTEMPTS - 1 }),
  });
  const response = await createHandler(deps)(post({ ...loginBody, pin: '9999' }));

  assertEquals(response.status, 429);
  assertEquals(deps.failures, [
    [PROTEGIDO_ID, 0, new Date(NOW.getTime() + LOCK_DURATION_MS).toISOString()],
  ]);
});

Deno.test('durante el bloqueo ni el PIN correcto entra', async () => {
  const deps = fakeDeps({
    findLoginCandidate: () =>
      Promise.resolve({ ...candidate, bloqueadoHasta: '2026-10-05T12:10:00Z' }),
  });
  const response = await createHandler(deps)(post(loginBody));

  assertEquals(response.status, 429);
  assertEquals(deps.successes.length, 0);
});

Deno.test('vencido el bloqueo puede volver a entrar', async () => {
  const deps = fakeDeps({
    findLoginCandidate: () =>
      Promise.resolve({ ...candidate, bloqueadoHasta: '2026-10-05T11:59:00Z' }),
  });

  assertEquals((await createHandler(deps)(post(loginBody))).status, 200);
});

Deno.test('un menor que no está ACTIVO no puede entrar', async () => {
  for (const estado of ['PENDIENTE_VALIDACION', 'INACTIVO']) {
    const deps = fakeDeps({ findLoginCandidate: () => Promise.resolve({ ...candidate, estado }) });
    const response = await createHandler(deps)(post(loginBody));

    assertEquals(response.status, 401);
    assertEquals(deps.successes.length, 0);
  }
});

Deno.test('un documento desconocido responde igual que un PIN incorrecto', async () => {
  const deps = fakeDeps();
  const response = await createHandler(deps)(post({ ...loginBody, documento: '99999' }));

  assertEquals(response.status, 401);
  assertEquals(await response.json(), { error: 'INVALID_CREDENTIALS' });
  // También verifica un hash (ficticio) para no delatar por tiempo que el documento no existe.
  assertEquals(deps.verifiedAgainst, [null]);
});

Deno.test('rechaza datos de ingreso con formato inválido', async () => {
  for (const body of [
    { ...loginBody, pin: '12' },
    { ...loginBody, documento: '12' },
    { accion: 'otra' },
  ]) {
    assertEquals((await createHandler(fakeDeps())(post(body))).status, 400);
  }
  assertEquals((await createHandler(fakeDeps())(post('no-es-json'))).status, 400);
});

Deno.test('informa un error si no puede crear la sesión', async () => {
  const deps = fakeDeps({ createSession: () => Promise.resolve(null) });

  assertEquals((await createHandler(deps)(post(loginBody))).status, 500);
});

Deno.test('responde a CORS y solo acepta POST', async () => {
  const handler = createHandler(fakeDeps());

  assertEquals((await handler(new Request('http://localhost', { method: 'OPTIONS' }))).status, 200);
  assertEquals((await handler(new Request('http://localhost', { method: 'GET' }))).status, 405);
});

// ---------------------------------------------------------------------------
// Límite por IP (SEC-01)
// ---------------------------------------------------------------------------

function postFrom(ip: string, body: unknown): Request {
  const request = post(body, null);
  request.headers.set('x-forwarded-for', `${ip}, 10.0.0.1`);
  return request;
}

Deno.test('toma la IP del cliente del primer valor de x-forwarded-for', () => {
  assertEquals(clientIp(postFrom('203.0.113.7', loginBody)), '203.0.113.7');
  assertEquals(clientIp(post(loginBody)), null);
});

Deno.test('cada ingreso fallido cuenta para la IP, sin importar el documento', async () => {
  const deps = fakeDeps();
  const handler = createHandler(deps);

  await handler(postFrom('203.0.113.7', { ...loginBody, documento: '99999999' }));
  await handler(postFrom('203.0.113.7', { ...loginBody, pin: '0001' }));
  await handler(postFrom('203.0.113.7', loginBody));

  assertEquals(deps.ipFailures, ['203.0.113.7', '203.0.113.7']);
});

Deno.test('una IP con 20 fallos no puede intentar más, ni con el PIN correcto', async () => {
  const deps = fakeDeps();
  deps.ipFailures.push(...Array(20).fill('203.0.113.7'));

  const response = await createHandler(deps)(postFrom('203.0.113.7', loginBody));

  assertEquals(response.status, 429);
  assertEquals(await response.json(), { error: 'LOCKED' });
  assertEquals(deps.verifiedAgainst, []);
});

Deno.test('el bloqueo de una IP no afecta a otra', async () => {
  const deps = fakeDeps();
  deps.ipFailures.push(...Array(20).fill('203.0.113.7'));

  const response = await createHandler(deps)(postFrom('198.51.100.2', loginBody));

  assertEquals(response.status, 200);
});

// ---------------------------------------------------------------------------
// Cancelar la alerta con el PIN (E6-03, D23)
// ---------------------------------------------------------------------------

const ALERTA_ID = 'e0000000-0000-0000-0000-000000000001';
const cancelBody = { accion: 'cancelar_alerta', alerta_id: ALERTA_ID, pin: '1234' };
const asProtegido = () =>
  Promise.resolve({ id: candidate.usuarioId, rol: 'protegido' as string | null });

Deno.test('el menor cancela su alerta con el PIN correcto', async () => {
  const deps = fakeDeps({ getCaller: asProtegido });
  const response = await createHandler(deps)(post(cancelBody));

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { ok: true });
  assertEquals(deps.cancelled, [[ALERTA_ID, PROTEGIDO_ID, candidate.usuarioId]]);
  assertEquals(deps.successes, [PROTEGIDO_ID]);
});

Deno.test('con un PIN incorrecto la alerta no se cancela y cuenta como fallo', async () => {
  const deps = fakeDeps({ getCaller: asProtegido });
  const response = await createHandler(deps)(post({ ...cancelBody, pin: '9876' }));

  assertEquals(response.status, 401);
  assertEquals(await response.json(), { error: 'INVALID_PIN' });
  assertEquals(deps.cancelled, []);
  assertEquals(deps.failures, [[PROTEGIDO_ID, 1, null]]);
  assertEquals(deps.audits, [[null, PROTEGIDO_ID, 'CANCELAR_ALERTA_PIN_FALLIDO']]);
});

Deno.test('el quinto PIN incorrecto al cancelar bloquea al menor', async () => {
  const deps = fakeDeps({
    getCaller: asProtegido,
    findProtegidoByUser: () =>
      Promise.resolve({ ...candidate, intentosFallidos: MAX_FAILED_ATTEMPTS - 1 }),
  });
  const response = await createHandler(deps)(post({ ...cancelBody, pin: '9876' }));

  assertEquals(response.status, 429);
  assertEquals(deps.failures, [
    [PROTEGIDO_ID, 0, new Date(NOW.getTime() + LOCK_DURATION_MS).toISOString()],
  ]);
});

Deno.test('un menor bloqueado no puede cancelar ni con el PIN correcto', async () => {
  const deps = fakeDeps({
    getCaller: asProtegido,
    findProtegidoByUser: () =>
      Promise.resolve({ ...candidate, bloqueadoHasta: '2026-10-05T12:10:00Z' }),
  });
  const response = await createHandler(deps)(post(cancelBody));

  assertEquals(response.status, 429);
  assertEquals(deps.verifiedAgainst, []);
  assertEquals(deps.cancelled, []);
});

Deno.test('pasada la ventana de 10 s la alerta ya no se cancela', async () => {
  const deps = fakeDeps({ getCaller: asProtegido, cancelAlert: () => Promise.resolve(false) });
  const response = await createHandler(deps)(post(cancelBody));

  assertEquals(response.status, 409);
  assertEquals(await response.json(), { error: 'NOT_CANCELLABLE' });
});

Deno.test('si la base de datos falla al cancelar responde error', async () => {
  const deps = fakeDeps({ getCaller: asProtegido, cancelAlert: () => Promise.resolve(null) });
  const response = await createHandler(deps)(post(cancelBody));

  assertEquals(response.status, 500);
});

Deno.test('solo el menor puede cancelar su alerta', async () => {
  const deps = fakeDeps();
  const response = await createHandler(deps)(post(cancelBody));

  assertEquals(response.status, 403);
  assertEquals(deps.cancelled, []);
});

Deno.test('cancelar exige sesión', async () => {
  const deps = fakeDeps({ getCaller: () => Promise.resolve(null) });
  const response = await createHandler(deps)(post(cancelBody, null));

  assertEquals(response.status, 401);
});

Deno.test('cancelar rechaza un identificador o un PIN con otro formato', async () => {
  const handler = createHandler(fakeDeps({ getCaller: asProtegido }));

  assertEquals((await handler(post({ ...cancelBody, alerta_id: 'x' }))).status, 400);
  assertEquals((await handler(post({ ...cancelBody, pin: '12' }))).status, 400);
});

Deno.test('una sesión de protegido sin menor vinculado no cancela', async () => {
  const deps = fakeDeps({ getCaller: () => Promise.resolve({ id: 'otro', rol: 'protegido' }) });
  const response = await createHandler(deps)(post(cancelBody));

  assertEquals(response.status, 404);
  assertEquals(deps.cancelled, []);
});
