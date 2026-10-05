import { useCallback, useState } from 'react';
import { AssignPin, PinErrors } from '../../domain/useCases/AssignPin';
import { PROFILE_ERROR_MESSAGES } from '../profileMessages';

export const PIN_ASSIGNED_MESSAGE =
  'PIN asignado. El menor ya puede entrar en su celular con su número de documento y este PIN. No lo compartas por chat.';

const onlyDigits = (value: string) => value.replace(/[^0-9]/g, '').slice(0, 4);

export function useAssignPinViewModel(assignPin: AssignPin, protegidoId: string) {
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<PinErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const updatePin = useCallback((value: string) => {
    setPin(onlyDigits(value));
    setFieldErrors({});
    setErrorMessage('');
  }, []);

  const updateConfirmation = useCallback((value: string) => {
    setConfirmation(onlyDigits(value));
    setFieldErrors((current) => ({ ...current, confirmation: undefined }));
    setErrorMessage('');
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setErrorMessage('');
    setNotice('');
    const result = await assignPin.execute(protegidoId, pin, confirmation);
    setIsSaving(false);

    if (!result.ok) {
      if (result.reason === 'INVALID_INPUT') {
        setFieldErrors(result.errors);
      } else {
        setErrorMessage(PROFILE_ERROR_MESSAGES[result.reason]);
      }
      return;
    }
    setPin('');
    setConfirmation('');
    setNotice(PIN_ASSIGNED_MESSAGE);
  }, [assignPin, confirmation, pin, protegidoId]);

  return {
    pin,
    confirmation,
    fieldErrors,
    errorMessage,
    notice,
    isSaving,
    updatePin,
    updateConfirmation,
    save,
  };
}
