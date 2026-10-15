import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../domain/entities/Alert';
import { PanicAlerts } from '../../domain/useCases/PanicAlerts';
import { ALERT_CANCELLED_MESSAGE, ALERT_ERROR_MESSAGES } from '../alertMessages';

/** E11-04: mientras hay alerta se revisa cada 30 s si alguien ya la cerró. */
export const ALERT_REFRESH_MS = 30000;

export function usePanicViewModel(panicAlerts: PanicAlerts) {
  const [alert, setAlert] = useState<Alert | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pin, setPin] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  // Al abrir la app se recupera la alerta activa, si la hay.
  useEffect(() => {
    let isMounted = true;
    panicAlerts.active().then((result) => {
      if (!isMounted || !result.ok || !result.value) return;
      setAlert(result.value);
      setDeadline(new Date(result.value.cancellableUntil));
    });
    return () => {
      isMounted = false;
    };
  }, [panicAlerts]);

  // E9-02, E11-04: cuando el guardián o el colegio cierran la alerta, termina el modo discreto.
  const refresh = useCallback(async () => {
    const result = await panicAlerts.active();
    if (!result.ok || result.value) return;
    setAlert(null);
    setDeadline(null);
    setSecondsLeft(0);
  }, [panicAlerts]);

  const hasAlert = alert !== null;
  useEffect(() => {
    if (!hasAlert) return;
    const timer = setInterval(refresh, ALERT_REFRESH_MS);
    return () => clearInterval(timer);
  }, [hasAlert, refresh]);

  // Cuenta regresiva de la ventana de cancelación (10 s).
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setSecondsLeft(panicAlerts.secondsLeft(deadline, new Date()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline, panicAlerts]);

  const trigger = useCallback(async () => {
    setIsSending(true);
    setErrorMessage('');
    setNotice('');
    const result = await panicAlerts.trigger();
    setIsSending(false);
    if (!result.ok) {
      setErrorMessage(ALERT_ERROR_MESSAGES[result.reason]);
      return;
    }
    setPin('');
    setAlert(result.value);
    setDeadline(panicAlerts.cancelDeadline(result.value, new Date()));
  }, [panicAlerts]);

  const cancel = useCallback(async () => {
    if (!alert) return;
    setIsCancelling(true);
    setErrorMessage('');
    const result = await panicAlerts.cancel(alert, pin);
    setIsCancelling(false);
    setPin('');
    if (!result.ok) {
      setErrorMessage(ALERT_ERROR_MESSAGES[result.reason]);
      if (result.reason === 'NOT_CANCELLABLE') {
        setDeadline(null);
        setSecondsLeft(0);
      }
      return;
    }
    setAlert(null);
    setDeadline(null);
    setSecondsLeft(0);
    setNotice(ALERT_CANCELLED_MESSAGE);
  }, [alert, panicAlerts, pin]);

  return {
    alert,
    secondsLeft,
    canCancel: !!alert && secondsLeft > 0,
    /** E6-04 (D30): pasada la ventana, la pantalla no muestra que se pidió ayuda. */
    discreet: !!alert && (deadline === null || deadline.getTime() <= Date.now()),
    refresh,
    pin,
    setPin,
    isSending,
    isCancelling,
    errorMessage,
    notice,
    trigger,
    cancel,
  };
}
