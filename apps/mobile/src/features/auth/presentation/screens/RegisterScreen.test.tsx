import { fireEvent, render, screen } from '@testing-library/react-native';
import { AuthRepository } from '../../domain/repositories/AuthRepository';
import { RegisterGuardian } from '../../domain/useCases/RegisterGuardian';
import { RegisterScreen } from './RegisterScreen';

function createRegisterGuardian() {
  const repository: jest.Mocked<AuthRepository> = {
    login: jest.fn(),
    registerGuardian: jest.fn().mockResolvedValue({ ok: true, status: 'CONFIRMATION_PENDING' }),
    signOut: jest.fn(),
  };
  return { repository, registerGuardian: new RegisterGuardian(repository) };
}

describe('RegisterScreen', () => {
  it('muestra los errores de validación sin llamar al servidor', async () => {
    const { repository, registerGuardian } = createRegisterGuardian();
    await render(
      <RegisterScreen
        registerGuardian={registerGuardian}
        onSignedIn={jest.fn()}
        onGoToLogin={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByText('Crear cuenta'));

    expect(await screen.findByText('Ingresa tu nombre.')).toBeTruthy();
    expect(screen.getByText('Ingresa un correo válido.')).toBeTruthy();
    expect(repository.registerGuardian).not.toHaveBeenCalled();
  });

  it('pide confirmar el correo después de registrarse (E1-01, D2)', async () => {
    const { registerGuardian } = createRegisterGuardian();
    await render(
      <RegisterScreen
        registerGuardian={registerGuardian}
        onSignedIn={jest.fn()}
        onGoToLogin={jest.fn()}
      />,
    );

    await fireEvent.changeText(screen.getByLabelText('Nombre completo'), 'Ana Acudiente');
    await fireEvent.changeText(screen.getByLabelText('Correo'), 'ana@example.com');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'clave-segura');
    await fireEvent.press(screen.getByText('Crear cuenta'));

    expect(await screen.findByText('Revisa tu correo')).toBeTruthy();
  });
});
