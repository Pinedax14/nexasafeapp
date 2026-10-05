import { useCallback, useEffect, useState } from 'react';
import { Staff } from '../../domain/entities/Staff';
import { ManageStaff, StaffErrors, StaffField, StaffForm } from '../../domain/useCases/ManageStaff';
import { ADMIN_ERROR_MESSAGES } from '../adminMessages';

const EMPTY_FORM: StaffForm = { name: '', position: '', email: '', temporaryPassword: '' };

export const STAFF_CREATED_MESSAGE =
  'Cuenta creada. Entrega la contraseña temporal a la persona en privado; no la envíes por chat.';

export function useSchoolStaffViewModel(manageStaff: ManageStaff, schoolId: string) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [values, setValues] = useState<StaffForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<StaffErrors>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await manageStaff.list(schoolId);
    setIsLoading(false);
    if (result.ok) {
      setStaff(result.value);
    } else {
      setErrorMessage(ADMIN_ERROR_MESSAGES[result.reason]);
    }
  }, [manageStaff, schoolId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = useCallback((field: StaffField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setErrorMessage('');
    setNotice('');
  }, []);

  const registerStaff = useCallback(async () => {
    setIsSaving(true);
    setErrorMessage('');
    setNotice('');
    const result = await manageStaff.register(schoolId, values);
    setIsSaving(false);

    if (!result.ok) {
      if (result.reason === 'INVALID_INPUT') {
        setFieldErrors(result.errors);
      } else {
        setErrorMessage(ADMIN_ERROR_MESSAGES[result.reason]);
      }
      return;
    }

    setValues(EMPTY_FORM);
    setNotice(STAFF_CREATED_MESSAGE);
    await load();
  }, [load, manageStaff, schoolId, values]);

  const toggleActive = useCallback(
    async (member: Staff) => {
      setErrorMessage('');
      const result = await manageStaff.setActive(member.id, !member.active);
      if (!result.ok) {
        setErrorMessage(ADMIN_ERROR_MESSAGES[result.reason]);
        return;
      }
      setStaff((current) =>
        current.map((item) => (item.id === member.id ? { ...item, active: !item.active } : item)),
      );
    },
    [manageStaff],
  );

  return {
    staff,
    values,
    fieldErrors,
    errorMessage,
    notice,
    isLoading,
    isSaving,
    updateField,
    registerStaff,
    toggleActive,
  };
}
