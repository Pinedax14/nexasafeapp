import { SupabaseTripRepository, TripClient } from './SupabaseTripRepository';

type Result = { data: unknown; error: { code?: string; message?: string } | null };

function setup(options: { query?: Result; rpc?: Result } = {}) {
  const query = options.query ?? { data: [], error: null };
  const builder: { select: jest.Mock; eq: jest.Mock } = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => Promise.resolve(query)),
  };
  const client = {
    from: jest.fn(() => builder),
    rpc: jest.fn().mockResolvedValue(options.rpc ?? { data: 't-1', error: null }),
  };
  return {
    client,
    builder,
    repository: new SupabaseTripRepository(client as unknown as TripClient),
  };
}

const row = {
  id: 't-1',
  protegido_id: 'p-1',
  ruta_id: 'r-1',
  inicio_en: '2026-10-12T11:42:00Z',
  estado: 'EN_CURSO',
};

describe('SupabaseTripRepository (E4-01)', () => {
  it('lee los trayectos EN_CURSO (RLS filtra los ajenos)', async () => {
    const { client, builder, repository } = setup({ query: { data: [row], error: null } });

    const result = await repository.listActive();

    expect(client.from).toHaveBeenCalledWith('trayectos');
    expect(builder.eq).toHaveBeenCalledWith('estado', 'EN_CURSO');
    expect(result).toEqual({
      ok: true,
      value: [
        {
          id: 't-1',
          protegidoId: 'p-1',
          routeId: 'r-1',
          startedAt: '2026-10-12T11:42:00Z',
          status: 'EN_CURSO',
        },
      ],
    });
  });

  it('inicia el trayecto con iniciar_trayecto', async () => {
    const { client, repository } = setup();

    expect(await repository.start('r-1')).toEqual({ ok: true, value: 't-1' });
    expect(client.rpc).toHaveBeenCalledWith('iniciar_trayecto', { p_ruta_id: 'r-1' });
  });

  it.each([
    [{ code: '42501' }, 'FORBIDDEN'],
    [{ code: 'P0001', message: 'Ya hay un trayecto en curso' }, 'ALREADY_ACTIVE'],
    [{ code: 'P0001', message: 'El menor no está activo' }, 'NOT_ACTIVE'],
    [{ message: 'Network request failed' }, 'NETWORK'],
    [{ code: 'XX000' }, 'UNKNOWN'],
  ])('traduce el error %p a %s', async (error, reason) => {
    const { repository } = setup({ rpc: { data: null, error } });

    expect(await repository.start('r-1')).toEqual({ ok: false, reason });
  });

  it('informa el error al leer los trayectos', async () => {
    const { repository } = setup({ query: { data: null, error: { message: 'Failed to fetch' } } });

    expect(await repository.listActive()).toEqual({ ok: false, reason: 'NETWORK' });
  });
});
