import { deepStrictEqual as assertEquals } from 'node:assert/strict';
import {
  AdminPersonalDeps,
  createHandler,
  RATE_LIMIT_MAX,
  StaffRow,
  validateInput,
} from './handler.ts';

const SCHOOL_ID = 'c0000000-0000-0000-0000-000000000001';

const validBody = {
  colegio_id: SCHOOL_ID,
  nombre: '  Docente Uno ',
  cargo: 'Coordinación',
  email: ' Docente@Example.com ',
  password: 'temporal-123',
};

type Calls = {
  inserted: StaffRow[];
  deleted: string[];
  audited: Array<[string, string]>;
};

function fakeDeps(overrides: Partial<AdminPersonalDeps> = {}): AdminPersonalDeps & Calls {
  const calls: Calls = { inserted: [], deleted: [], audited: [] };
  return {
    ...calls,
    getCaller: () => Promise.resolve({ id: 'admin-1', rol: 'admin' }),
    countRecentCreations: () => Promise.resolve(0),
    schoolExists: () => Promise.resolve(true),
    createInstitutionUser: () => Promise.resolve({ ok: true, id: 'staff-1' }),
    insertStaff: (row) => {
      calls.inserted.push(row);
      return Promise.resolve(true);
    },
    deleteUser: (id) => {
      calls.deleted.push(id);
      return Promise.resolve();
    },
    audit: (actor, staff) => {
      calls.audited.push([actor, staff]);
      return Promise.resolve();
    },
    now: () => new Date('2026-10-05T12:00:00Z'),
    ...overrides,
  };
}

function post(body: unknown, authorization: string | null = 'Bearer token'): Request {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (authorization) headers.set('Authorization', authorization);
  return new Request('http://localhost/admin-personal', {
    method: 'POST',
    headers,
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

Deno.test('el administrador registra personal del colegio', async () => {
  const deps = fakeDeps();
  const response = await createHandler(deps)(post(validBody));

  assertEquals(response.status, 201);
  assertEquals(await response.json(), { id: 'staff-1' });
  assertEquals(deps.inserted, [
    { id: 'staff-1', colegio_id: SCHOOL_ID, nombre: 'Docente Uno', cargo: 'Coordinación' },
  ]);
  assertEquals(deps.audited, [['admin-1', 'staff-1']]);
});

Deno.test('crea la cuenta con el correo normalizado y la contraseña temporal', async () => {
  let received: unknown;
  const deps = fakeDeps({
    createInstitutionUser: (input) => {
      received = input;
      return Promise.resolve({ ok: true, id: 'staff-1' });
    },
  });

  await createHandler(deps)(post(validBody));

  assertEquals(received, {
    email: 'docente@example.com',
    password: 'temporal-123',
    nombre: 'Docente Uno',
  });
});

Deno.test('rechaza a quien no inició sesión', async () => {
  const deps = fakeDeps({ getCaller: () => Promise.resolve(null) });
  const response = await createHandler(deps)(post(validBody, null));

  assertEquals(response.status, 401);
});

for (const rol of ['guardian', 'institucion', 'protegido', 'apoyo', null]) {
  Deno.test(`rechaza al rol ${rol}`, async () => {
    const deps = fakeDeps({ getCaller: () => Promise.resolve({ id: 'u-1', rol }) });
    const response = await createHandler(deps)(post(validBody));

    assertEquals(response.status, 403);
    assertEquals(deps.inserted.length, 0);
  });
}

Deno.test('aplica el límite de altas por administrador (rate limiting)', async () => {
  const deps = fakeDeps({ countRecentCreations: () => Promise.resolve(RATE_LIMIT_MAX) });
  const response = await createHandler(deps)(post(validBody));

  assertEquals(response.status, 429);
});

Deno.test('rechaza datos inválidos sin crear la cuenta', async () => {
  const deps = fakeDeps();
  const response = await createHandler(deps)(
    post({ colegio_id: 'x', nombre: '', email: 'no', password: '123' }),
  );
  const body = await response.json();

  assertEquals(response.status, 400);
  assertEquals(Object.keys(body.fields).sort(), ['colegio_id', 'email', 'nombre', 'password']);
  assertEquals(deps.inserted.length, 0);
});

Deno.test('rechaza un cuerpo que no es JSON', async () => {
  const response = await createHandler(fakeDeps())(post('no-es-json'));

  assertEquals(response.status, 400);
});

Deno.test('rechaza un colegio inexistente', async () => {
  const deps = fakeDeps({ schoolExists: () => Promise.resolve(false) });
  const response = await createHandler(deps)(post(validBody));

  assertEquals(response.status, 404);
});

Deno.test('informa si el correo ya tiene cuenta', async () => {
  const deps = fakeDeps({
    createInstitutionUser: () => Promise.resolve({ ok: false, reason: 'EMAIL_EXISTS' }),
  });
  const response = await createHandler(deps)(post(validBody));

  assertEquals(response.status, 409);
});

Deno.test('informa una contraseña débil', async () => {
  const deps = fakeDeps({
    createInstitutionUser: () => Promise.resolve({ ok: false, reason: 'WEAK_PASSWORD' }),
  });
  const response = await createHandler(deps)(post(validBody));

  assertEquals(response.status, 400);
});

Deno.test('responde 500 ante un error desconocido de Auth', async () => {
  const deps = fakeDeps({
    createInstitutionUser: () => Promise.resolve({ ok: false, reason: 'UNKNOWN' }),
  });
  const response = await createHandler(deps)(post(validBody));

  assertEquals(response.status, 500);
});

Deno.test('deshace la cuenta si no se pudo registrar en personal_institucion', async () => {
  const deps = fakeDeps({ insertStaff: () => Promise.resolve(false) });
  const response = await createHandler(deps)(post(validBody));

  assertEquals(response.status, 500);
  assertEquals(deps.deleted, ['staff-1']);
  assertEquals(deps.audited.length, 0);
});

Deno.test('solo acepta POST y responde a la verificación CORS', async () => {
  const handler = createHandler(fakeDeps());

  assertEquals((await handler(new Request('http://localhost', { method: 'GET' }))).status, 405);
  assertEquals((await handler(new Request('http://localhost', { method: 'OPTIONS' }))).status, 200);
});

Deno.test('validateInput deja el cargo vacío como null', () => {
  const { input, errors } = validateInput({ ...validBody, cargo: '  ' });

  assertEquals(input.cargo, null);
  assertEquals(errors, {});
});

Deno.test('validateInput limita la longitud del cargo', () => {
  const { errors } = validateInput({ ...validBody, cargo: 'x'.repeat(101) });

  assertEquals(Object.keys(errors), ['cargo']);
});
