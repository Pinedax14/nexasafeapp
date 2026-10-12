import { useCallback, useEffect, useState } from 'react';
import { SupportContact } from '../../domain/entities/SupportContact';
import { invitationMessage, SupportNetwork } from '../../domain/useCases/SupportNetwork';
import { NETWORK_ERROR_MESSAGES } from '../networkMessages';

export type ShareText = (message: string) => Promise<unknown>;

export function useSupportNetworkViewModel(
  supportNetwork: SupportNetwork,
  protegidoId: string,
  guardianName: string,
  share: ShareText,
) {
  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await supportNetwork.listContacts(protegidoId);
    setIsLoading(false);
    if (result.ok) {
      setContacts(result.value);
    } else {
      setErrorMessage(NETWORK_ERROR_MESSAGES[result.reason]);
    }
  }, [protegidoId, supportNetwork]);

  useEffect(() => {
    load();
  }, [load]);

  const invite = useCallback(async () => {
    setIsInviting(true);
    setErrorMessage('');
    const result = await supportNetwork.invite(protegidoId);
    if (!result.ok) {
      setIsInviting(false);
      setErrorMessage(NETWORK_ERROR_MESSAGES[result.reason]);
      return;
    }
    // El token se comparte una sola vez por el menú de Android (WhatsApp, SMS, correo).
    try {
      await share(invitationMessage(result.value, guardianName));
    } catch {
      setErrorMessage(NETWORK_ERROR_MESSAGES.UNKNOWN);
    }
    setIsInviting(false);
    await load();
  }, [guardianName, load, protegidoId, share, supportNetwork]);

  return { contacts, isLoading, isInviting, errorMessage, invite };
}
