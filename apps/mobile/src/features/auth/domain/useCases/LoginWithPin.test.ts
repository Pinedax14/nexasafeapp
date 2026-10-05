import { AuthRepository } from '../repositories/AuthRepository';
import { LoginWithPin, validatePinLogin } from './LoginWithPin';

function createRepository(): jest.Mocked<AuthRepository> {
  return {
    login: jest.fn(),
    loginWithPin: jest.fn().mockResolvedValue({ ok: false, reason: 'INVALID_CREDENTIALS' }),
    registerGuardian: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
    observeSession: jest.fn(),
  };
}

describe('validatePinLogin', () => {
  it('acepta documento y PIN de 4 dígitos', () => {
    expect(validatePinLogin('1.023.456.789', '4826')).toEqual({});
  });

  it('rechaza PIN que no tienen exactamente 4 números', () => {
    for (const pin of ['123', '12345', 'abcd']) {
      expect(validatePinLogin('1023456789', pin).pin).toBeDefined();
    }
  });

  it('rechaza un documento muy corto', () => {
    expect(validatePinLogin('12', '4826').document).toBeDefined();
  });
});

describe('LoginWithPin (E1-04)', () => {
  it('no llama al servidor con datos inválidos', async () => {
    const repository = createRepository();

    const result = await new LoginWithPin(repository).execute('', '1');

    expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'INVALID_INPUT' }));
    expect(repository.loginWithPin).not.toHaveBeenCalled();
  });

  it('envía el documento normalizado y el PIN', async () => {
    const repository = createRepository();

    await new LoginWithPin(repository).execute(' 1.023.456-789 ', '4826');

    expect(repository.loginWithPin).toHaveBeenCalledWith('1023456789', '4826');
  });
});
