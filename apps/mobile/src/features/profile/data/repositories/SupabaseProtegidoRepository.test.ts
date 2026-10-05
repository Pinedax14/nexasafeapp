import {
  PHOTO_BUCKET,
  ProtegidoClient,
  SupabaseProtegidoRepository,
} from './SupabaseProtegidoRepository';

type Result = { data: unknown; error: { code?: string; message?: string } | null };

function queryBuilder(result: Result) {
  const builder: Record<string, jest.Mock> & { then?: unknown } = {};
  for (const method of ['select', 'order']) builder[method] = jest.fn(() => builder);
  builder.then = (resolve: (value: Result) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

function setup(options: { query?: Result; rpc?: Result; upload?: { error: unknown } } = {}) {
  const builder = queryBuilder(options.query ?? { data: [], error: null });
  const upload = jest.fn().mockResolvedValue(options.upload ?? { error: null });
  const client = {
    from: jest.fn(() => builder),
    rpc: jest.fn().mockResolvedValue(options.rpc ?? { data: null, error: null }),
    storage: { from: jest.fn(() => ({ upload })) },
  };
  const readFile = jest.fn().mockResolvedValue(new ArrayBuffer(8));
  const repository = new SupabaseProtegidoRepository(
    client as unknown as ProtegidoClient,
    readFile,
    () => 'abc123',
  );
  return { client, builder, upload, readFile, repository };
}

const registration = {
  name: 'Menor',
  document: '1023456789',
  schoolId: 's-1',
  photoPath: 'g-1/foto.jpg',
  policyVersion: '1.0',
};

describe('SupabaseProtegidoRepository', () => {
  it('lista los menores del guardián (RLS filtra los ajenos)', async () => {
    const { client, repository } = setup({
      query: {
        data: [
          {
            id: 'p-1',
            nombre: 'Menor',
            colegio_id: 's-1',
            estado: 'PENDIENTE_VALIDACION',
            foto_path: 'g-1/foto.jpg',
          },
        ],
        error: null,
      },
    });

    const result = await repository.listMine();

    expect(client.from).toHaveBeenCalledWith('protegidos');
    expect(result).toEqual({
      ok: true,
      value: [
        {
          id: 'p-1',
          name: 'Menor',
          schoolId: 's-1',
          status: 'PENDIENTE_VALIDACION',
          photoPath: 'g-1/foto.jpg',
        },
      ],
    });
  });

  it('lista los colegios', async () => {
    const { repository } = setup({
      query: { data: [{ id: 's-1', nombre: 'Colegio' }], error: null },
    });

    await expect(repository.listSchools()).resolves.toEqual({
      ok: true,
      value: [{ id: 's-1', name: 'Colegio' }],
    });
  });

  it.each([
    [{ code: '42501' }, 'FORBIDDEN'],
    [{ message: 'TypeError: Network request failed' }, 'NETWORK'],
    [{ code: 'XX000' }, 'UNKNOWN'],
  ])('traduce el error %j de una consulta a %s', async (error, reason) => {
    const { repository } = setup({ query: { data: null, error } });

    await expect(repository.listMine()).resolves.toEqual({ ok: false, reason });
    await expect(repository.listSchools()).resolves.toEqual({ ok: false, reason });
  });

  it('obtiene la versión vigente de la política', async () => {
    const { client, repository } = setup({ rpc: { data: '1.0', error: null } });

    await expect(repository.currentPolicyVersion()).resolves.toEqual({ ok: true, value: '1.0' });
    expect(client.rpc).toHaveBeenCalledWith('version_politica_vigente');
  });

  it('informa si no obtiene la versión de la política', async () => {
    const { repository } = setup({ rpc: { data: null, error: { code: 'XX000' } } });

    await expect(repository.currentPolicyVersion()).resolves.toEqual({
      ok: false,
      reason: 'UNKNOWN',
    });
  });

  it('sube la foto a la carpeta del guardián en el bucket privado', async () => {
    const { client, upload, readFile, repository } = setup();
    jest.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const result = await repository.uploadPhoto('g-1', {
      uri: 'file:///foto.png',
      mimeType: 'image/png',
      sizeBytes: 100,
    });

    expect(readFile).toHaveBeenCalledWith('file:///foto.png');
    expect(client.storage.from).toHaveBeenCalledWith(PHOTO_BUCKET);
    expect(upload).toHaveBeenCalledWith('g-1/1700000000000-abc123.png', expect.any(ArrayBuffer), {
      contentType: 'image/png',
      upsert: false,
    });
    expect(result).toEqual({ ok: true, value: 'g-1/1700000000000-abc123.png' });
  });

  it('informa si la subida falla o no se puede leer el archivo', async () => {
    const failed = setup({ upload: { error: { message: 'denied' } } });
    await expect(
      failed.repository.uploadPhoto('g-1', { uri: 'x', mimeType: 'image/jpeg', sizeBytes: 1 }),
    ).resolves.toEqual({ ok: false, reason: 'PHOTO_UPLOAD_FAILED' });

    const unreadable = setup();
    unreadable.readFile.mockRejectedValue(new Error('sin archivo'));
    await expect(
      unreadable.repository.uploadPhoto('g-1', { uri: 'x', mimeType: 'image/jpeg', sizeBytes: 1 }),
    ).resolves.toEqual({ ok: false, reason: 'PHOTO_UPLOAD_FAILED' });
  });

  it('registra al menor con la función registrar_protegido', async () => {
    const { client, repository } = setup({ rpc: { data: 'p-1', error: null } });

    const result = await repository.register(registration);

    expect(client.rpc).toHaveBeenCalledWith('registrar_protegido', {
      p_nombre: 'Menor',
      p_documento: '1023456789',
      p_colegio_id: 's-1',
      p_foto_path: 'g-1/foto.jpg',
      p_version_politica: '1.0',
    });
    expect(result).toEqual({ ok: true, value: 'p-1' });
  });

  it.each([
    [{ code: 'P0001' }, 'POLICY_OUTDATED'],
    [{ code: '22023' }, 'INVALID_DATA'],
    [{ code: '42501' }, 'FORBIDDEN'],
  ])('traduce el error %j del registro a %s', async (error, reason) => {
    const { repository } = setup({ rpc: { data: null, error } });

    await expect(repository.register(registration)).resolves.toEqual({ ok: false, reason });
  });
});
