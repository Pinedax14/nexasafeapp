import { useCallback, useEffect, useState } from 'react';
import { Route, RouteDirection } from '../../domain/entities/Route';
import { ManageRoutes } from '../../domain/useCases/ManageRoutes';
import { ROUTE_ERROR_MESSAGES } from '../routeMessages';

export function useRoutesViewModel(manageRoutes: ManageRoutes, protegidoId: string) {
  const [routes, setRoutes] = useState<Partial<Record<RouteDirection, Route>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    const result = await manageRoutes.list(protegidoId);
    setIsLoading(false);
    if (!result.ok) {
      setErrorMessage(ROUTE_ERROR_MESSAGES[result.reason]);
      return;
    }
    const byDirection: Partial<Record<RouteDirection, Route>> = {};
    for (const route of result.value) byDirection[route.direction] = route;
    setRoutes(byDirection);
  }, [manageRoutes, protegidoId]);

  useEffect(() => {
    load();
  }, [load]);

  return { routes, isLoading, errorMessage, reload: load };
}
