import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthRepository, LoginResult } from '../../domain/repositories/AuthRepository';
import { LoginWithPin } from '../../domain/useCases/LoginWithPin';
import { LOGIN_ERROR_MESSAGES } from '../viewModels/useAuthViewModel';
import { PIN_INVALID_MESSAGE } from '../viewModels/usePinLoginViewModel';
import { PinLoginScreen } from './PinLoginScreen';

const menor = { id: 'u-1', name: 'Menor Uno', email: '', role: 'protegido' as const };

async function setup(result: LoginResult) {
  const repository: jest.Mocked<AuthRepository> = {
    login: jest.fn(),
    loginWithPin: jest.fn().mockResolvedValue(result),
    registerGuardian: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
    observeSession: jest.fn(),
  };
  const onLoginSuccess = jest.fn();
  await render(
    <PinLoginScreen
      loginWithPin={new LoginWithPin(repository)}
      onLoginSuccess={onLoginSuccess}
      onBack={jest.fn()}
    />,
  );
  return { repository, onLoginSuccess };
}

async function enter(document: string, pin: string) {
  await fireEvent.changeText(screen.getByLabelText('Número de documento'), document);
  await fireEvent.changeText(screen.getByLabelText('PIN'), pin);
  await fireEvent.press(screen.getByText('Entrar'));
}

describe('PinLoginScreen (E1-04)', () => {
  it('el menor entra con documento y PIN correctos', async () => {
    const { repository, onLoginSuccess } = await setup({ ok: true, user: menor });

    await enter('1023456789', '4826');

    await waitFor(() => expect(onLoginSuccess).toHaveBeenCalledWith(menor));
    expect(repository.loginWithPin).toHaveBeenCalledWith('1023456789', '4826');
  });

  it('muestra un mensaje genérico si el documento o el PIN no son correctos', async () => {
    const { onLoginSuccess } = await setup({ ok: false, reason: 'INVALID_CREDENTIALS' });

    await enter('1023456789', '4826');

    expect(await screen.findByText(PIN_INVALID_MESSAGE)).toBeTruthy();
    expect(screen.getByLabelText('PIN').props.value).toBe('');
    expect(onLoginSuccess).not.toHaveBeenCalled();
  });

  it('avisa del bloqueo tras varios intentos fallidos', async () => {
    await setup({ ok: false, reason: 'LOCKED' });

    await enter('1023456789', '4826');

    expect(await screen.findByText(LOGIN_ERROR_MESSAGES.LOCKED)).toBeTruthy();
  });

  it('valida los campos sin llamar al servidor y descarta letras en el PIN', async () => {
    const { repository } = await setup({ ok: true, user: menor });

    await enter('', '4a');

    expect(screen.getByLabelText('PIN').props.value).toBe('4');
    expect(await screen.findByText('El PIN tiene 4 números.')).toBeTruthy();
    expect(repository.loginWithPin).not.toHaveBeenCalled();
  });
});
