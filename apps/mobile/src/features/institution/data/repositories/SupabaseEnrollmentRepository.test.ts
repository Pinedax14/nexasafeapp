import {
  EnrollmentClient,
  PHOTO_BUCKET,
  PHOTO_URL_TTL_SECONDS,
  SupabaseEnrollmentRepository,
} from './SupabaseEnrollmentRepository';

type Result = { data: unknown; error: { code?: string; message?: string } | null };

function queryBuilder(result: Result) {
  const builder: Record<string, jest.Mock> & { then?: unknown } = {};
  for (const method of ['select', 'eq', 'order']) builder[method] = jest.fn(() => builder);
  builder.then = (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

function setup(options: { query?: Result; rpc?: Result; signedUrl?: string | null } = {}) {
  const builder = queryBuilder(options.query ?? { data: [], error: null });
  const createSignedUrl = jest.fn().mockResolvedValue({
    data: options.signedUrl ? { signedUrl: options.signedUrl } : null,
    error: options.signedUrl ? null : { message: 'not found' },
  });
  const client = {
    from: jest.fn(() => builder),
    rpc: jest.fn().mockResolvedValue(options.rpc ?? { data: null, error: null }),
    storage: { from: jest.fn(() => ({ createSignedUrl })) },
  };
  return {
    client,
    builder,
    createSignedUrl,
    repository: new SupabaseEnrollmentRepository(client as unknown as EnrollmentClient),
  };
}

const row = {
  id: 'p-1',
  nombre: 'Menor Uno',
  documento: '1023456789',
  colegio_id: 's-1',
  estado: 'PENDIENTE_VALIDACION',
  foto_path: 'g-1/foto.jpg',
};

describe('SupabaseEnrollmentRepository', () => {
  it('lista solo los menores pendientes de validación', async () => {
    const { builder, repository } = setup({
      query: {
        data: [{ id: 'p-1', nombre: 'Menor Uno', creado_en: '2026-10-05T10:00:00Z' }],
        error: null,
      },
    });

    const result = await repository.listPending();

    expect(builder.eq).toHaveBeenCalledWith('estado', 'PENDIENTE_VALIDACION');
    expect(result).toEqual({
      ok: true,
      value: [{ id: 'p-1', name: 'Menor Uno', registeredAt: '2026-10-05T10:00:00Z' }],
    });
  });

  it.each([
    [{ code: '42501' }, 'FORBIDDEN'],
    [{ message: 'TypeError: Failed to fetch' }, 'NETWORK'],
    [{ code: 'XX000' }, 'UNKNOWN'],
  ])('traduce el error %j al listar a %s', async (error, reason) => {
    const { repository } = setup({ query: { data: null, error } });

    await expect(repository.listPending()).resolves.toEqual({ ok: false, reason });
  });

  it('lee el detalle con obtener_protegido y firma la foto por poco tiempo', async () => {
    const { client, createSignedUrl, repository } = setup({
      rpc: { data: [row], error: null },
      signedUrl: 'https://firmada/foto.jpg',
    });

    const result = await repository.getDetail('p-1');

    expect(client.rpc).toHaveBeenCalledWith('obtener_protegido', { p_protegido_id: 'p-1' });
    expect(client.storage.from).toHaveBeenCalledWith(PHOTO_BUCKET);
    expect(createSignedUrl).toHaveBeenCalledWith('g-1/foto.jpg', PHOTO_URL_TTL_SECONDS);
    expect(result).toEqual({
      ok: true,
      value: {
        id: 'p-1',
        name: 'Menor Uno',
        document: '1023456789',
        photoUrl: 'https://firmada/foto.jpg',
        status: 'PENDIENTE_VALIDACION',
      },
    });
  });

  it('muestra el detalle sin foto si no se puede firmar o no existe', async () => {
    const withoutUrl = setup({ rpc: { data: [row], error: null }, signedUrl: null });
    await expect(withoutUrl.repository.getDetail('p-1')).resolves.toEqual(
      expect.objectContaining({ ok: true, value: expect.objectContaining({ photoUrl: null }) }),
    );

    const withoutPath = setup({ rpc: { data: [{ ...row, foto_path: null }], error: null } });
    const result = await withoutPath.repository.getDetail('p-1');
    expect(withoutPath.createSignedUrl).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({ ok: true, value: expect.objectContaining({ photoUrl: null }) }),
    );
  });

  it('no muestra el detalle de un menor ajeno', async () => {
    const { repository } = setup({ rpc: { data: null, error: { code: '42501' } } });

    await expect(repository.getDetail('p-1')).resolves.toEqual({ ok: false, reason: 'FORBIDDEN' });
  });

  it('valida la matrícula con validar_protegido', async () => {
    const { client, repository } = setup({ rpc: { data: null, error: null } });

    const result = await repository.validate('p-1');

    expect(client.rpc).toHaveBeenCalledWith('validar_protegido', { p_protegido_id: 'p-1' });
    expect(result).toEqual({ ok: true, value: undefined });
  });

  it.each([
    [{ code: 'P0001' }, 'ALREADY_VALIDATED'],
    [{ code: '42501' }, 'FORBIDDEN'],
  ])('traduce el error %j al validar a %s', async (error, reason) => {
    const { repository } = setup({ rpc: { data: null, error } });

    await expect(repository.validate('p-1')).resolves.toEqual({ ok: false, reason });
  });
});
