import { AuthRepository, LoginResult } from '../repositories/AuthRepository';

export class AuthenticateUser {
  constructor(private readonly authRepository: AuthRepository) {}

  execute(email: string, password: string): Promise<LoginResult> {
    return this.authRepository.login(email.trim().toLowerCase(), password);
  }
}
