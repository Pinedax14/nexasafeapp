// E1-04 · Edge Function auth-pin: conecta el handler con Supabase y Argon2id.
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { argon2id, argon2Verify } from 'npm:hash-wasm@4';
import { createHandler } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Parámetros Argon2id recomendados por OWASP (19 MiB, 2 iteraciones, 1 hilo).
const ARGON2 = { parallelism: 1, iterations: 2, memorySize: 19456, hashLength: 32 };

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

function hashPin(pin: string): Promise<string> {
  return argon2id({ ...ARGON2, password: pin, salt: randomBytes(16), outputType: 'encoded' });
}

let dummyHash: Promise<string> | null = null;

Deno.serve(
  createHandler({
    async getCaller(authorization) {
      if (!authorization) return null;
      const client = createClient(url, anonKey, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await client.auth.getUser();
      if (error || !data.user) return null;
      const rol = data.user.app_metadata?.rol;
      return { id: data.user.id, rol: typeof rol === 'string' ? rol : null };
    },

    async getProtegido(protegidoId) {
      const { data } = await admin
        .from('protegidos')
        .select('id, guardian_id, estado, documento_huella, usuario_id, nombre')
        .eq('id', protegidoId)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        guardianId: data.guardian_id,
        estado: data.estado,
        documentoHuella: data.documento_huella,
        usuarioId: data.usuario_id,
        nombre: data.nombre,
      };
    },

    async documentHasOtherPin(documentoHuella, exceptProtegidoId) {
      const { count } = await admin
        .from('protegidos')
        .select('id', { count: 'exact', head: true })
        .eq('documento_huella', documentoHuella)
        .not('usuario_id', 'is', null)
        .neq('id', exceptProtegidoId);
      return (count ?? 0) > 0;
    },

    hashPin,

    randomInt(max) {
      // Muestreo por rechazo: evita el sesgo del módulo.
      const limit = Math.floor(0x100000000 / max) * max;
      const buffer = new Uint32Array(1);
      do {
        crypto.getRandomValues(buffer);
      } while (buffer[0] >= limit);
      return buffer[0] % max;
    },

    async verifyPin(pin, pinHash) {
      dummyHash ??= hashPin('0000');
      try {
        const valid = await argon2Verify({ password: pin, hash: pinHash ?? (await dummyHash) });
        return pinHash !== null && valid;
      } catch {
        return false;
      }
    },

    async ensureLoginUser(protegido) {
      // Cuenta interna del menor: el correo es ficticio y nunca recibe mensajes.
      const password = btoa(String.fromCharCode(...randomBytes(32)));
      const { data, error } = await admin.auth.admin.createUser({
        email: `protegido-${protegido.id}@example.org`,
        password,
        email_confirm: true,
        app_metadata: { rol: 'protegido' },
        user_metadata: { nombre: protegido.nombre },
      });
      if (error || !data.user) return null;
      await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { rol: 'protegido' } });
      await admin.from('guardianes').delete().eq('id', data.user.id);
      return data.user.id;
    },

    async savePin(protegidoId, usuarioId, pinHash) {
      const { error } = await admin
        .from('protegidos')
        .update({
          pin_hash: pinHash,
          usuario_id: usuarioId,
          pin_intentos_fallidos: 0,
          pin_bloqueado_hasta: null,
        })
        .eq('id', protegidoId);
      return error === null;
    },

    async fingerprint(documento) {
      const { data, error } = await admin.rpc('pin_huella_documento', { p_documento: documento });
      return error || typeof data !== 'string' ? null : data;
    },

    async findLoginCandidate(documentoHuella) {
      const { data } = await admin
        .from('protegidos')
        .select('id, estado, usuario_id, pin_hash, pin_intentos_fallidos, pin_bloqueado_hasta')
        .eq('documento_huella', documentoHuella)
        .not('usuario_id', 'is', null)
        .maybeSingle();
      if (!data) return null;
      return {
        id: data.id,
        estado: data.estado,
        usuarioId: data.usuario_id,
        pinHash: data.pin_hash,
        intentosFallidos: data.pin_intentos_fallidos,
        bloqueadoHasta: data.pin_bloqueado_hasta,
      };
    },

    async recordFailure(protegidoId, intentos, bloqueadoHasta) {
      await admin
        .from('protegidos')
        .update({ pin_intentos_fallidos: intentos, pin_bloqueado_hasta: bloqueadoHasta })
        .eq('id', protegidoId);
    },

    async recordSuccess(protegidoId) {
      await admin
        .from('protegidos')
        .update({ pin_intentos_fallidos: 0, pin_bloqueado_hasta: null })
        .eq('id', protegidoId);
    },

    async createSession(usuarioId) {
      const { data: userData } = await admin.auth.admin.getUserById(usuarioId);
      const email = userData.user?.email;
      if (!email) return null;

      const { data: link, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });
      if (linkError || !link.properties?.hashed_token) return null;

      const client = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await client.auth.verifyOtp({
        token_hash: link.properties.hashed_token,
        type: 'magiclink',
      });
      if (error || !data.session) return null;
      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    },

    async audit(actorId, protegidoId, accion) {
      await admin.from('audit_log').insert({
        actor_id: actorId,
        entidad: 'protegidos',
        entidad_id: protegidoId,
        accion,
      });
    },

    now: () => new Date(),
  }),
);
