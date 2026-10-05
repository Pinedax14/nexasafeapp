// E1-06 · El administrador registra personal institucional (RF-42).
// Lógica sin dependencias externas: index.ts le inyecta Supabase y las pruebas, dobles.

export type Caller = { id: string; rol: string | null };

export type CreateUserResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'EMAIL_EXISTS' | 'WEAK_PASSWORD' | 'UNKNOWN' };

export type StaffRow = { id: string; colegio_id: string; nombre: string; cargo: string | null };

export type AdminPersonalDeps = {
  getCaller(authorization: string | null): Promise<Caller | null>;
  countRecentCreations(actorId: string, sinceIso: string): Promise<number>;
  schoolExists(schoolId: string): Promise<boolean>;
  createInstitutionUser(input: {
    email: string;
    password: string;
    nombre: string;
  }): Promise<CreateUserResult>;
  insertStaff(row: StaffRow): Promise<boolean>;
  deleteUser(userId: string): Promise<void>;
  audit(actorId: string, staffId: string): Promise<void>;
  now(): Date;
};

/** Rate limiting: máximo de cuentas que un administrador crea por ventana. */
export const RATE_LIMIT_MAX = 10;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const MIN_PASSWORD_LENGTH = 8;
const MAX_TEXT_LENGTH = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Field = 'colegio_id' | 'nombre' | 'cargo' | 'email' | 'password';

type RegisterStaffInput = {
  colegio_id: string;
  nombre: string;
  cargo: string | null;
  email: string;
  password: string;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateInput(body: unknown): {
  input: RegisterStaffInput;
  errors: Partial<Record<Field, string>>;
} {
  const raw = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>;
  const input: RegisterStaffInput = {
    colegio_id: text(raw.colegio_id),
    nombre: text(raw.nombre),
    cargo: text(raw.cargo) || null,
    email: text(raw.email).toLowerCase(),
    password: typeof raw.password === 'string' ? raw.password : '',
  };

  const errors: Partial<Record<Field, string>> = {};
  if (!UUID_PATTERN.test(input.colegio_id)) errors.colegio_id = 'Colegio inválido.';
  if (!input.nombre || input.nombre.length > MAX_TEXT_LENGTH) errors.nombre = 'Nombre inválido.';
  if (input.cargo && input.cargo.length > MAX_TEXT_LENGTH) errors.cargo = 'Cargo inválido.';
  if (!EMAIL_PATTERN.test(input.email)) errors.email = 'Correo inválido.';
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña temporal debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return { input, errors };
}

export function createHandler(deps: AdminPersonalDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
    if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });

    const caller = await deps.getCaller(req.headers.get('Authorization'));
    if (!caller) return json(401, { error: 'UNAUTHORIZED' });
    if (caller.rol !== 'admin') return json(403, { error: 'FORBIDDEN' });

    const since = new Date(deps.now().getTime() - RATE_LIMIT_WINDOW_MS).toISOString();
    if ((await deps.countRecentCreations(caller.id, since)) >= RATE_LIMIT_MAX) {
      return json(429, { error: 'RATE_LIMITED' });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'INVALID_INPUT', fields: {} });
    }

    const { input, errors } = validateInput(body);
    if (Object.keys(errors).length > 0) {
      return json(400, { error: 'INVALID_INPUT', fields: errors });
    }

    if (!(await deps.schoolExists(input.colegio_id))) {
      return json(404, { error: 'SCHOOL_NOT_FOUND' });
    }

    const created = await deps.createInstitutionUser({
      email: input.email,
      password: input.password,
      nombre: input.nombre,
    });
    if (!created.ok) {
      const status = created.reason === 'EMAIL_EXISTS' ? 409 : created.reason === 'WEAK_PASSWORD' ? 400 : 500;
      return json(status, { error: created.reason });
    }

    const inserted = await deps.insertStaff({
      id: created.id,
      colegio_id: input.colegio_id,
      nombre: input.nombre,
      cargo: input.cargo,
    });
    if (!inserted) {
      // Sin fila en personal_institucion la cuenta no sirve: se deshace el alta.
      await deps.deleteUser(created.id);
      return json(500, { error: 'UNKNOWN' });
    }

    await deps.audit(caller.id, created.id);
    return json(201, { id: created.id });
  };
}
