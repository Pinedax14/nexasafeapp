import { AuthRepository } from '../repositories/AuthRepository';
import { MAX_NAME_LENGTH, RegisterGuardian, validateRegistration } from './RegisterGuardian';

function createRepository(): jest.Mocked<AuthRepository> {
  return {
    login: jest.fn(),
    loginWithPin: jest.fn(),
    registerGuardian: jest.fn().mockResolvedValue({ ok: true, status: 'CONFIRMATION_PENDING' }),
    signOut: jest.fn(),
    getCurrentUser: jest.fn(),
    observeSession: jest.fn(),
  };
}

describe('validateRegistration', () => {
  it('acepta datos válidos', () => {
    expect(validateRegistration('Ana', 'ana@example.com', '12345678')).toEqual({});
  });

  it('exige el nombre', () => {
    expect(validateRegistration('   ', 'ana@example.com', '12345678').name).toBeDefined();
  });

  it('limita la longitud del nombre', () => {
    const name = 'a'.repeat(MAX_NAME_LENGTH + 1);
    expect(validateRegistration(name, 'ana@example.com', '12345678').name).toBeDefined();
  });

  it('exige un correo válido', () => {
    expect(validateRegistration('Ana', 'ana@', '12345678').email).toBeDefined();
  });

  it('exige al menos 8 caracteres de contraseña (D7)', () => {
    expect(validateRegistration('Ana', 'ana@example.com', '1234567').password).toBeDefined();
  });
});

describe('RegisterGuardian', () => {
  it('no llama al repositorio si los datos son inválidos', async () => {
    const repository = createRepository();

    const result = await new RegisterGuardian(repository).execute('', 'no-es-correo', '123');

    expect(result).toEqual({
      ok: false,
      reason: 'INVALID_INPUT',
      errors: expect.objectContaining({
        name: expect.any(String),
        email: expect.any(String),
        password: expect.any(String),
      }),
    });
    expect(repository.registerGuardian).not.toHaveBeenCalled();
  });

  it('registra con el nombre recortado y el correo normalizado', async () => {
    const repository = createRepository();

    const result = await new RegisterGuardian(repository).execute(
      '  Ana Acudiente ',
      ' Ana@Example.com ',
      'clave-segura',
    );

    expect(repository.registerGuardian).toHaveBeenCalledWith({
      name: 'Ana Acudiente',
      email: 'ana@example.com',
      password: 'clave-segura',
    });
    expect(result).toEqual({ ok: true, status: 'CONFIRMATION_PENDING' });
  });
});
