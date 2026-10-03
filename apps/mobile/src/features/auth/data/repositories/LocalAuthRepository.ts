import users from '../local/users.json';
import { User } from '../../domain/entities/User';
import { AuthRepository } from '../../domain/repositories/AuthRepository';

type LocalUser = User & {
  password: string;
  isActive?: boolean;
};

export class LocalAuthRepository implements AuthRepository {
  async login(email: string, password: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = (users as LocalUser[]).find((item) => {
      return (
        item.isActive !== false &&
        item.email.trim().toLowerCase() === normalizedEmail &&
        item.password === password.trim()
      );
    });

    if (!user) {
      return null;
    }

    const { password: _password, isActive: _isActive, ...safeUser } = user;
    return safeUser;
  }
}
