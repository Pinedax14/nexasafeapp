import { useCallback, useEffect, useState } from 'react';
import { Alert } from '../../domain/entities/Alert';
import { PanicAlerts } from '../../domain/useCases/PanicAlerts';
import { ALERT_CANCELLED_MESSAGE, ALERT_ERROR_MESSAGES } from '../alertMessages';

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
