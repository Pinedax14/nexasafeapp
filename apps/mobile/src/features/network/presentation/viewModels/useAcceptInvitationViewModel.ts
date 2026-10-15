import { useCallback, useState } from 'react';
import { User } from '../../../auth/domain/entities/User';
import { RegistrationErrors } from '../../../auth/domain/useCases/RegisterGuardian';
import { InvitationPreview } from '../../domain/entities/SupportContact';
import { SupportNetwork } from '../../domain/useCases/SupportNetwork';
import { NETWORK_ERROR_MESSAGES } from '../networkMessages';

export function useAcceptInvitationViewModel(
  supportNetwork: SupportNetwork,
  initialCode: string,
  onSignedIn: (user: User) => void,
) {
  const [code, setCode] = useState(initialCode);
  const [token, setToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);

  const check = useCallback(async () => {
    setIsBusy(true);
    setErrorMessage('');
    const result = await supportNetwork.preview(code);
    setIsBusy(false);
    if (!result.ok) {
      setErrorMessage(NETWORK_ERROR_MESSAGES[result.reason]);
      return;
    }
    setToken(result.value.token);
    setPreview(result.value.preview);
  }, [code, supportNetwork]);

  const register = useCallback(async () => {
    if (!token) return;
    setIsBusy(true);
    setErrorMessage('');
    setFieldErrors({});
    const result = await supportNetwork.register(name, email, password, token);
    setIsBusy(false);
    if (!result.ok) {
      if (result.reason === 'INVALID_INPUT') {
        setFieldErrors(result.errors);
      } else {
        setErrorMessage(NETWORK_ERROR_MESSAGES[result.reason]);
      }
      return;
    }
    if (result.status === 'SIGNED_IN') {
      onSignedIn(result.user);
    } else {
      setConfirmationPending(true);
    }
  }, [email, name, onSignedIn, password, supportNetwork, token]);

  return {
    code,
    setCode,
    preview,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    fieldErrors,
    errorMessage,
    isBusy,
    confirmationPending,
    check,
    register,
  };
}
