import { useCallback, useEffect, useState } from 'react';
import { School } from '../../domain/entities/School';
import { ManageSchools, SchoolErrors, SchoolField } from '../../domain/useCases/ManageSchools';
import { ADMIN_ERROR_MESSAGES } from '../adminMessages';

export function useAdminSchoolsViewModel(manageSchools: ManageSchools) {
  const [schools, setSchools] = useState<School[]>([]);
  const [values, setValues] = useState<Record<SchoolField, string>>({ name: '', nit: '' });
  const [fieldErrors, setFieldErrors] = useState<SchoolErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await manageSchools.list();
    setIsLoading(false);
    if (result.ok) {
      setSchools(result.value);
    } else {
      setErrorMessage(ADMIN_ERROR_MESSAGES[result.reason]);
    }
  }, [manageSchools]);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = useCallback((field: SchoolField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setErrorMessage('');
  }, []);

  const createSchool = useCallback(async () => {
    setIsSaving(true);
    setErrorMessage('');
    const result = await manageSchools.create(values.name, values.nit);
    setIsSaving(false);

    if (!result.ok) {
      if (result.reason === 'INVALID_INPUT') {
        setFieldErrors(result.errors);
      } else {
        setErrorMessage(ADMIN_ERROR_MESSAGES[result.reason]);
      }
      return;
    }

    setValues({ name: '', nit: '' });
    setSchools((current) =>
      [...current, result.value].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }, [manageSchools, values]);

  return {
    schools,
    values,
    fieldErrors,
    errorMessage,
    isLoading,
    isSaving,
    updateField,
    createSchool,
  };
}
