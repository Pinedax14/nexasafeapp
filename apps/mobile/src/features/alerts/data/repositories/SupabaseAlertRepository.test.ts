import { AlertClient, SupabaseAlertRepository } from './SupabaseAlertRepository';

type Result = { data: unknown; error: { code?: string; message?: string } | null };

const row = {
  id: 'al-1',
  estado: 'ENVIADA',
  creada_en: '2026-10-15T12:00:00Z',
  cancelable_hasta: '2026-10-15T12:00:10Z',
};

const alert = {
  id: 'al-1',
  status: 'ENVIADA',
  createdAt: '2026-10-15T12:00:00Z',
  cancellableUntil: '2026-10-15T12:00:10Z',
};

function setup(options: { query?: Result; rpc?: Result; invoke?: unknown } = {}) {
  const query = options.query ?? { data: [row], error: null };
  const builder: { select: jest.Mock; in: jest.Mock; limit: jest.Mock } = {
    select: jest.fn(() => builder),
    in: jest.fn(() => builder),
    limit: jest.fn(() => Promise.resolve(query)),
  };
  const client = {
    from: jest.fn(() => builder),
    rpc: jest.fn().mockResolvedValue(options.rpc ?? { data: [row], error: null }),
    functions: {
      invoke: jest.fn().mockResolvedValue(options.invoke ?? { data: { ok: true }, error: null }),
    },
  };
  return {
    client,
    builder,
    repository: new SupabaseAlertRepository(client as unknown as AlertClient),
  };
}

const httpError = (code: string) => ({
  data: null,
  error: { name: 'FunctionsHttpError', context: { json: () => Promise.resolve({ error: code }) } },
});

describe('SupabaseAlertRepository (E6-01, E6-03)', () => {
  it('dispara la alerta con disparar_alerta', async () => {
    const { client, repository } = setup();

    expect(await repository.trigger()).toEqual({ ok: true, value: alert });
    expect(client.rpc).toHaveBeenCalledWith('disparar_alerta');
  });

  it.each([
    [{ code: '42501' }, 'FORBIDDEN'],
    [{ code: 'P0001' }, 'NOT_ACTIVE'],
    [{ code: 'NX429' }, 'RATE_LIMITED'],
    [{ message: 'Network request failed' }, 'NETWORK'],
    [{ code: 'XX000' }, 'UNKNOWN'],
  ])('traduce el error %p al disparar a %s', async (error, reason) => {
    const { repository } = setup({ rpc: { data: null, error } });

    expect(await repository.trigger()).toEqual({ ok: false, reason });
  });

  it('una respuesta vacía al disparar es un error', async () => {
    const { repository } = setup({ rpc: { data: [], error: null } });

    expect(await repository.trigger()).toEqual({ ok: false, reason: 'UNKNOWN' });
  });

  it('cancela con la acción cancelar_alerta de auth-pin (D23)', async () => {
    const { client, repository } = setup();

    expect(await repository.cancel('al-1', '1234')).toEqual({ ok: true, value: undefined });
    expect(client.functions.invoke).toHaveBeenCalledWith('auth-pin', {
      body: { accion: 'cancelar_alerta', alerta_id: 'al-1', pin: '1234' },
    });
  });

  it.each([
    ['INVALID_PIN', 'INVALID_PIN'],
    ['INVALID_INPUT', 'INVALID_PIN'],
    ['LOCKED', 'LOCKED'],
    ['NOT_CANCELLABLE', 'NOT_CANCELLABLE'],
    ['NOT_FOUND', 'FORBIDDEN'],
    ['FORBIDDEN', 'FORBIDDEN'],
    ['UNAUTHORIZED', 'FORBIDDEN'],
    ['OTRO', 'UNKNOWN'],
  ])('traduce la respuesta %s de auth-pin a %s', async (code, reason) => {
    const { repository } = setup({ invoke: httpError(code) });

    expect(await repository.cancel('al-1', '1234')).toEqual({ ok: false, reason });
  });

  it('sin conexión al cancelar informa NETWORK', async () => {
    const { repository } = setup({
      invoke: { data: null, error: { name: 'FunctionsFetchError' } },
    });

    expect(await repository.cancel('al-1', '1234')).toEqual({ ok: false, reason: 'NETWORK' });
  });

  it('una respuesta ilegible de auth-pin es UNKNOWN', async () => {
    const { repository } = setup({
      invoke: {
        data: null,
        error: { name: 'FunctionsHttpError', context: { json: () => Promise.reject(new Error()) } },
      },
    });

    expect(await repository.cancel('al-1', '1234')).toEqual({ ok: false, reason: 'UNKNOWN' });
  });

  it('lee la alerta activa del propio menor (RLS filtra las ajenas)', async () => {
    const { client, builder, repository } = setup();

    expect(await repository.active()).toEqual({ ok: true, value: alert });
    expect(client.from).toHaveBeenCalledWith('alertas');
    expect(builder.in).toHaveBeenCalledWith('estado', ['ENVIADA', 'ATENDIDA']);
  });

  it('sin alerta activa devuelve null', async () => {
    const { repository } = setup({ query: { data: [], error: null } });

    expect(await repository.active()).toEqual({ ok: true, value: null });
  });

  it('informa el error al leer la alerta activa', async () => {
    const { repository } = setup({ query: { data: null, error: { message: 'Failed to fetch' } } });

    expect(await repository.active()).toEqual({ ok: false, reason: 'NETWORK' });
  });
});
