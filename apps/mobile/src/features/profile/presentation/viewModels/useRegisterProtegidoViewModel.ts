import { useCallback, useEffect, useState } from 'react';
import { PhotoFile, SchoolOption } from '../../domain/entities/Protegido';
import {
  ProtegidoErrors,
  ProtegidoField,
  RegisterProtegido,
} from '../../domain/useCases/RegisterProtegido';
import { PROFILE_ERROR_MESSAGES } from '../profileMessages';

type UseRegisterProtegidoProps = {
  registerProtegido: RegisterProtegido;
  guardianId: string;
  pickPhoto: () => Promise<PhotoFile | null>;
  onRegistered: () => void;
};

export function useRegisterProtegidoViewModel({
  registerProtegido,
  guardianId,
  pickPhoto,
  onRegistered,
}: UseRegisterProtegidoProps) {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [policyVersion, setPolicyVersion] = useState('');
  const [name, setName] = useState('');
  const [document, setDocument] = useState('');
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PhotoFile | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [isPolicyVisible, setIsPolicyVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ProtegidoErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    registerProtegido.loadForm().then((result) => {
      if (!isMounted) return;
      setIsLoading(false);
      if (result.ok) {
        setSchools(result.value.schools);
        setPolicyVersion(result.value.policyVersion);
      } else {
        setErrorMessage(PROFILE_ERROR_MESSAGES[result.reason]);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [registerProtegido]);

  const clearError = useCallback((field: ProtegidoField) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setErrorMessage('');
  }, []);

  const updateName = useCallback(
    (value: string) => {
      setName(value);
      clearError('name');
    },
    [clearError],
  );

  const updateDocument = useCallback(
    (value: string) => {
      setDocument(value);
      clearError('document');
    },
    [clearError],
  );

  const selectSchool = useCallback(
    (id: string) => {
      setSchoolId(id);
      clearError('school');
    },
    [clearError],
  );

  const choosePhoto = useCallback(async () => {
    const picked = await pickPhoto();
    if (picked) {
      setPhoto(picked);
      clearError('photo');
    }
  }, [clearError, pickPhoto]);

  const toggleConsent = useCallback(() => {
    setConsentAccepted((current) => !current);
    clearError('consent');
  }, [clearError]);

  const togglePolicy = useCallback(() => setIsPolicyVisible((current) => !current), []);

  const submit = useCallback(async () => {
    setIsSaving(true);
    setErrorMessage('');
    const result = await registerProtegido.execute(guardianId, {
      name,
      document,
      schoolId,
      photo,
      consentAccepted,
      policyVersion,
    });
    setIsSaving(false);

    if (!result.ok) {
      if (result.reason === 'INVALID_INPUT') {
        setFieldErrors(result.errors);
      } else {
        setErrorMessage(PROFILE_ERROR_MESSAGES[result.reason]);
      }
      return;
    }
    onRegistered();
  }, [
    consentAccepted,
    document,
    guardianId,
    name,
    onRegistered,
    photo,
    policyVersion,
    registerProtegido,
    schoolId,
  ]);

  return {
    schools,
    policyVersion,
    name,
    document,
    schoolId,
    photo,
    consentAccepted,
    isPolicyVisible,
    fieldErrors,
    errorMessage,
    isLoading,
    isSaving,
    updateName,
    updateDocument,
    selectSchool,
    choosePhoto,
    toggleConsent,
    togglePolicy,
    submit,
  };
}
