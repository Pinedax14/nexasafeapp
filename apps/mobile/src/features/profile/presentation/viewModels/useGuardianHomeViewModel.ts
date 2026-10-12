import { useCallback, useEffect, useState } from 'react';
import { Trip } from '../../../tracking/domain/entities/Trip';
import { TrackTrips } from '../../../tracking/domain/useCases/TrackTrips';
import { Protegido } from '../../domain/entities/Protegido';
import { ListMyProtegidos } from '../../domain/useCases/ListMyProtegidos';
import { PROFILE_ERROR_MESSAGES } from '../profileMessages';

export function useGuardianHomeViewModel(
  listMyProtegidos: ListMyProtegidos,
  trackTrips?: TrackTrips,
) {
  const [protegidos, setProtegidos] = useState<Protegido[]>([]);
  const [activeTrips, setActiveTrips] = useState<Record<string, Trip>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    const [result, trips] = await Promise.all([
      listMyProtegidos.execute(),
      trackTrips?.listActive(),
    ]);
    setIsLoading(false);
    // E4-01: el guardián ve qué menores tienen un trayecto EN_CURSO (RLS: solo los suyos).
    const byProtegido: Record<string, Trip> = {};
    if (trips?.ok) for (const trip of trips.value) byProtegido[trip.protegidoId] = trip;
    setActiveTrips(byProtegido);
    if (result.ok) {
      setProtegidos(result.value);
    } else {
      setErrorMessage(PROFILE_ERROR_MESSAGES[result.reason]);
    }
  }, [listMyProtegidos, trackTrips]);

  useEffect(() => {
    load();
  }, [load]);

  return { protegidos, activeTrips, errorMessage, isLoading, reload: load };
}
