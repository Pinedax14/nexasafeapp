import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { createSecureSessionStorage } from '../storage/secureSessionStorage';
import { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Revisa apps/mobile/.env.',
  );
}

// E1-05: la sesión se guarda cifrada con expo-secure-store (Keystore de Android).
// En web no hay SecureStore, así que allí la sesión no se persiste.
const canPersistSession = Platform.OS !== 'web';

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: canPersistSession ? createSecureSessionStorage(SecureStore) : undefined,
    persistSession: canPersistSession,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
