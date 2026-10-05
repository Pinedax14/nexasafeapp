import { useCallback, useEffect, useState } from 'react';
import { PendingEnrollment } from '../../domain/entities/EnrollmentReview';
import { ValidateEnrollment } from '../../domain/useCases/ValidateEnrollment';
import { ENROLLMENT_ERROR_MESSAGES } from '../enrollmentMessages';

export function usePendingEnrollmentsViewModel(validateEnrollment: ValidateEnrollment) {
  const [pending, setPending] = useState<PendingEnrollment[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    const result = await validateEnrollment.listPending();
    setIsLoading(false);
    if (result.ok) {
      setPending(result.value);
    } else {
      setErrorMessage(ENROLLMENT_ERROR_MESSAGES[result.reason]);
    }
  }, [validateEnrollment]);

  useEffect(() => {
    load();
  }, [load]);

  return { pending, errorMessage, isLoading, reload: load };
}
