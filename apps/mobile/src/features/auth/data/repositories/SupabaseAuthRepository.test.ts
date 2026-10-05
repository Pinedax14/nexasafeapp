import { AuthError, User as SupabaseUser } from '@supabase/supabase-js';
import { SupabaseAuthClient, SupabaseAuthRepository, toDomainUser } from './SupabaseAuthRepository';

function authError(fields: { name?: string; status?: number; code?: string }): AuthError {
  return {
    name: 'AuthApiError',
    message: 'error',
    status: 400,
    ...fields,
  } as AuthError;
}

const supabaseUser = {
  id: 'u-1',
  email: 'ana@example.com',
  user_metadata: { nombre: 'Ana Acudiente' },
  app_metadata: { rol: 'guardian' },
} as unknown as SupabaseUser;

function createClient(): jest.Mocked<SupabaseAuthClient> {
  return {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  } as unknown as jest.Mocked<SupabaseAuthClient>;
}

describe('toDomainUser', () => {
  it('toma el nombre de user_metadata y el rol de app_metadata', () => {
    expect(toDomainUser(supabaseUser)).toEqual({
      id: 'u-1',
      email: 'ana@example.com',
      name: 'Ana Acudiente',
      role: 'guardian',
      mustChangePassword: false,
    });
  });

  it('usa el correo como nombre y rol null si faltan datos', () => {
    const user = {
      id: 'u-2',
      email: 'x@example.com',
      user_metadata: {},
      app_metadata: { rol: 'superusuario' },
    } as unknown as SupabaseUser;

    expect(toDomainUser(user)).toEqual({
      id: 'u-2',
      email: 'x@example.com',
      name: 'x@example.com',
      role: null,
      mustChangePassword: false,
    });
  });
});

describe('SupabaseAuthRepository.login', () => {
  it('devuelve el usuario cuando Supabase inicia la sesión', async () => {
    const client = createClient();
    client.signInWithPassword.mockResolvedValue({
      data: { user: supabaseUser, session: {} },
      error: null,
    } as never);

    const result = await new SupabaseAuthRepository(client).login('ana@example.com', 'clave');

    expect(client.signInWithPassword).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'clave',
    });
    expect(result).toEqual({ ok: true, user: toDomainUser(supabaseUser) });
  });

  it.each([
    [{ code: 'invalid_credentials' }, 'INVALID_CREDENTIALS'],
    [{ code: 'email_not_confirmed' }, 'EMAIL_NOT_CONFIRMED'],
    [{ name: 'AuthRetryableFetchError', status: 0 }, 'NETWORK'],
    [{ status: 429, code: 'over_request_rate_limit' }, 'RATE_LIMITED'],
    [{ status: 500, code: 'unexpected_failure' }, 'UNKNOWN'],
  ])('traduce el error %j a %s', async (fields, reason) => {
    const client = createClient();
    client.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: authError(fields),
    } as never);

    const result = await new SupabaseAuthRepository(client).login('ana@example.com', 'clave');

    expect(result).toEqual({ ok: false, reason });
  });
});

describe('SupabaseAuthRepository.registerGuardian', () => {
  const registration = { name: 'Ana', email: 'ana@example.com', password: 'clave-segura' };

  it('envía el nombre en los metadatos del usuario', async () => {
    const client = createClient();
    client.signUp.mockResolvedValue({
      data: { user: supabaseUser, session: null },
      error: null,
    } as never);

    await new SupabaseAuthRepository(client).registerGuardian(registration);

    expect(client.signUp).toHaveBeenCalledWith({
      email: 'ana@example.com',
      password: 'clave-segura',
      options: { data: { nombre: 'Ana' } },
    });
  });

  it('queda pendiente de confirmación si Supabase no entrega sesión', async () => {
    const client = createClient();
    client.signUp.mockResolvedValue({
      data: { user: supabaseUser, session: null },
      error: null,
    } as never);

    const result = await new SupabaseAuthRepository(client).registerGuardian(registration);

    expect(result).toEqual({ ok: true, status: 'CONFIRMATION_PENDING' });
  });

  it('inicia sesión si Supabase entrega sesión', async () => {
    const client = createClient();
    client.signUp.mockResolvedValue({
      data: { user: supabaseUser, session: {} },
      error: null,
    } as never);

    const result = await new SupabaseAuthRepository(client).registerGuardian(registration);

    expect(result).toEqual({ ok: true, status: 'SIGNED_IN', user: toDomainUser(supabaseUser) });
  });

  it('no revela que el correo ya existe (D2)', async () => {
    const client = createClient();
    client.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: authError({ status: 422, code: 'user_already_exists' }),
    } as never);

    const result = await new SupabaseAuthRepository(client).registerGuardian(registration);

    expect(result).toEqual({ ok: true, status: 'CONFIRMATION_PENDING' });
  });

  it.each([
    [{ status: 422, code: 'weak_password' }, 'WEAK_PASSWORD'],
    [{ name: 'AuthRetryableFetchError', status: 0 }, 'NETWORK'],
    [{ status: 429, code: 'over_email_send_rate_limit' }, 'RATE_LIMITED'],
    [{ status: 500, code: 'unexpected_failure' }, 'UNKNOWN'],
  ])('traduce el error %j a %s', async (fields, reason) => {
    const client = createClient();
    client.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: authError(fields),
    } as never);

    const result = await new SupabaseAuthRepository(client).registerGuardian(registration);

    expect(result).toEqual({ ok: false, reason });
  });
});

