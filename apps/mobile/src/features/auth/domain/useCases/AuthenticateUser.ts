import { User } from '../entities/User';
import { AuthRepository } from '../repositories/AuthRepository';

export class AuthenticateUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(email: string, password: string): Promise<User | null> {
    return this.authRepository.login(email, password);
  }
}