import { LocalAuthRepository } from './LocalAuthRepository';

jest.mock('../local/users.json', () => [
  { id: 'u-1', name: 'Activo', email: 'Activo@Example.com', password: 'clave1', isActive: true },
  {
    id: 'u-2',
    name: 'Inactivo',
    email: 'inactivo@example.com',
    password: 'clave2',
    isActive: false,
  },
]);

describe('LocalAuthRepository', () => {
  const repository = new LocalAuthRepository();

  it('autentica ignorando mayúsculas y espacios del correo', async () => {
    const result = await repository.login('  activo@example.com ', 'clave1');

    expect(result).toEqual({ id: 'u-1', name: 'Activo', email: 'Activo@Example.com' });
  });

  it('nunca devuelve la contraseña ni el estado interno', async () => {
    const result = await repository.login('activo@example.com', 'clave1');

    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('isActive');
  });

  it('rechaza una contraseña incorrecta', async () => {
    await expect(repository.login('activo@example.com', 'otra')).resolves.toBeNull();
  });

  it('rechaza a un usuario inactivo', async () => {
    await expect(repository.login('inactivo@example.com', 'clave2')).resolves.toBeNull();
  });
});
