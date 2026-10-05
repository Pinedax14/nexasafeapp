import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ProtegidoRepository } from '../../domain/repositories/ProtegidoRepository';
import { RegisterProtegido } from '../../domain/useCases/RegisterProtegido';
import { RegisterProtegidoScreen } from './RegisterProtegidoScreen';

function setup() {
  const repository: jest.Mocked<ProtegidoRepository> = {
    listMine: jest.fn(),
    listSchools: jest
      .fn()
      .mockResolvedValue({ ok: true, value: [{ id: 's-1', name: 'Colegio San Mateo' }] }),
    currentPolicyVersion: jest.fn().mockResolvedValue({ ok: true, value: '1.0' }),
    uploadPhoto: jest.fn().mockResolvedValue({ ok: true, value: 'g-1/foto.jpg' }),
    register: jest.fn().mockResolvedValue({ ok: true, value: 'p-1' }),
  };
  const pickPhoto = jest
    .fn()
    .mockResolvedValue({ uri: 'file:///foto.jpg', mimeType: 'image/jpeg', sizeBytes: 1000 });
  const onRegistered = jest.fn();
  return {
    repository,
    pickPhoto,
    onRegistered,
    registerProtegido: new RegisterProtegido(repository),
  };
}

async function fillForm() {
  await fireEvent.changeText(await screen.findByLabelText('Nombre del menor'), 'Menor Uno');
  await fireEvent.changeText(screen.getByLabelText('Documento del menor'), '1023456789');
  await fireEvent.press(screen.getByText(/Colegio San Mateo/));
  await fireEvent.press(screen.getByText('Elegir foto'));
  await screen.findByText('Cambiar foto');
}

describe('RegisterProtegidoScreen (E1-02, E11-01)', () => {
  it('no registra al menor sin aceptar la política de tratamiento', async () => {
    const { repository, pickPhoto, onRegistered, registerProtegido } = setup();
    await render(
      <RegisterProtegidoScreen
        registerProtegido={registerProtegido}
        guardianId="g-1"
        pickPhoto={pickPhoto}
        onRegistered={onRegistered}
        onCancel={jest.fn()}
      />,
    );

    await fillForm();
    await fireEvent.press(screen.getAllByText('Registrar menor')[1]);

    expect(
      await screen.findByText(
        'Debes aceptar la política de tratamiento de datos para registrar al menor.',
      ),
    ).toBeTruthy();
    expect(repository.register).not.toHaveBeenCalled();
    expect(onRegistered).not.toHaveBeenCalled();
  });

  it('registra al menor cuando el acudiente acepta la política', async () => {
    const { repository, pickPhoto, onRegistered, registerProtegido } = setup();
    await render(
      <RegisterProtegidoScreen
        registerProtegido={registerProtegido}
        guardianId="g-1"
        pickPhoto={pickPhoto}
        onRegistered={onRegistered}
        onCancel={jest.fn()}
      />,
    );

    await fillForm();
    await fireEvent.press(screen.getByLabelText('Acepto la política de tratamiento de datos'));
    await fireEvent.press(screen.getAllByText('Registrar menor')[1]);

    await waitFor(() => expect(onRegistered).toHaveBeenCalled());
    expect(repository.register).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Menor Uno', schoolId: 's-1', policyVersion: '1.0' }),
    );
    expect(onRegistered).toHaveBeenCalled();
  });

  it('muestra la política de tratamiento dentro de la app (RNF-21)', async () => {
    const { pickPhoto, registerProtegido } = setup();
    await render(
      <RegisterProtegidoScreen
        registerProtegido={registerProtegido}
        guardianId="g-1"
        pickPhoto={pickPhoto}
        onRegistered={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    await fireEvent.press(await screen.findByText(/Leer la política de tratamiento/));

    expect(screen.getByText('Para qué')).toBeTruthy();
  });
});
