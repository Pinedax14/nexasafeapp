import { AuthRepository } from '../repositories/AuthRepository';
import { SignOut } from './SignOut';

describe('SignOut', () => {
  it('cierra la sesión en el repositorio', async () => {
    const repository: jest.Mocked<AuthRepository> = {
      login: jest.fn(),
      registerGuardian: jest.fn(),
      signOut: jest.fn().mockResolvedValue(undefined),
    };

    await new SignOut(repository).execute();

    expect(repository.signOut).toHaveBeenCalledTimes(1);
  });
});
