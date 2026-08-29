import { useCallback, useMemo, useState } from 'react';
import { LocalAuthRepository } from '../../data/repositories/LocalAuthRepository';
import { User } from '../../domain/entities/User';
import { AuthenticateUser } from '../../domain/useCases/AuthenticateUser';

type UseAuthViewModelProps = {
  onLoginSuccess: (user: User) => void;
};

export function useAuthViewModel({ onLoginSuccess }: UseAuthViewModelProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const authenticateUser = useMemo(() => {
    const repository = new LocalAuthRepository();
    return new AuthenticateUser(repository);
  }, []);

  const updateEmail = useCallback((value: string) => {
    setEmail(value);
    if (errorMessage) setErrorMessage('');
  }, [errorMessage]);

  const updatePassword = useCallback((value: string) => {
    setPassword(value);
    if (errorMessage) setErrorMessage('');
  }, [errorMessage]);

  const login = useCallback(async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Ingresa correo y contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    const user = await authenticateUser.execute(email, password);
    setIsLoading(false);

    if (!user) {
      setErrorMessage('Correo o contraseña incorrectos.');
      return;
    }

    onLoginSuccess(user);
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
