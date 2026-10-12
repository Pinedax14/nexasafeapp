import { RouteClient, SupabaseRouteRepository, toLineString } from './SupabaseRouteRepository';

type Result = { data: unknown; error: { code?: string; message?: string } | null };

function setup(result: Result) {
  const client = { rpc: jest.fn().mockResolvedValue(result) };
  return { client, repository: new SupabaseRouteRepository(client as unknown as RouteClient) };
}

const row = {
  id: 'r-1',
  sentido: 'CASA_COLEGIO',
  geojson: {
    type: 'LineString',
    coordinates: [
      [-74.08, 4.6],
      [-74.07, 4.61],
    ],
  },
  corredor_m: 50,
  duracion_esperada_min: 25,
  actualizado_en: '2026-10-09T15:00:00Z',
};

const draft = {
  direction: 'COLEGIO_CASA' as const,
  points: [
    { latitude: 4.6, longitude: -74.08 },
    { latitude: 4.61, longitude: -74.07 },
  ],
  corridorMeters: 75,
  expectedMinutes: 30,
};

describe('SupabaseRouteRepository', () => {
  it('lee las rutas con obtener_rutas (auditada) y convierte el GeoJSON', async () => {
    const { client, repository } = setup({ data: [row], error: null });

    const result = await repository.list('p-1');

    expect(client.rpc).toHaveBeenCalledWith('obtener_rutas', { p_protegido_id: 'p-1' });
    expect(result).toEqual({
      ok: true,
      value: [
        {
          id: 'r-1',
          direction: 'CASA_COLEGIO',
          points: [
            { latitude: 4.6, longitude: -74.08 },
            { latitude: 4.61, longitude: -74.07 },
          ],
          corridorMeters: 50,
          expectedMinutes: 25,
          updatedAt: '2026-10-09T15:00:00Z',
        },
      ],
    });
  });

  it.each([null, { type: 'LineString' }, { coordinates: [['x', 4.6]] }, { coordinates: [3] }])(
    'rechaza un GeoJSON inesperado: %p',
    async (geojson) => {
      const { repository } = setup({ data: [{ ...row, geojson }], error: null });

      expect(await repository.list('p-1')).toEqual({ ok: false, reason: 'UNKNOWN' });
    },
  );

  it.each([
    ['42501', 'FORBIDDEN'],
    ['P0001', 'NOT_ACTIVE'],
    ['22023', 'INVALID_DATA'],
    ['XX000', 'UNKNOWN'],
  ])('traduce el error %s a %s', async (code, reason) => {
    const { repository } = setup({ data: null, error: { code } });

    expect(await repository.list('p-1')).toEqual({ ok: false, reason });
  });

  it('reconoce la falta de conexión', async () => {
    const { repository } = setup({ data: null, error: { message: 'Network request failed' } });

    expect(await repository.save('p-1', draft)).toEqual({ ok: false, reason: 'NETWORK' });
  });

  it('guarda la ruta con guardar_ruta en GeoJSON [longitud, latitud]', async () => {
    const { client, repository } = setup({ data: 'r-2', error: null });

    const result = await repository.save('p-1', draft);

    expect(result).toEqual({ ok: true, value: 'r-2' });
    expect(client.rpc).toHaveBeenCalledWith('guardar_ruta', {
      p_protegido_id: 'p-1',
      p_sentido: 'COLEGIO_CASA',
      p_geojson: toLineString(draft.points),
      p_corredor_m: 75,
      p_duracion_min: 30,
    });
    expect(toLineString(draft.points)).toEqual({
      type: 'LineString',
      coordinates: [
        [-74.08, 4.6],
        [-74.07, 4.61],
      ],
    });
  });

  it('informa el error al guardar', async () => {
    const { repository } = setup({ data: null, error: { code: '22023' } });

    expect(await repository.save('p-1', draft)).toEqual({ ok: false, reason: 'INVALID_DATA' });
  });
});
