import { useCallback, useState } from 'react';
import { User } from '../../domain/entities/User';
import { LoginWithPin, PinLoginErrors } from '../../domain/useCases/LoginWithPin';
import { LOGIN_ERROR_MESSAGES } from './useAuthViewModel';

/** Mismo mensaje para documento desconocido y PIN incorrecto: no revela qué documentos existen. */
export const PIN_INVALID_MESSAGE = 'Documento o PIN incorrectos.';

type UsePinLoginViewModelProps = {
  loginWithPin: LoginWithPin;
  onLoginSuccess: (user: User) => void;
};

export function usePinLoginViewModel({ loginWithPin, onLoginSuccess }: UsePinLoginViewModelProps) {
  const [document, setDocument] = useState('');
  const [pin, setPin] = useState('');
  const [fieldErrors, setFieldErrors] = useState<PinLoginErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateDocument = useCallback((value: string) => {
    setDocument(value);
    setFieldErrors((current) => ({ ...current, document: undefined }));
    setErrorMessage('');
  }, []);

  const updatePin = useCallback((value: string) => {
    setPin(value.replace(/[^0-9]/g, '').slice(0, 4));
    setFieldErrors((current) => ({ ...current, pin: undefined }));
    setErrorMessage('');
  }, []);

  const login = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    const result = await loginWithPin.execute(document, pin);
    setIsLoading(false);

    if (!result.ok) {
      if (result.reason === 'INVALID_INPUT') {
        setFieldErrors(result.errors);
      } else if (result.reason === 'INVALID_CREDENTIALS') {
        setErrorMessage(PIN_INVALID_MESSAGE);
        setPin('');
      } else {
        setErrorMessage(LOGIN_ERROR_MESSAGES[result.reason]);
      }
      return;
    }
    onLoginSuccess(result.user);
  }, [document, loginWithPin, onLoginSuccess, pin]);

  return {
    document,
    pin,
    fieldErrors,
    errorMessage,
    isLoading,
    updateDocument,
    updatePin,
    login,
  };
}
