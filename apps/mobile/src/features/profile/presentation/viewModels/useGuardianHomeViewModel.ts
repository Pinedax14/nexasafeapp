import { useCallback, useEffect, useState } from 'react';
import { Protegido } from '../../domain/entities/Protegido';
import { ListMyProtegidos } from '../../domain/useCases/ListMyProtegidos';
import { PROFILE_ERROR_MESSAGES } from '../profileMessages';

export function useGuardianHomeViewModel(listMyProtegidos: ListMyProtegidos) {
  const [protegidos, setProtegidos] = useState<Protegido[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    const result = await listMyProtegidos.execute();
    setIsLoading(false);
    if (result.ok) {
      setProtegidos(result.value);
    } else {
      setErrorMessage(PROFILE_ERROR_MESSAGES[result.reason]);
    }
  }, [listMyProtegidos]);

  useEffect(() => {
    load();
  }, [load]);

  return { protegidos, errorMessage, isLoading, reload: load };
}
