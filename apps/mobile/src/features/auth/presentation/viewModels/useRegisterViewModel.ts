import { useCallback, useState } from 'react';
import { User } from '../../domain/entities/User';
import { RegisterFailureReason } from '../../domain/repositories/AuthRepository';
import {
  MIN_PASSWORD_LENGTH,
  RegisterGuardian,
  RegistrationErrors,
  RegistrationField,
} from '../../domain/useCases/RegisterGuardian';

export const REGISTER_ERROR_MESSAGES: Record<RegisterFailureReason, string> = {
  WEAK_PASSWORD: `La contraseña es muy débil. Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  RATE_LIMITED: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  UNKNOWN: 'No se pudo completar el registro. Intenta de nuevo.',
};

/** D2: el mismo mensaje para un correo nuevo y uno ya registrado. */
export const CONFIRMATION_MESSAGE =
  'Si el correo es válido, te enviamos un enlace para confirmar tu cuenta. Ábrelo y luego inicia sesión.';

type UseRegisterViewModelProps = {
  registerGuardian: RegisterGuardian;
  onSignedIn: (user: User) => void;
};

export function useRegisterViewModel({ registerGuardian, onSignedIn }: UseRegisterViewModelProps) {
  const [values, setValues] = useState<Record<RegistrationField, string>>({
    name: '',
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmationPending, setIsConfirmationPending] = useState(false);

  const updateField = useCallback((field: RegistrationField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setErrorMessage('');
  }, []);

  const register = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    const result = await registerGuardian.execute(values.name, values.email, values.password);
    setIsLoading(false);

    if (!result.ok) {
      if (result.reason === 'INVALID_INPUT') {
        setFieldErrors(result.errors);
      } else {
        setErrorMessage(REGISTER_ERROR_MESSAGES[result.reason]);
      }
      return;
    }

    if (result.status === 'SIGNED_IN') {
      onSignedIn(result.user);
      return;
    }

    setIsConfirmationPending(true);
  }, [onSignedIn, registerGuardian, values]);

  return {
    values,
    fieldErrors,
    errorMessage,
    isLoading,
    isConfirmationPending,
    updateField,
    register,
  };
}
