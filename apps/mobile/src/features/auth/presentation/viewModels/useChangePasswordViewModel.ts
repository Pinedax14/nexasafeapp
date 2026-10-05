import { useCallback, useState } from 'react';
import { User } from '../../domain/entities/User';
import { ChangePasswordFailureReason } from '../../domain/repositories/AuthRepository';
import { ChangePassword, ChangePasswordErrors } from '../../domain/useCases/ChangePassword';

export const CHANGE_PASSWORD_ERROR_MESSAGES: Record<ChangePasswordFailureReason, string> = {
  SAME_PASSWORD: 'La nueva contraseña debe ser distinta de la temporal.',
  WEAK_PASSWORD: 'Esa contraseña es muy débil. Elige otra.',
  NETWORK: 'Sin conexión. Revisa tu internet e intenta de nuevo.',
  RATE_LIMITED: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  UNKNOWN: 'No se pudo cambiar la contraseña. Intenta de nuevo.',
};

type UseChangePasswordViewModelProps = {
  changePassword: ChangePassword;
  onChanged: (user: User) => void;
};

export function useChangePasswordViewModel({
  changePassword,
  onChanged,
}: UseChangePasswordViewModelProps) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ChangePasswordErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const updatePassword = useCallback((value: string) => {
    setPassword(value);
    setFieldErrors({});
    setErrorMessage('');
  }, []);

  const updateConfirmation = useCallback((value: string) => {
    setConfirmation(value);
    setFieldErrors((current) => ({ ...current, confirmation: undefined }));
    setErrorMessage('');
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setErrorMessage('');
    const result = await changePassword.execute(password, confirmation);
    setIsSaving(false);

    if (!result.ok) {
      if (result.reason === 'INVALID_INPUT') {
        setFieldErrors(result.errors);
      } else {
        setErrorMessage(CHANGE_PASSWORD_ERROR_MESSAGES[result.reason]);
      }
      return;
    }
    onChanged(result.user);
  }, [changePassword, confirmation, onChanged, password]);

  return {
    password,
    confirmation,
    fieldErrors,
    errorMessage,
    isSaving,
    updatePassword,
    updateConfirmation,
    save,
  };
}
