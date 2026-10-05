import { User } from '../entities/User';
import { AuthRepository, SessionListener } from '../repositories/AuthRepository';

/** E1-05: recupera la sesión cifrada al abrir la app y avisa si termina. */
export class RestoreSession {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<User | null> {
    try {
      return await this.authRepository.getCurrentUser();
    } catch {
      return null;
    }
  }

  observe(listener: SessionListener): () => void {
    return this.authRepository.observeSession(listener);
  }
}
