import {
  liveChannel,
  PositionClient,
  SupabasePositionRepository,
} from './SupabasePositionRepository';

type Result = { data: unknown; error: { code?: string; message?: string } | null };
type Listener = (message: { payload?: unknown }) => void;

const position = {
  latitude: 4.6,
  longitude: -74.08,
  accuracyMeters: 8,
  capturedAt: '2026-10-15T12:00:00Z',
};

function setup(rpc: Result = { data: [], error: null }) {
  const listeners: Record<string, Listener> = {};
  type FakeChannel = { on: jest.Mock; subscribe: jest.Mock };
  const channel: FakeChannel = {
    on: jest.fn((_type: string, filter: { event: string }, listener: Listener) => {
      listeners[filter.event] = listener;
      return channel;
    }),
    subscribe: jest.fn(),
  };
  const client = {
    rpc: jest.fn().mockResolvedValue(rpc),
    channel: jest.fn(() => channel),
    removeChannel: jest.fn(),
    realtime: { setAuth: jest.fn().mockResolvedValue(undefined) },
  };
  return {
    client,
    channel,
    listeners,
    repository: new SupabasePositionRepository(client as unknown as PositionClient),
  };
}

describe('SupabasePositionRepository (E4-02, D19, D20)', () => {
  it('envía la posición con registrar_posicion y lee lo que sigue activo', async () => {
    const { client, repository } = setup({
      data: [
        { aceptada: true, trayecto_activo: false, alerta_activa: true, trayecto_cerrado: true },
      ],
      error: null,
    });

    expect(await repository.send(position)).toEqual({
      ok: true,
      value: { accepted: true, tripActive: false, alertActive: true, tripClosed: true },
    });
    expect(client.rpc).toHaveBeenCalledWith('registrar_posicion', {
      p_lat: 4.6,
      p_lng: -74.08,
      p_precision_m: 8,
      p_capturada_en: '2026-10-15T12:00:00Z',
    });
  });

  it.each([
    [{ code: 'NX409' }, 'NOT_ACTIVE'],
    [{ code: '42501' }, 'FORBIDDEN'],
    [{ message: 'Failed to fetch' }, 'NETWORK'],
    [{ code: '22023' }, 'UNKNOWN'],
  ])('traduce el error %p al enviar a %s', async (error, reason) => {
    const { repository } = setup({ data: null, error });

    expect(await repository.send(position)).toEqual({ ok: false, reason });
  });

  it('una respuesta vacía al enviar es un error', async () => {
    const { repository } = setup({ data: [], error: null });

    expect(await repository.send(position)).toEqual({ ok: false, reason: 'UNKNOWN' });
  });

  it('lee la última posición con obtener_ultima_posicion (auditada)', async () => {
    const { client, repository } = setup({
      data: [
        {
          lat: 4.6,
          lng: -74.08,
          precision_m: 8,
          recibida_en: '2026-10-15T12:00:01Z',
          trayecto_id: 't-1',
          alerta_id: null,
        },
      ],
      error: null,
    });

    expect(await repository.latest('p-1')).toEqual({
      ok: true,
      value: {
        latitude: 4.6,
        longitude: -74.08,
        accuracyMeters: 8,
        receivedAt: '2026-10-15T12:00:01Z',
      },
    });
    expect(client.rpc).toHaveBeenCalledWith('obtener_ultima_posicion', { p_protegido_id: 'p-1' });
  });

  it('sin posición activa devuelve null', async () => {
    const { repository } = setup({ data: [], error: null });

    expect(await repository.latest('p-1')).toEqual({ ok: true, value: null });
  });

  it('informa el error al leer la última posición', async () => {
    const { repository } = setup({ data: null, error: { code: '42501' } });

    expect(await repository.latest('p-1')).toEqual({ ok: false, reason: 'FORBIDDEN' });
  });

  it('escucha el canal privado del menor después de enviar el token', async () => {
    const { client, channel, repository } = setup();

    repository.subscribe('p-1', { onPosition: jest.fn(), onTripClosed: jest.fn() });
    await Promise.resolve();

    expect(client.channel).toHaveBeenCalledWith(liveChannel('p-1'), {
      config: { private: true },
    });
    expect(liveChannel('p-1')).toBe('protegido:p-1');
    expect(client.realtime.setAuth).toHaveBeenCalled();
    expect(channel.subscribe).toHaveBeenCalled();
  });

  it('entrega las posiciones válidas y el cierre del trayecto', () => {
    const { listeners, repository } = setup();
    const onPosition = jest.fn();
    const onTripClosed = jest.fn();
    repository.subscribe('p-1', { onPosition, onTripClosed });

    listeners.posicion({
      payload: { lat: 4.6, lng: -74.08, precision_m: 8, recibida_en: '2026-10-15T12:00:01Z' },
    });
    listeners.posicion({ payload: { lat: 'x' } });
    listeners.posicion({});
    listeners.trayecto({ payload: { estado: 'EN_CURSO' } });
    listeners.trayecto({ payload: { estado: 'CERRADO' } });

    expect(onPosition).toHaveBeenCalledTimes(1);
    expect(onPosition).toHaveBeenCalledWith({
      latitude: 4.6,
      longitude: -74.08,
      accuracyMeters: 8,
      receivedAt: '2026-10-15T12:00:01Z',
    });
    expect(onTripClosed).toHaveBeenCalledTimes(1);
  });

  it('una posición sin hora usa una hora vacía', () => {
    const { listeners, repository } = setup();
    const onPosition = jest.fn();
    repository.subscribe('p-1', { onPosition, onTripClosed: jest.fn() });

    listeners.posicion({ payload: { lat: 4.6, lng: -74.08, precision_m: 8 } });

    expect(onPosition).toHaveBeenCalledWith(expect.objectContaining({ receivedAt: '' }));
  });

  it('al dejar de escuchar quita el canal', () => {
    const { client, channel, repository } = setup();

    repository.subscribe('p-1', { onPosition: jest.fn(), onTripClosed: jest.fn() })();

    expect(client.removeChannel).toHaveBeenCalledWith(channel);
  });
});
