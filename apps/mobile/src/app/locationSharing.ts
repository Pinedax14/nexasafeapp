import { supabase } from '../core/api/supabaseClient';
import { ExpoLocationTracker } from '../features/tracking/data/location/ExpoLocationTracker';
import { SupabasePositionRepository } from '../features/tracking/data/repositories/SupabasePositionRepository';
import { ShareLocation } from '../features/tracking/domain/useCases/ShareLocation';

/**
 * E4-02 (D18): se crea al cargar el bundle y no dentro de un componente, porque Android
 * puede iniciar la app en segundo plano solo para entregar posiciones a la tarea.
 */
export const shareLocation = new ShareLocation(
  new SupabasePositionRepository(supabase),
  new ExpoLocationTracker(),
);
