import { AuthRepository } from '../repositories/AuthRepository';

export class SignOut {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(): Promise<void> {
    return this.authRepository.signOut();
  }
}
