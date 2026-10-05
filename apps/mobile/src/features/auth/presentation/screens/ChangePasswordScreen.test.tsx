import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthRepository, ChangePasswordResult } from '../../domain/repositories/AuthRepository';
import { ChangePassword } from '../../domain/useCases/ChangePassword';
import { CHANGE_PASSWORD_ERROR_MESSAGES } from '../viewModels/useChangePasswordViewModel';
import { ChangePasswordScreen } from './ChangePasswordScreen';

const staff = {
  id: 'u-1',
  name: 'Personal',
  email: 'p@example.com',
  role: 'institucion' as const,
  mustChangePassword: false,
};

async function setup(result: ChangePasswordResult) {
  const repository: jest.Mocked<AuthRepository> = {
    login: jest.fn(),
    loginWithPin: jest.fn(),
    registerGuardian: jest.fn(),
    signOut: jest.fn(),
    changePassword: jest.fn().mockResolvedValue(result),
    getCurrentUser: jest.fn(),
    observeSession: jest.fn(),
  };
  const onChanged = jest.fn();
  await render(
    <ChangePasswordScreen
      changePassword={new ChangePassword(repository)}
      userName="Personal"
      onChanged={onChanged}
      onSignOut={jest.fn()}
    />,
  );
  return { repository, onChanged };
}

async function save(password: string, confirmation: string) {
  await fireEvent.changeText(screen.getByLabelText('Nueva contraseña'), password);
  await fireEvent.changeText(screen.getByLabelText('Confirmar contraseña'), confirmation);
  await fireEvent.press(screen.getByText('Guardar contraseña'));
}

describe('ChangePasswordScreen (SEC-03)', () => {
  it('el personal cambia la contraseña temporal y sigue a la app', async () => {
    const { repository, onChanged } = await setup({ ok: true, user: staff });

    await save('clave-definitiva', 'clave-definitiva');

    await waitFor(() => expect(onChanged).toHaveBeenCalledWith(staff));
    expect(repository.changePassword).toHaveBeenCalledWith('clave-definitiva');
  });

  it('no deja reutilizar la contraseña temporal', async () => {
    const { onChanged } = await setup({ ok: false, reason: 'SAME_PASSWORD' });

    await save('clave-temporal', 'clave-temporal');

    expect(await screen.findByText(CHANGE_PASSWORD_ERROR_MESSAGES.SAME_PASSWORD)).toBeTruthy();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('valida la confirmación sin llamar al servidor', async () => {
    const { repository } = await setup({ ok: true, user: staff });

    await save('clave-definitiva', 'otra-clave');

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeTruthy();
    expect(repository.changePassword).not.toHaveBeenCalled();
  });
});
