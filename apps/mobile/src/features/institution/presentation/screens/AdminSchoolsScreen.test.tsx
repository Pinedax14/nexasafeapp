import { fireEvent, render, screen } from '@testing-library/react-native';
import { InstitutionAdminRepository } from '../../domain/repositories/InstitutionAdminRepository';
import { ManageSchools } from '../../domain/useCases/ManageSchools';
import { AdminSchoolsScreen } from './AdminSchoolsScreen';

function setup() {
  const repository: jest.Mocked<InstitutionAdminRepository> = {
    listSchools: jest.fn().mockResolvedValue({
      ok: true,
      value: [{ id: 's-1', name: 'Colegio X', nit: '900000001' }],
    }),
    createSchool: jest
      .fn()
      .mockResolvedValue({ ok: true, value: { id: 's-2', name: 'Colegio A', nit: '900000002' } }),
    listStaff: jest.fn(),
    registerStaff: jest.fn(),
    setStaffActive: jest.fn(),
  };
  const onOpenSchool = jest.fn();
  return { repository, onOpenSchool, manageSchools: new ManageSchools(repository) };
}

describe('AdminSchoolsScreen (E1-06)', () => {
  it('muestra los colegios y abre su personal', async () => {
    const { manageSchools, onOpenSchool } = setup();
    await render(
      <AdminSchoolsScreen
        manageSchools={manageSchools}
        userName="Admin"
        onOpenSchool={onOpenSchool}
        onSignOut={jest.fn()}
      />,
    );

    await fireEvent.press(await screen.findByText('Colegio X'));

    expect(onOpenSchool).toHaveBeenCalledWith({ id: 's-1', name: 'Colegio X', nit: '900000001' });
  });

  it('crea un colegio y lo agrega a la lista', async () => {
    const { manageSchools, repository } = setup();
    await render(
      <AdminSchoolsScreen
        manageSchools={manageSchools}
        userName="Admin"
        onOpenSchool={jest.fn()}
        onSignOut={jest.fn()}
      />,
    );
    await screen.findByText('Colegio X');

    await fireEvent.changeText(screen.getByLabelText('Nombre del colegio'), 'Colegio A');
    await fireEvent.changeText(screen.getByLabelText('NIT'), '900000002');
    await fireEvent.press(screen.getByText('Crear colegio'));

    expect(await screen.findByText('Colegio A')).toBeTruthy();
    expect(repository.createSchool).toHaveBeenCalledWith('Colegio A', '900000002');
  });

  it('muestra los errores de validación', async () => {
    const { manageSchools, repository } = setup();
    await render(
      <AdminSchoolsScreen
        manageSchools={manageSchools}
        userName="Admin"
        onOpenSchool={jest.fn()}
        onSignOut={jest.fn()}
      />,
    );
    await screen.findByText('Colegio X');

    await fireEvent.press(screen.getByText('Crear colegio'));

    expect(await screen.findByText('Ingresa el nombre del colegio.')).toBeTruthy();
    expect(repository.createSchool).not.toHaveBeenCalled();
  });
});
