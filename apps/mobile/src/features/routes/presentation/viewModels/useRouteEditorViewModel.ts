import { useCallback, useState } from 'react';
import { GeoPoint, Route, RouteDirection } from '../../domain/entities/Route';
import {
  CORRIDOR_DEFAULT_METERS,
  ManageRoutes,
  RouteErrors,
  stepCorridor,
} from '../../domain/useCases/ManageRoutes';
import { ROUTE_ERROR_MESSAGES } from '../routeMessages';

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 3);

export function useRouteEditorViewModel(
  manageRoutes: ManageRoutes,
  protegidoId: string,
  direction: RouteDirection,
  initialRoute: Route | null,
  onSaved: () => void,
) {
  const [points, setPoints] = useState<GeoPoint[]>(initialRoute?.points ?? []);
  const [corridorMeters, setCorridorMeters] = useState(
    initialRoute?.corridorMeters ?? CORRIDOR_DEFAULT_METERS,
  );
  const [duration, setDuration] = useState(
    initialRoute ? String(initialRoute.expectedMinutes) : '',
  );
  const [fieldErrors, setFieldErrors] = useState<RouteErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const addPoint = useCallback((point: GeoPoint) => {
    setPoints((current) => [...current, point]);
    setFieldErrors((current) => ({ ...current, points: undefined }));
  }, []);

  const undo = useCallback(() => setPoints((current) => current.slice(0, -1)), []);

  const widenCorridor = useCallback(() => setCorridorMeters((c) => stepCorridor(c, 1)), []);
  const narrowCorridor = useCallback(() => setCorridorMeters((c) => stepCorridor(c, -1)), []);

  const updateDuration = useCallback((value: string) => {
    setDuration(onlyDigits(value));
    setFieldErrors((current) => ({ ...current, duration: undefined }));
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setErrorMessage('');
    const result = await manageRoutes.save(protegidoId, {
      direction,
      points,
      corridorMeters,
      expectedMinutes: duration === '' ? NaN : Number(duration),
    });
    setIsSaving(false);

    if (!result.ok) {
      if (result.reason === 'INVALID_INPUT') {
        setFieldErrors(result.errors);
      } else {
        setErrorMessage(ROUTE_ERROR_MESSAGES[result.reason]);
      }
      return;
    }
    onSaved();
  }, [corridorMeters, direction, duration, manageRoutes, onSaved, points, protegidoId]);

  return {
    points,
    corridorMeters,
    duration,
    fieldErrors,
    errorMessage,
    isSaving,
    addPoint,
    undo,
    widenCorridor,
    narrowCorridor,
    updateDuration,
    save,
  };
}
