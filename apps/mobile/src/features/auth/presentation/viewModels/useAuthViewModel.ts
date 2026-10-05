import { useCallback, useState } from 'react';
import { User } from '../../domain/entities/User';
import { LoginFailureReason } from '../../domain/repositories/AuthRepository';
import { AuthenticateUser } from '../../domain/useCases/AuthenticateUser';

export const LOGIN_ERROR_MESSAGES: Record<LoginFailureReason, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  EMAIL_NOT_CONFIRMED: 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  RATE_LIMITED: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  LOCKED:
    'Por seguridad, el ingreso con PIN quedó bloqueado 15 minutos. Pide ayuda a tu acudiente.',
  UNKNOWN: 'No se pudo iniciar sesión. Intenta de nuevo.',
};

type UseAuthViewModelProps = {
  authenticateUser: AuthenticateUser;
  onLoginSuccess: (user: User) => void;
};

export function useAuthViewModel({ authenticateUser, onLoginSuccess }: UseAuthViewModelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateEmail = useCallback(
    (value: string) => {
      setEmail(value);
      if (errorMessage) setErrorMessage('');
    },
    [errorMessage],
  );

  const updatePassword = useCallback(
    (value: string) => {
      setPassword(value);
      if (errorMessage) setErrorMessage('');
    },
    [errorMessage],
  );

  const login = useCallback(async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Ingresa correo y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    const result = await authenticateUser.execute(email, password);
    setIsLoading(false);

    if (!result.ok) {
      setErrorMessage(LOGIN_ERROR_MESSAGES[result.reason]);
      return;
    }

    onLoginSuccess(result.user);
  }, [authenticateUser, email, onLoginSuccess, password]);

  return {
    email,
    password,
    errorMessage,
    isLoading,
    updateEmail,
    updatePassword,
    login,
  };
}
