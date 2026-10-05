import { useCallback, useEffect, useState } from 'react';
import { EnrollmentDetail } from '../../domain/entities/EnrollmentReview';
import { ValidateEnrollment } from '../../domain/useCases/ValidateEnrollment';
import { ENROLLMENT_ERROR_MESSAGES, ENROLLMENT_VALIDATED_MESSAGE } from '../enrollmentMessages';

export function useEnrollmentReviewViewModel(
  validateEnrollment: ValidateEnrollment,
  protegidoId: string,
) {
  const [detail, setDetail] = useState<EnrollmentDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    validateEnrollment.review(protegidoId).then((result) => {
      if (!isMounted) return;
      setIsLoading(false);
      if (result.ok) {
        setDetail(result.value);
      } else {
        setErrorMessage(ENROLLMENT_ERROR_MESSAGES[result.reason]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [validateEnrollment, protegidoId]);

  const validate = useCallback(async () => {
    setIsValidating(true);
    setErrorMessage('');
    const result = await validateEnrollment.validate(protegidoId);
    setIsValidating(false);
    if (!result.ok) {
      setErrorMessage(ENROLLMENT_ERROR_MESSAGES[result.reason]);
      return;
    }
    setDetail((current) => (current ? { ...current, status: 'ACTIVO' } : current));
    setNotice(ENROLLMENT_VALIDATED_MESSAGE);
  }, [validateEnrollment, protegidoId]);

  return { detail, errorMessage, notice, isLoading, isValidating, validate };
}
