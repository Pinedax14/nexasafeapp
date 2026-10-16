import {
  AlertResponseClient,
  SupabaseAlertResponseRepository,
} from './SupabaseAlertResponseRepository';

type Result = { data: unknown; error: { code?: string; message?: string } | null };

function setup(result: Result = { data: [], error: null }) {
  const client = { rpc: jest.fn().mockResolvedValue(result) };
  return {
    client,
    repository: new SupabaseAlertResponseRepository(client as unknown as AlertResponseClient),
  };
}

describe('SupabaseAlertResponseRepository (E7-02, E9-01, E9-02, E8-01)', () => {
  it('lista las alertas con listar_alertas', async () => {
    const { client, repository } = setup({
      data: [
        {
          id: 'al-1',
          protegido_id: 'p-1',
          menor: 'Menor',
          estado: 'ATENDIDA',
          creada_en: '2026-10-15T12:00:00Z',
          cancelable_hasta: '2026-10-15T12:00:10Z',
          clasificacion: null,
          cerrada_en: null,
        },
      ],
      error: null,
    });

    expect(await repository.list(true)).toEqual({
      ok: true,
      value: [
        {
          id: 'al-1',
          protegidoId: 'p-1',
          childName: 'Menor',
          status: 'ATENDIDA',
          createdAt: '2026-10-15T12:00:00Z',
          classification: null,
          closedAt: null,
        },
      ],
    });
    expect(client.rpc).toHaveBeenCalledWith('listar_alertas', { p_solo_activas: true });
  });

  it('lee la bitácora con obtener_bitacora', async () => {
    const { client, repository } = setup({
      data: [
        {
          tipo_evento: 'DISPARADA',
          actor: 'Menor',
          detalle: null,
          creado_en: '2026-10-15T12:00:00Z',
        },
        {
          tipo_evento: 'CERRADA',
          actor: 'Ana',
          detalle: 'FALSA_ALARMA',
          creado_en: '2026-10-15T12:05:00Z',
        },
      ],
      error: null,
    });

    expect(await repository.log('al-1')).toEqual({
      ok: true,
      value: [
        { type: 'DISPARADA', actor: 'Menor', detail: null, at: '2026-10-15T12:00:00Z' },
        { type: 'CERRADA', actor: 'Ana', detail: 'FALSA_ALARMA', at: '2026-10-15T12:05:00Z' },
      ],
    });
    expect(client.rpc).toHaveBeenCalledWith('obtener_bitacora', { p_alerta_id: 'al-1' });
  });

  it('responde y cierra con sus funciones', async () => {
    const { client, repository } = setup({ data: null, error: null });

    expect(await repository.respond('al-1')).toEqual({ ok: true, value: undefined });
    expect(await repository.close('al-1', 'SITUACION_RESUELTA', 'Llegó')).toEqual({
      ok: true,
      value: undefined,
    });
    expect(client.rpc).toHaveBeenCalledWith('responder_alerta', { p_alerta_id: 'al-1' });
    expect(client.rpc).toHaveBeenCalledWith('cerrar_alerta', {
      p_alerta_id: 'al-1',
      p_clasificacion: 'SITUACION_RESUELTA',
      p_nota: 'Llegó',
    });
  });

  it('lee el resumen del colegio y descarta clasificaciones desconocidas', async () => {
    const { client, repository } = setup({
      data: [
        { dia: '2026-10-15', clasificacion: 'SIN_CERRAR', total: 2 },
        { dia: '2026-10-15', clasificacion: 'OTRA', total: 1 },
      ],
      error: null,
    });

    expect(await repository.summary(14)).toEqual({
      ok: true,
      value: [{ day: '2026-10-15', classification: 'SIN_CERRAR', total: 2 }],
    });
    expect(client.rpc).toHaveBeenCalledWith('resumen_alertas_colegio', { p_dias: 14 });
  });

  it.each([
    [{ code: '42501' }, 'FORBIDDEN'],
    [{ code: 'P0001' }, 'NOT_ACTIVE_ALERT'],
    [{ code: '22023' }, 'INVALID_DATA'],
    [{ message: 'Failed to fetch' }, 'NETWORK'],
    [{ code: 'XX000' }, 'UNKNOWN'],
  ])('traduce el error %p a %s', async (error, reason) => {
    const { repository } = setup({ data: null, error });

    expect(await repository.list(false)).toEqual({ ok: false, reason });
    expect(await repository.log('al-1')).toEqual({ ok: false, reason });
    expect(await repository.respond('al-1')).toEqual({ ok: false, reason });
    expect(await repository.close('al-1', 'FALSA_ALARMA', '')).toEqual({ ok: false, reason });
    expect(await repository.summary(14)).toEqual({ ok: false, reason });
  });
});
