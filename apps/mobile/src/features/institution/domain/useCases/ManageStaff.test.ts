import { InstitutionAdminRepository } from '../repositories/InstitutionAdminRepository';
import { ManageStaff, MAX_STAFF_TEXT_LENGTH, StaffForm, validateStaff } from './ManageStaff';

const validForm: StaffForm = {
  name: '  Docente Uno ',
  position: ' Coordinación ',
  email: ' Docente@Example.com ',
  temporaryPassword: 'clave-temporal',
};

function createRepository(): jest.Mocked<InstitutionAdminRepository> {
  return {
    listSchools: jest.fn(),
    createSchool: jest.fn(),
    listStaff: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    registerStaff: jest.fn().mockResolvedValue({ ok: true, value: 'staff-1' }),
    setStaffActive: jest.fn().mockResolvedValue({ ok: true, value: undefined }),
  };
}

describe('validateStaff', () => {
  it('acepta un formulario válido', () => {
    expect(validateStaff(validForm)).toEqual({});
  });

  it('marca cada campo inválido', () => {
    const errors = validateStaff({
      name: '',
      position: 'x'.repeat(MAX_STAFF_TEXT_LENGTH + 1),
      email: 'no-es-correo',
      temporaryPassword: '1234567',
    });

    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'position', 'temporaryPassword']);
  });
});

describe('ManageStaff', () => {
  it('lista el personal del colegio', async () => {
    const repository = createRepository();

    await new ManageStaff(repository).list('s-1');

    expect(repository.listStaff).toHaveBeenCalledWith('s-1');
  });

  it('no registra si el formulario es inválido', async () => {
    const repository = createRepository();

    const result = await new ManageStaff(repository).register('s-1', {
      ...validForm,
      email: 'mal',
    });

    expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'INVALID_INPUT' }));
    expect(repository.registerStaff).not.toHaveBeenCalled();
  });

  it('registra con los datos normalizados y la contraseña temporal intacta', async () => {
    const repository = createRepository();

    const result = await new ManageStaff(repository).register('s-1', validForm);

    expect(repository.registerStaff).toHaveBeenCalledWith({
      schoolId: 's-1',
      name: 'Docente Uno',
      position: 'Coordinación',
      email: 'docente@example.com',
      temporaryPassword: 'clave-temporal',
    });
    expect(result).toEqual({ ok: true, value: 'staff-1' });
  });

  it('envía el cargo vacío como null', async () => {
    const repository = createRepository();

    await new ManageStaff(repository).register('s-1', { ...validForm, position: '  ' });

    expect(repository.registerStaff).toHaveBeenCalledWith(
      expect.objectContaining({ position: null }),
    );
  });

  it('activa o desactiva al personal', async () => {
    const repository = createRepository();

    await new ManageStaff(repository).setActive('staff-1', false);

    expect(repository.setStaffActive).toHaveBeenCalledWith('staff-1', false);
  });
});