describe('SupabaseAuthRepository.signOut', () => {
  it('cierra la sesión en Supabase', async () => {
    const client = createClient();

    await new SupabaseAuthRepository(client).signOut();

    expect(client.signOut).toHaveBeenCalled();
  });
});

describe('SupabaseAuthRepository.getCurrentUser (E1-05)', () => {
  it('devuelve el usuario de la sesión guardada', async () => {
    const client = createClient();
    client.getSession.mockResolvedValue({
      data: { session: { user: supabaseUser } },
      error: null,
    } as never);

    const result = await new SupabaseAuthRepository(client).getCurrentUser();

    expect(result).toEqual(toDomainUser(supabaseUser));
  });

  it('devuelve null si no hay sesión', async () => {
    const client = createClient();
    client.getSession.mockResolvedValue({ data: { session: null }, error: null } as never);

    await expect(new SupabaseAuthRepository(client).getCurrentUser()).resolves.toBeNull();
  });

  it('devuelve null si la sesión no se pudo renovar', async () => {
    const client = createClient();
    client.getSession.mockResolvedValue({
      data: { session: null },
      error: authError({ code: 'refresh_token_not_found' }),
    } as never);

    await expect(new SupabaseAuthRepository(client).getCurrentUser()).resolves.toBeNull();
  });
});

describe('SupabaseAuthRepository.observeSession (E1-05)', () => {
  function captureCallback(client: jest.Mocked<SupabaseAuthClient>) {
    const unsubscribe = jest.fn();
    let callback: (event: string, session: unknown) => void = () => undefined;
    client.onAuthStateChange.mockImplementation(((cb: typeof callback) => {
      callback = cb;
      return { data: { subscription: { unsubscribe } } };
    }) as never);
    return { unsubscribe, emit: (event: string, session: unknown) => callback(event, session) };
  }

  it('avisa el usuario cuando la sesión empieza', () => {
    const client = createClient();
    const { emit } = captureCallback(client);
    const listener = jest.fn();

    new SupabaseAuthRepository(client).observeSession(listener);
    emit('SIGNED_IN', { user: supabaseUser });

    expect(listener).toHaveBeenCalledWith(toDomainUser(supabaseUser));
  });

  it('avisa null cuando la sesión termina', () => {
    const client = createClient();
    const { emit } = captureCallback(client);
    const listener = jest.fn();

    new SupabaseAuthRepository(client).observeSession(listener);
    emit('SIGNED_OUT', null);

    expect(listener).toHaveBeenCalledWith(null);
  });

  it('deja de escuchar al llamar la función devuelta', () => {
    const client = createClient();
    const { unsubscribe } = captureCallback(client);

    const stop = new SupabaseAuthRepository(client).observeSession(jest.fn());
    stop();

    expect(unsubscribe).toHaveBeenCalled();
  });
});

