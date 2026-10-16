import { useEffect, useMemo, useState } from 'react';
import { GeoPoint } from '../../../routes/domain/entities/Route';
import { WatchLive } from '../../../tracking/domain/useCases/WatchLive';
import { DailyCount } from '../../domain/entities/AlertSummary';
import { RespondToAlerts } from '../../domain/useCases/RespondToAlerts';
import { ALERT_ERROR_MESSAGES } from '../alertMessages';
import { useAlertListViewModel } from './useAlertListViewModel';

/** W13 · Puesto de control (E8-01): alertas activas en el mapa y gráfico de 14 días. */
export function useControlRoomViewModel(respondToAlerts: RespondToAlerts, watchLive: WatchLive) {
  const list = useAlertListViewModel(respondToAlerts, true);
  const [positions, setPositions] = useState<GeoPoint[]>([]);
  const [counts, setCounts] = useState<DailyCount[]>([]);
  const [summaryError, setSummaryError] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    respondToAlerts.summary().then((result) => {
      if (!isMounted) return;
      if (result.ok) setCounts(result.value);
      else setSummaryError(ALERT_ERROR_MESSAGES[result.reason]);
    });
    return () => {
      isMounted = false;
    };
  }, [respondToAlerts]);

  // Última posición de cada alerta activa (D26: solo durante la alerta).
  useEffect(() => {
    let isMounted = true;
    const protegidos = [...new Set(list.alerts.map((alert) => alert.protegidoId))];
    Promise.all(protegidos.map((id) => watchLive.latest(id))).then((results) => {
      if (!isMounted) return;
      setPositions(
        results.flatMap((result) =>
          result.ok && result.value
            ? [{ latitude: result.value.latitude, longitude: result.value.longitude }]
            : [],
        ),
      );
    });
    return () => {
      isMounted = false;
    };
  }, [list.alerts, watchLive]);

  const days = useMemo(
    () => respondToAlerts.dailyTotals(counts, new Date()),
    [counts, respondToAlerts],
  );

  return {
    alerts: list.alerts,
    isLoading: list.isLoading,
    errorMessage: list.errorMessage || summaryError,
    positions,
    days,
    selectedDay: selectedDay === null ? null : days[selectedDay],
    selectDay: setSelectedDay,
  };
}
