import { useCallback, useEffect, useState } from 'react';
import { AlertSummary } from '../../domain/entities/AlertSummary';
import { RespondToAlerts } from '../../domain/useCases/RespondToAlerts';
import { ALERT_ERROR_MESSAGES } from '../alertMessages';

/** Las listas se actualizan solas mientras la pantalla está abierta. */
export const ALERT_LIST_REFRESH_MS = 15000;

/** Sin caso de uso (pantallas que no muestran alertas) la lista queda vacía. */
export function useAlertListViewModel(
  respondToAlerts: RespondToAlerts | undefined,
  onlyActive: boolean,
) {
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [isLoading, setIsLoading] = useState(!!respondToAlerts);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    if (!respondToAlerts) return;
    const result = await respondToAlerts.list(onlyActive);
    setIsLoading(false);
    if (!result.ok) {
      setErrorMessage(ALERT_ERROR_MESSAGES[result.reason]);
      return;
    }
    setErrorMessage('');
    setAlerts(result.value);
  }, [onlyActive, respondToAlerts]);

  useEffect(() => {
    if (!respondToAlerts) return;
    load();
    const timer = setInterval(load, ALERT_LIST_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load, respondToAlerts]);

  return { alerts, isLoading, errorMessage, reload: load };
}
