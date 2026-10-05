import { AuthRepository } from '../repositories/AuthRepository';
import { SignOut } from './SignOut';

describe('SignOut', () => {
  it('cierra la sesión en el repositorio', async () => {
    const repository: jest.Mocked<AuthRepository> = {
      login: jest.fn(),
      loginWithPin: jest.fn(),
      registerGuardian: jest.fn(),
      signOut: jest.fn().mockResolvedValue(undefined),
      changePassword: jest.fn(),
      getCurrentUser: jest.fn(),
      observeSession: jest.fn(),
    };

    await new SignOut(repository).execute();

    expect(repository.signOut).toHaveBeenCalledTimes(1);
  });
});
