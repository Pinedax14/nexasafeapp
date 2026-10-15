import { useCallback, useEffect, useState } from 'react';
import { ListMyProtegidos } from '../../../profile/domain/useCases/ListMyProtegidos';
import { Route } from '../../../routes/domain/entities/Route';
import { ManageRoutes } from '../../../routes/domain/useCases/ManageRoutes';
import { Trip } from '../../domain/entities/Trip';
import { ShareLocation } from '../../domain/useCases/ShareLocation';
import { TrackTrips } from '../../domain/useCases/TrackTrips';
import { LOCATION_PERMISSION_DENIED, TRIP_ERROR_MESSAGES } from '../tripMessages';

export function useProtegidoTripViewModel(
  listMyProtegidos: ListMyProtegidos,
  manageRoutes: ManageRoutes,
  trackTrips: TrackTrips,
  shareLocation: ShareLocation,
) {
  const [permissionRoute, setPermissionRoute] = useState<Route | null>(null);
  const [protegidoId, setProtegidoId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [routesFailed, setRoutesFailed] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    // RLS: el protegido solo ve su propia fila en protegidos.
    const profile = await listMyProtegidos.execute();
    const id = profile.ok ? (profile.value[0]?.id ?? null) : null;
    if (!id) {
      setIsLoading(false);
      setErrorMessage(TRIP_ERROR_MESSAGES.UNKNOWN);
      return;
    }
    setProtegidoId(id);
    const [routesResult, tripResult] = await Promise.all([
      manageRoutes.list(id),
      trackTrips.activeFor(id),
    ]);
    setIsLoading(false);
    setRoutes(routesResult.ok ? routesResult.value : []);
    setRoutesFailed(!routesResult.ok);
    setTrip(tripResult.ok ? tripResult.value : null);
    if (!tripResult.ok) {
      setErrorMessage(TRIP_ERROR_MESSAGES[tripResult.reason]);
    } else if (!routesResult.ok) {
      setErrorMessage(
        routesResult.reason === 'NETWORK'
          ? TRIP_ERROR_MESSAGES.NETWORK
          : TRIP_ERROR_MESSAGES.UNKNOWN,
      );
    }
  }, [listMyProtegidos, manageRoutes, trackTrips]);

  useEffect(() => {
    load();
  }, [load]);

  const startTrip = useCallback(
    async (route: Route) => {
      setIsStarting(true);
      setErrorMessage('');
      const result = await trackTrips.start(route.id, trip);
      setIsStarting(false);
      if (!result.ok && result.reason !== 'ALREADY_ACTIVE') {
        setErrorMessage(TRIP_ERROR_MESSAGES[result.reason]);
        return;
      }
      await load();
    },
    [load, trackTrips, trip],
  );

  // W8 (D18): sin permiso de ubicación primero se explica para qué se usa.
  const start = useCallback(
    async (route: Route) => {
      setErrorMessage('');
      if ((await shareLocation.permission()) !== 'GRANTED') {
        setPermissionRoute(route);
        return;
      }
      await startTrip(route);
    },
    [shareLocation, startTrip],
  );

  const confirmPermission = useCallback(async () => {
    const route = permissionRoute;
    setPermissionRoute(null);
    if (!route) return;
    if ((await shareLocation.requestPermission()) !== 'GRANTED') {
      setErrorMessage(LOCATION_PERMISSION_DENIED);
      return;
    }
    await startTrip(route);
  }, [permissionRoute, shareLocation, startTrip]);

  return {
    protegidoId,
    routes,
    routesFailed,
    trip,
    isLoading,
    isStarting,
    errorMessage,
    start,
    reload: load,
    needsPermission: permissionRoute !== null,
    confirmPermission,
  };
}
