// E1-06 · Edge Function admin-personal: conecta el handler con Supabase.
// SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase;
// la llave service_role nunca sale del servidor.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHandler } from './handler.ts';

const url = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

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

    async countRecentCreations(actorId, sinceIso) {
      const { count } = await admin
        .from('audit_log')
        .select('id', { count: 'exact', head: true })
        .eq('actor_id', actorId)
        .eq('accion', 'CREAR_PERSONAL')
        .gte('creado_en', sinceIso);
      return count ?? 0;
    },

    async schoolExists(schoolId) {
      const { data } = await admin.from('colegios').select('id').eq('id', schoolId).maybeSingle();
      return data !== null;
    },

    async createInstitutionUser({ email, password, nombre }) {
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        // SEC-03: la contraseña es temporal; se cambia en el primer ingreso.
        app_metadata: { rol: 'institucion', debe_cambiar_contrasena: true },
        user_metadata: { nombre },
      });
      if (error || !data.user) {
        if (error?.code === 'email_exists' || error?.code === 'user_already_exists') {
          return { ok: false, reason: 'EMAIL_EXISTS' };
        }
        if (error?.code === 'weak_password') return { ok: false, reason: 'WEAK_PASSWORD' };
        return { ok: false, reason: 'UNKNOWN' };
      }
      // Defensa: la cuenta debe quedar con rol institucion y nunca como guardián.
      await admin.auth.admin.updateUserById(data.user.id, {
        app_metadata: { rol: 'institucion', debe_cambiar_contrasena: true },
      });
      await admin.from('guardianes').delete().eq('id', data.user.id);
      return { ok: true, id: data.user.id };
    },

    async insertStaff(row) {
      const { error } = await admin.from('personal_institucion').insert(row);
      return error === null;
    },

    async deleteUser(userId) {
      await admin.auth.admin.deleteUser(userId);
    },

    async audit(actorId, staffId) {
      await admin.from('audit_log').insert({
        actor_id: actorId,
        entidad: 'personal_institucion',
        entidad_id: staffId,
        accion: 'CREAR_PERSONAL',
      });
    },

    now: () => new Date(),
  }),
);
