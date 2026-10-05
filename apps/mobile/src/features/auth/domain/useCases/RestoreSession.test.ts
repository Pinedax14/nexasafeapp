import { User } from '../entities/User';
import { AuthRepository } from '../repositories/AuthRepository';
import { RestoreSession } from './RestoreSession';

const user: User = { id: 'u-1', name: 'Ana', email: 'ana@example.com', role: 'guardian' };

function createRepository(): jest.Mocked<AuthRepository> {
  return {
    login: jest.fn(),
    loginWithPin: jest.fn(),
    registerGuardian: jest.fn(),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
    observeSession: jest.fn(),
  };
}

describe('RestoreSession', () => {
  it('devuelve el usuario de la sesión guardada', async () => {
    const repository = createRepository();
    repository.getCurrentUser.mockResolvedValue(user);

    await expect(new RestoreSession(repository).execute()).resolves.toEqual(user);
  });

  it('devuelve null si no hay sesión guardada', async () => {
    const repository = createRepository();
    repository.getCurrentUser.mockResolvedValue(null);

    await expect(new RestoreSession(repository).execute()).resolves.toBeNull();
  });

  it('devuelve null si no se puede leer la sesión', async () => {
    const repository = createRepository();
    repository.getCurrentUser.mockRejectedValue(new Error('almacenamiento no disponible'));

    await expect(new RestoreSession(repository).execute()).resolves.toBeNull();
  });

  it('delega la observación de la sesión en el repositorio', () => {
    const repository = createRepository();
    const stop = jest.fn();
    repository.observeSession.mockReturnValue(stop);
    const listener = jest.fn();

    const result = new RestoreSession(repository).observe(listener);

    expect(repository.observeSession).toHaveBeenCalledWith(listener);
    expect(result).toBe(stop);
  });
});
