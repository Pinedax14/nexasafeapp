import { User } from '../entities/User';
import { AuthRepository } from '../repositories/AuthRepository';
import { AuthenticateUser } from './AuthenticateUser';

const user: User = { id: 'u-test', name: 'Usuario de prueba', email: 'test@example.com' };

function createRepository(result: User | null): jest.Mocked<AuthRepository> {
  return { login: jest.fn().mockResolvedValue(result) };
}

describe('AuthenticateUser', () => {
  it('devuelve el usuario cuando el repositorio acepta las credenciales', async () => {
    const repository = createRepository(user);

    const result = await new AuthenticateUser(repository).execute('test@example.com', 'secreta');

    expect(result).toEqual(user);
    expect(repository.login).toHaveBeenCalledWith('test@example.com', 'secreta');
  });

  it('devuelve null cuando el repositorio rechaza las credenciales', async () => {
    const repository = createRepository(null);

    const result = await new AuthenticateUser(repository).execute('test@example.com', 'incorrecta');

    expect(result).toBeNull();
  });
});
