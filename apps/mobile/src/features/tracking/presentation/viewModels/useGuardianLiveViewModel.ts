import { useEffect, useState } from 'react';
import { Route } from '../../../routes/domain/entities/Route';
import { ManageRoutes } from '../../../routes/domain/useCases/ManageRoutes';
import { LivePosition } from '../../domain/entities/Position';
import { Trip } from '../../domain/entities/Trip';
import { TrackTrips } from '../../domain/useCases/TrackTrips';
import { WatchLive } from '../../domain/useCases/WatchLive';
import { TRIP_ERROR_MESSAGES } from '../tripMessages';

/** W7 · Trayecto en vivo (E4-02, E4-03). */
export function useGuardianLiveViewModel(
  watchLive: WatchLive,
  trackTrips: TrackTrips,
  manageRoutes: ManageRoutes,
  protegidoId: string,
) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [arrivedAt, setArrivedAt] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      trackTrips.activeFor(protegidoId),
      manageRoutes.list(protegidoId),
      watchLive.latest(protegidoId),
    ]).then(([tripResult, routesResult, latestResult]) => {
      if (!isMounted) return;
      setIsLoading(false);
      const activeTrip = tripResult.ok ? tripResult.value : null;
      setTrip(activeTrip);
      if (routesResult.ok && activeTrip) {
        setRoute(routesResult.value.find((item) => item.id === activeTrip.routeId) ?? null);
      }
      if (latestResult.ok) setPosition((current) => current ?? latestResult.value);
      if (!tripResult.ok) setErrorMessage(TRIP_ERROR_MESSAGES[tripResult.reason]);
      else if (!latestResult.ok) setErrorMessage(TRIP_ERROR_MESSAGES[latestResult.reason]);
    });
    return () => {
      isMounted = false;
    };
  }, [manageRoutes, protegidoId, trackTrips, watchLive]);

  // D20: las posiciones llegan por el canal privado del menor mientras la pantalla está abierta.
  useEffect(
    () =>
      watchLive.subscribe(protegidoId, {
        onPosition: setPosition,
        onTripClosed: () => setArrivedAt(new Date().toISOString()),
      }),
    [protegidoId, watchLive],
  );

  // "Última posición: hace N s".
  useEffect(() => {
    if (!position || arrivedAt) return;
    const tick = () => setSecondsAgo(watchLive.secondsSince(position, new Date()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [arrivedAt, position, watchLive]);

  return { trip, route, position, arrivedAt, secondsAgo, isLoading, errorMessage };
}
