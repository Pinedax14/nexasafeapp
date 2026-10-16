import { useCallback, useEffect, useState } from 'react';
import { LivePosition } from '../../../tracking/domain/entities/Position';
import { WatchLive } from '../../../tracking/domain/useCases/WatchLive';
import {
  AlertSummary,
  Classification,
  IncidentEvent,
  ResponderRole,
} from '../../domain/entities/AlertSummary';
import { isActive, RespondToAlerts } from '../../domain/useCases/RespondToAlerts';
import { ALERT_ERROR_MESSAGES, CLOSED_MESSAGE, RESPONDED_MESSAGE } from '../alertMessages';

/** El contacto de apoyo y el colegio no escuchan el canal en vivo (D26): se consulta cada 5 s. */
export const POSITION_REFRESH_MS = 5000;

/** W11 · Alerta recibida y W12 · Cierre clasificado (E7-02, E9-01, E9-02). */
export function useAlertDetailViewModel(
  respondToAlerts: RespondToAlerts,
  watchLive: WatchLive,
  initialAlert: AlertSummary,
  role: ResponderRole,
) {
  const [alert, setAlert] = useState(initialAlert);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const active = isActive(alert);

  const loadLog = useCallback(async () => {
    const result = await respondToAlerts.log(alert.id);
    if (result.ok) setEvents(result.value);
    else setErrorMessage(ALERT_ERROR_MESSAGES[result.reason]);
  }, [alert.id, respondToAlerts]);

  useEffect(() => {
    loadLog();
  }, [loadLog]);

  // Posición de la alerta mientras siga activa (RF-24, RF-41).
  useEffect(() => {
    if (!active) return;
    let isMounted = true;
    const refresh = () =>
      watchLive.latest(alert.protegidoId).then((result) => {
        if (isMounted && result.ok) setPosition(result.value);
      });
    refresh();
    const timer = setInterval(refresh, POSITION_REFRESH_MS);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [active, alert.protegidoId, watchLive]);

  useEffect(() => {
    if (!position) return;
    const tick = () => setSecondsAgo(watchLive.secondsSince(position, new Date()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [position, watchLive]);

  const respond = useCallback(async () => {
    setIsSaving(true);
    setErrorMessage('');
    const result = await respondToAlerts.respond(alert);
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage(ALERT_ERROR_MESSAGES[result.reason]);
      return;
    }
    setAlert((current) => ({ ...current, status: 'ATENDIDA' }));
    setNotice(RESPONDED_MESSAGE);
    await loadLog();
  }, [alert, loadLog, respondToAlerts]);

  const close = useCallback(async () => {
    setIsSaving(true);
    setErrorMessage('');
    const result = await respondToAlerts.close(alert, classification, note);
    setIsSaving(false);
    if (!result.ok) {
      setErrorMessage(ALERT_ERROR_MESSAGES[result.reason]);
      return;
    }
    setAlert((current) => ({
      ...current,
      status: 'CERRADA',
      classification,
      closedAt: new Date().toISOString(),
    }));
    setIsClosing(false);
    setPosition(null);
    setNotice(CLOSED_MESSAGE);
    await loadLog();
  }, [alert, classification, loadLog, note, respondToAlerts]);

  return {
    alert,
    events,
    position,
    secondsAgo,
    canRespond: respondToAlerts.canRespond(role, alert),
    canClose: respondToAlerts.canClose(role, alert),
    isClosing,
    startClosing: () => setIsClosing(true),
    cancelClosing: () => setIsClosing(false),
    classification,
    setClassification,
    note,
    setNote,
    isSaving,
    errorMessage,
    notice,
    respond,
    close,
  };
}
