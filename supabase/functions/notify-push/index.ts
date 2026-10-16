// E7-01 · Edge Function notify-push: conecta el handler con Supabase y Expo Push.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase; NOTIFY_PUSH_SECRET es el
// mismo valor que 'notify_push_secret' en Vault (se carga con `supabase secrets set`).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { createHandler } from './handler.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(
  createHandler({
    secret: Deno.env.get('NOTIFY_PUSH_SECRET') ?? '',

    async getAlert(alertaId) {
      const { data } = await admin
        .from('alertas')
        .select('cancelable_hasta, estado')
        .eq('id', alertaId)
        .maybeSingle();
      return data ? { cancelableHasta: data.cancelable_hasta, estado: data.estado } : null;
    },

    async claim(alertaId) {
      const { data, error } = await admin.rpc('tomar_alerta_para_aviso', {
        p_alerta_id: alertaId,
      });
      const row = Array.isArray(data) ? data[0] : null;
      if (error || !row) return null;
      return { menor: row.menor, tokens: row.tokens ?? [] };
    },

    async sendPush(messages) {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
      return response.ok;
    },

    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    now: () => new Date(),
  }),
);
