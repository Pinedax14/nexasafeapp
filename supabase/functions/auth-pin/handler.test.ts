import { deepStrictEqual as assertEquals } from 'node:assert/strict';
import {
  AuthPinDeps,
  createHandler,
  LOCK_DURATION_MS,
  LoginCandidate,
  MAX_FAILED_ATTEMPTS,
  normalizeDocument,
  ProtegidoForPin,
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
};

function fakeDeps(overrides: Partial<AuthPinDeps> = {}): AuthPinDeps & Calls {
  const calls: Calls = { saved: [], failures: [], successes: [], audits: [], verifiedAgainst: [] };
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
    findLoginCandidate: (huella) => Promise.resolve(huella === 'huella-1023456789' ? candidate : null),
    recordFailure: (id, intentos, hasta) => {
      calls.failures.push([id, intentos, hasta]);
      return Promise.resolve();
    },
    recordSuccess: (id) => {
      calls.successes.push(id);
      return Promise.resolve();
    },
    createSession: () => Promise.resolve({ access_token: 'at', refresh_token: 'rt' }),
    audit: (actor, id, accion) => {
      calls.audits.push([actor, id, accion]);
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
    (await createHandler(fakeDeps({ getCaller: () => Promise.resolve(null) }))(post(assignBody, null)))
      .status,
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
  const response = await createHandler(fakeDeps())(post({ ...loginBody, documento: ' 1.023.456-789 ' }));

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
