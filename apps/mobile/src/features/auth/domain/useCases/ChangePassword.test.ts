import { AuthRepository } from '../repositories/AuthRepository';
import { ChangePassword, validateNewPassword } from './ChangePassword';

const staff = {
  id: 'u-1',
  name: 'Personal',
  email: 'p@example.com',
  role: 'institucion' as const,
  mustChangePassword: false,
};

function createRepository(): jest.Mocked<AuthRepository> {
  return {
    login: jest.fn(),
    loginWithPin: jest.fn(),
    registerGuardian: jest.fn(),
    signOut: jest.fn(),
    changePassword: jest.fn().mockResolvedValue({ ok: true, user: staff }),
    getCurrentUser: jest.fn(),
    observeSession: jest.fn(),
  };
}

describe('validateNewPassword', () => {
  it('acepta una contraseña de 8 o más caracteres confirmada', () => {
    expect(validateNewPassword('clave-definitiva', 'clave-definitiva')).toEqual({});
  });

  it('rechaza contraseñas cortas', () => {
    expect(validateNewPassword('corta', 'corta').password).toBeDefined();
  });

  it('exige que la confirmación coincida', () => {
    expect(validateNewPassword('clave-definitiva', 'otra-clave')).toEqual({
      confirmation: 'Las contraseñas no coinciden.',
    });
  });
});

describe('ChangePassword (SEC-03)', () => {
  it('no llama al servidor con datos inválidos', async () => {
    const repository = createRepository();

    const result = await new ChangePassword(repository).execute('corta', 'corta');

    expect(result).toEqual(expect.objectContaining({ ok: false, reason: 'INVALID_INPUT' }));
    expect(repository.changePassword).not.toHaveBeenCalled();
  });

  it('cambia la contraseña', async () => {
    const repository = createRepository();

    const result = await new ChangePassword(repository).execute(
      'clave-definitiva',
      'clave-definitiva',
    );

    expect(repository.changePassword).toHaveBeenCalledWith('clave-definitiva');
    expect(result).toEqual({ ok: true, user: staff });
  });
});
