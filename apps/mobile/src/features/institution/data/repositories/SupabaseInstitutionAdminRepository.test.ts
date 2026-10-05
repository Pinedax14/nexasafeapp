import {
  InstitutionAdminClient,
  SupabaseInstitutionAdminRepository,
} from './SupabaseInstitutionAdminRepository';

type QueryResult = { data: unknown; error: { code?: string; message?: string } | null };

/** Simula el query builder de supabase-js: cada método encadena y el await entrega el resultado. */
function queryBuilder(result: QueryResult) {
  const builder: Record<string, jest.Mock> & { then?: unknown } = {};
  for (const method of ['select', 'insert', 'update', 'eq', 'order', 'single']) {
    builder[method] = jest.fn(() => builder);
  }
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

function createClient(result: QueryResult, invokeResult?: unknown) {
  const builder = queryBuilder(result);
  const client = {
    from: jest.fn(() => builder),
    functions: { invoke: jest.fn().mockResolvedValue(invokeResult) },
  };
  return {
    client,
    builder,
    repository: new SupabaseInstitutionAdminRepository(client as unknown as InstitutionAdminClient),
  };
}

describe('SupabaseInstitutionAdminRepository: colegios', () => {
  it('lista los colegios ordenados por nombre', async () => {
    const { client, builder, repository } = createClient({
      data: [{ id: 's-1', nombre: 'Colegio X', nit: '900123456' }],
      error: null,
    });

    const result = await repository.listSchools();

    expect(client.from).toHaveBeenCalledWith('colegios');
    expect(builder.order).toHaveBeenCalledWith('nombre');
    expect(result).toEqual({
      ok: true,
      value: [{ id: 's-1', name: 'Colegio X', nit: '900123456' }],
    });
  });

  it('crea un colegio', async () => {
    const { builder, repository } = createClient({
      data: { id: 's-2', nombre: 'Colegio Y', nit: '900000002' },
      error: null,
    });

    const result = await repository.createSchool('Colegio Y', '900000002');

    expect(builder.insert).toHaveBeenCalledWith({ nombre: 'Colegio Y', nit: '900000002' });
    expect(result).toEqual({ ok: true, value: { id: 's-2', name: 'Colegio Y', nit: '900000002' } });
  });

  it.each([
    [{ code: '23505' }, 'DUPLICATE_NIT'],
    [{ code: '42501' }, 'FORBIDDEN'],
    [{ message: 'TypeError: Failed to fetch' }, 'NETWORK'],
    [{ code: 'XX000' }, 'UNKNOWN'],
  ])('traduce el error %j a %s', async (error, reason) => {
    const { repository } = createClient({ data: null, error });

    await expect(repository.createSchool('Colegio', '900000001')).resolves.toEqual({
      ok: false,
      reason,
    });
  });
});

describe('SupabaseInstitutionAdminRepository: personal', () => {
  it('lista el personal del colegio', async () => {
    const { builder, repository } = createClient({
      data: [{ id: 'p-1', colegio_id: 's-1', nombre: 'Docente', cargo: null, activo: true }],
      error: null,
    });

    const result = await repository.listStaff('s-1');

    expect(builder.eq).toHaveBeenCalledWith('colegio_id', 's-1');
    expect(result).toEqual({
      ok: true,
      value: [{ id: 'p-1', schoolId: 's-1', name: 'Docente', position: null, active: true }],
    });
  });

  it('informa si no puede listar el personal', async () => {
    const { repository } = createClient({ data: null, error: { code: '42501' } });

    await expect(repository.listStaff('s-1')).resolves.toEqual({ ok: false, reason: 'FORBIDDEN' });
  });

  it('registra personal con la Edge Function admin-personal', async () => {
    const { client, repository } = createClient(
      { data: null, error: null },
      { data: { id: 'p-9' }, error: null },
    );

    const result = await repository.registerStaff({
      schoolId: 's-1',
      name: 'Docente',
      position: 'Coordinación',
      email: 'docente@example.com',
      temporaryPassword: 'temporal-123',
    });

    expect(client.functions.invoke).toHaveBeenCalledWith('admin-personal', {
      body: {
        colegio_id: 's-1',
        nombre: 'Docente',
        cargo: 'Coordinación',
        email: 'docente@example.com',
        password: 'temporal-123',
      },
    });
    expect(result).toEqual({ ok: true, value: 'p-9' });
  });

  it.each([
    ['EMAIL_EXISTS', 'EMAIL_EXISTS'],
    ['FORBIDDEN', 'FORBIDDEN'],
    ['UNAUTHORIZED', 'FORBIDDEN'],
    ['RATE_LIMITED', 'RATE_LIMITED'],
    ['ALGO_NUEVO', 'UNKNOWN'],
  ])('traduce la respuesta %s de la función a %s', async (code, reason) => {
    const error = {
      name: 'FunctionsHttpError',
      context: { json: () => Promise.resolve({ error: code }) },
    };
    const { repository } = createClient({ data: null, error: null }, { data: null, error });

    const result = await repository.registerStaff({
      schoolId: 's-1',
      name: 'Docente',
      position: null,
      email: 'docente@example.com',
      temporaryPassword: 'temporal-123',
    });

    expect(result).toEqual({ ok: false, reason });
  });

  it('distingue la falta de conexión al llamar la función', async () => {
    const { repository } = createClient(
      { data: null, error: null },
      { data: null, error: { name: 'FunctionsFetchError' } },
    );

    const result = await repository.registerStaff({
      schoolId: 's-1',
      name: 'Docente',
      position: null,
      email: 'docente@example.com',
      temporaryPassword: 'temporal-123',
    });

    expect(result).toEqual({ ok: false, reason: 'NETWORK' });
  });

  it('responde UNKNOWN si la respuesta de error no se puede leer', async () => {
    const error = {
      name: 'FunctionsHttpError',
      context: { json: () => Promise.reject(new Error()) },
    };
    const { repository } = createClient({ data: null, error: null }, { data: null, error });

    const result = await repository.registerStaff({
      schoolId: 's-1',
      name: 'Docente',
      position: null,
      email: 'docente@example.com',
      temporaryPassword: 'temporal-123',
    });

    expect(result).toEqual({ ok: false, reason: 'UNKNOWN' });
  });

  it('activa o desactiva al personal', async () => {
    const { builder, repository } = createClient({ data: null, error: null });

    const result = await repository.setStaffActive('p-1', false);

    expect(builder.update).toHaveBeenCalledWith({ activo: false });
    expect(builder.eq).toHaveBeenCalledWith('id', 'p-1');
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it('informa si no puede cambiar el estado', async () => {
    const { repository } = createClient({ data: null, error: { code: '42501' } });

    await expect(repository.setStaffActive('p-1', true)).resolves.toEqual({
      ok: false,
      reason: 'FORBIDDEN',
    });
  });
});