describe('SupabaseAuthRepository.loginWithPin (E1-04)', () => {
  function setup(invokeResult: unknown, setSessionResult?: unknown) {
    const client = createClient();
    (client as unknown as { setSession: jest.Mock }).setSession = jest
      .fn()
      .mockResolvedValue(setSessionResult ?? { data: { user: supabaseUser }, error: null });
    const functions = { invoke: jest.fn().mockResolvedValue(invokeResult) };
    return {
      client,
      functions,
      repository: new SupabaseAuthRepository(client, functions as never),
    };
  }

  it('pide la sesión a auth-pin y la guarda en el cliente', async () => {
    const { client, functions, repository } = setup({
      data: { access_token: 'at', refresh_token: 'rt' },
      error: null,
    });

    const result = await repository.loginWithPin('1023456789', '4826');

    expect(functions.invoke).toHaveBeenCalledWith('auth-pin', {
      body: { accion: 'ingresar', documento: '1023456789', pin: '4826' },
    });
    expect((client as unknown as { setSession: jest.Mock }).setSession).toHaveBeenCalledWith({
      access_token: 'at',
      refresh_token: 'rt',
    });
    expect(result).toEqual({ ok: true, user: toDomainUser(supabaseUser) });
  });

  it.each([
    ['INVALID_CREDENTIALS', 'INVALID_CREDENTIALS'],
    ['INVALID_INPUT', 'INVALID_CREDENTIALS'],
    ['LOCKED', 'LOCKED'],
    ['UNKNOWN', 'UNKNOWN'],
  ])('traduce la respuesta %s de auth-pin a %s', async (code, reason) => {
    const { repository } = setup({
      data: null,
      error: {
        name: 'FunctionsHttpError',
        context: { json: () => Promise.resolve({ error: code }) },
      },
    });

    await expect(repository.loginWithPin('1023456789', '4826')).resolves.toEqual({
      ok: false,
      reason,
    });
  });

  it('distingue la falta de conexión y las respuestas ilegibles', async () => {
    const offline = setup({ data: null, error: { name: 'FunctionsFetchError' } });
    await expect(offline.repository.loginWithPin('1023456789', '4826')).resolves.toEqual({
      ok: false,
      reason: 'NETWORK',
    });

    const unreadable = setup({
      data: null,
      error: { name: 'FunctionsHttpError', context: { json: () => Promise.reject(new Error()) } },
    });
    await expect(unreadable.repository.loginWithPin('1023456789', '4826')).resolves.toEqual({
      ok: false,
      reason: 'UNKNOWN',
    });
  });

  it('falla si no puede guardar la sesión o no hay cliente de funciones', async () => {
    const noSession = setup(
      { data: { access_token: 'at', refresh_token: 'rt' }, error: null },
      { data: { user: null }, error: { message: 'invalid' } },
    );
    await expect(noSession.repository.loginWithPin('1023456789', '4826')).resolves.toEqual({
      ok: false,
      reason: 'UNKNOWN',
    });

    const withoutFunctions = new SupabaseAuthRepository(createClient());
    await expect(withoutFunctions.loginWithPin('1023456789', '4826')).resolves.toEqual({
      ok: false,
      reason: 'UNKNOWN',
    });
  });
});

describe('SupabaseAuthRepository.changePassword (SEC-03)', () => {
  const staffUser = {
    ...supabaseUser,
    app_metadata: { rol: 'institucion', debe_cambiar_contrasena: true },
  } as unknown as SupabaseUser;
  const staffUserChanged = {
    ...supabaseUser,
    app_metadata: { rol: 'institucion' },
  } as unknown as SupabaseUser;

  function setup(updateError: AuthError | null, refreshed?: unknown) {
    const client = createClient() as unknown as Record<string, jest.Mock>;
    client.updateUser = jest
      .fn()
      .mockResolvedValue({ data: { user: staffUser }, error: updateError });
    client.refreshSession = jest
      .fn()
      .mockResolvedValue(refreshed ?? { data: { user: staffUserChanged }, error: null });
    return {
      client,
      repository: new SupabaseAuthRepository(client as unknown as SupabaseAuthClient),
    };
  }

  it('lee la marca de contraseña temporal de app_metadata', () => {
    expect(toDomainUser(staffUser).mustChangePassword).toBe(true);
    expect(toDomainUser(supabaseUser).mustChangePassword).toBe(false);
  });

  it('cambia la contraseña y renueva la sesión para quitar la marca', async () => {
    const { client, repository } = setup(null);

    const result = await repository.changePassword('clave-definitiva');

    expect(client.updateUser).toHaveBeenCalledWith({ password: 'clave-definitiva' });
    expect(client.refreshSession).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, user: toDomainUser(staffUserChanged) });
  });

  it.each([
    ['same_password', 422, undefined, 'SAME_PASSWORD'],
    ['weak_password', 422, undefined, 'WEAK_PASSWORD'],
    [undefined, 0, 'AuthRetryableFetchError', 'NETWORK'],
    [undefined, 429, undefined, 'RATE_LIMITED'],
    [undefined, 500, undefined, 'UNKNOWN'],
  ])('traduce el error %s (HTTP %s) de Supabase', async (code, status, name, reason) => {
    const { client, repository } = setup(authError({ code, status, name }));

    await expect(repository.changePassword('clave-definitiva')).resolves.toEqual({
      ok: false,
      reason,
    });
    expect(client.refreshSession).not.toHaveBeenCalled();
  });

  it('falla si no puede renovar la sesión', async () => {
    const { repository } = setup(null, { data: { user: null }, error: authError({}) });

    await expect(repository.changePassword('clave-definitiva')).resolves.toEqual({
      ok: false,
      reason: 'UNKNOWN',
    });
  });
});
