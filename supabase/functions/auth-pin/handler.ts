// E1-04 · Edge Function auth-pin (RF-04, RNF-05, D5, D7).
//  - "asignar": el guardián asigna un PIN de 4 dígitos a su menor ACTIVO.
//  - "ingresar": el menor entra con su documento + PIN y recibe una sesión.
// El PIN solo existe como hash Argon2id en protegidos.pin_hash; nunca sale del servidor.

export type Caller = { id: string; rol: string | null };

export type ProtegidoForPin = {
  id: string;
  guardianId: string;
  estado: string;
  documentoHuella: string;
  usuarioId: string | null;
  nombre: string;
};

export type LoginCandidate = {
  id: string;
  estado: string;
  usuarioId: string;
  pinHash: string | null;
  intentosFallidos: number;
  bloqueadoHasta: string | null;
};

export type SessionTokens = { access_token: string; refresh_token: string };

export type AuthPinDeps = {
  getCaller(authorization: string | null): Promise<Caller | null>;
  getProtegido(protegidoId: string): Promise<ProtegidoForPin | null>;
  documentHasOtherPin(documentoHuella: string, exceptProtegidoId: string): Promise<boolean>;
  hashPin(pin: string): Promise<string>;
  /** Con hash null verifica contra un hash ficticio para no revelar por tiempo si el documento existe. */
  verifyPin(pin: string, pinHash: string | null): Promise<boolean>;
  ensureLoginUser(protegido: ProtegidoForPin): Promise<string | null>;
  savePin(protegidoId: string, usuarioId: string, pinHash: string): Promise<boolean>;
  fingerprint(documento: string): Promise<string | null>;
  findLoginCandidate(documentoHuella: string): Promise<LoginCandidate | null>;
  recordFailure(protegidoId: string, intentos: number, bloqueadoHasta: string | null): Promise<void>;
  recordSuccess(protegidoId: string): Promise<void>;
  createSession(usuarioId: string): Promise<SessionTokens | null>;
  audit(actorId: string | null, protegidoId: string, accion: string): Promise<void>;
  now(): Date;
};

/** D7: 5 PIN incorrectos bloquean el ingreso de ese menor durante 15 minutos. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
const PIN_PATTERN = /^[0-9]{4}$/;
const DOCUMENT_PATTERN = /^[A-Za-z0-9]{5,20}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/** Igual que normalizeDocument de la app: sin espacios, puntos ni guiones. */
export function normalizeDocument(documento: string): string {
  return documento.replace(/[\s.-]/g, '');
}

async function assignPin(
  req: Request,
  body: Record<string, unknown>,
  deps: AuthPinDeps,
): Promise<Response> {
  const caller = await deps.getCaller(req.headers.get('Authorization'));
  if (!caller) return json(401, { error: 'UNAUTHORIZED' });
  if (caller.rol !== 'guardian') return json(403, { error: 'FORBIDDEN' });

  const protegidoId = typeof body.protegido_id === 'string' ? body.protegido_id : '';
  const pin = typeof body.pin === 'string' ? body.pin : '';
  if (!UUID_PATTERN.test(protegidoId) || !PIN_PATTERN.test(pin)) {
    return json(400, { error: 'INVALID_INPUT' });
  }

  const protegido = await deps.getProtegido(protegidoId);
  // Un menor ajeno se responde igual que uno inexistente.
  if (!protegido || protegido.guardianId !== caller.id) return json(404, { error: 'NOT_FOUND' });
  if (protegido.estado !== 'ACTIVO') return json(409, { error: 'NOT_ACTIVE' });
  if (await deps.documentHasOtherPin(protegido.documentoHuella, protegido.id)) {
    return json(409, { error: 'DOCUMENT_HAS_PIN' });
  }

  const usuarioId = protegido.usuarioId ?? (await deps.ensureLoginUser(protegido));
  if (!usuarioId) return json(500, { error: 'UNKNOWN' });

  const saved = await deps.savePin(protegido.id, usuarioId, await deps.hashPin(pin));
  if (!saved) return json(500, { error: 'UNKNOWN' });

  await deps.audit(caller.id, protegido.id, 'ASIGNAR_PIN');
  return json(200, { ok: true });
}

async function login(body: Record<string, unknown>, deps: AuthPinDeps): Promise<Response> {
  const documento = normalizeDocument(typeof body.documento === 'string' ? body.documento : '');
  const pin = typeof body.pin === 'string' ? body.pin : '';
  if (!DOCUMENT_PATTERN.test(documento) || !PIN_PATTERN.test(pin)) {
    return json(400, { error: 'INVALID_INPUT' });
  }

  const huella = await deps.fingerprint(documento);
  const candidate = huella ? await deps.findLoginCandidate(huella) : null;
  if (!candidate) {
    await deps.verifyPin(pin, null);
    return json(401, { error: 'INVALID_CREDENTIALS' });
  }

  const now = deps.now();
  if (candidate.bloqueadoHasta && new Date(candidate.bloqueadoHasta) > now) {
    return json(429, { error: 'LOCKED' });
  }

  if (candidate.estado !== 'ACTIVO' || !candidate.pinHash) {
    await deps.verifyPin(pin, null);
    return json(401, { error: 'INVALID_CREDENTIALS' });
  }

  if (!(await deps.verifyPin(pin, candidate.pinHash))) {
    const intentos = candidate.intentosFallidos + 1;
    await deps.audit(null, candidate.id, 'INGRESO_PIN_FALLIDO');
    if (intentos >= MAX_FAILED_ATTEMPTS) {
      await deps.recordFailure(
        candidate.id,
        0,
        new Date(now.getTime() + LOCK_DURATION_MS).toISOString(),
      );
      return json(429, { error: 'LOCKED' });
    }
    await deps.recordFailure(candidate.id, intentos, null);
    return json(401, { error: 'INVALID_CREDENTIALS' });
  }

  await deps.recordSuccess(candidate.id);
  const session = await deps.createSession(candidate.usuarioId);
  if (!session) return json(500, { error: 'UNKNOWN' });

  await deps.audit(candidate.usuarioId, candidate.id, 'INGRESO_PIN');
  return json(200, session);
}

export function createHandler(deps: AuthPinDeps): (req: Request) => Promise<Response> {
  return async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
    if (req.method !== 'POST') return json(405, { error: 'METHOD_NOT_ALLOWED' });

    let body: Record<string, unknown>;
    try {
      const parsed = await req.json();
      body = typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return json(400, { error: 'INVALID_INPUT' });
    }

    if (body.accion === 'asignar') return assignPin(req, body, deps);
    if (body.accion === 'ingresar') return login(body, deps);
    return json(400, { error: 'INVALID_INPUT' });
  };
}
