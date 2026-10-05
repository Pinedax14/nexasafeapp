import { User } from '../entities/User';
import { AuthRepository, LoginResult } from '../repositories/AuthRepository';
import { AuthenticateUser } from './AuthenticateUser';

const user: User = {
  id: 'u-test',
  name: 'Usuario de prueba',
  email: 'test@example.com',
  role: 'guardian',
};

function createRepository(result: LoginResult): jest.Mocked<AuthRepository> {
  return {
    login: jest.fn().mockResolvedValue(result),
    registerGuardian: jest.fn(),
    signOut: jest.fn(),
  };
}

describe('AuthenticateUser', () => {
  it('devuelve el usuario cuando el repositorio acepta las credenciales', async () => {
    const repository = createRepository({ ok: true, user });

    const result = await new AuthenticateUser(repository).execute('test@example.com', 'secreta');

    expect(result).toEqual({ ok: true, user });
  });

  it('normaliza el correo antes de autenticar', async () => {
    const repository = createRepository({ ok: true, user });

    await new AuthenticateUser(repository).execute('  Test@Example.COM ', 'secreta');

    expect(repository.login).toHaveBeenCalledWith('test@example.com', 'secreta');
  });

  it('propaga el motivo cuando el repositorio rechaza las credenciales', async () => {
    const repository = createRepository({ ok: false, reason: 'INVALID_CREDENTIALS' });

    const result = await new AuthenticateUser(repository).execute('test@example.com', 'mala');

    expect(result).toEqual({ ok: false, reason: 'INVALID_CREDENTIALS' });
  });
});
