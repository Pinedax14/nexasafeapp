import { RouteDraft } from '../entities/Route';
import { RouteCache } from '../repositories/RouteCache';
import { RouteRepository } from '../repositories/RouteRepository';
import {
  isInsideColombia,
  ManageRoutes,
  routeLengthMeters,
  stepCorridor,
  validateRoute,
} from './ManageRoutes';

const bogota = [
  { latitude: 4.6, longitude: -74.08 },
  { latitude: 4.61, longitude: -74.07 },
];

const draft = (changes: Partial<RouteDraft> = {}): RouteDraft => ({
  direction: 'CASA_COLEGIO',
  points: bogota,
  corridorMeters: 50,
  expectedMinutes: 25,
  ...changes,
});

function setup() {
  const repository: jest.Mocked<RouteRepository> = {
    list: jest.fn().mockResolvedValue({ ok: true, value: [] }),
    save: jest.fn().mockResolvedValue({ ok: true, value: 'r-1' }),
  };
  return { repository, manageRoutes: new ManageRoutes(repository) };
}

describe('validateRoute (E3-01a, E3-02, E3-03, D10, D15)', () => {
  it('acepta una ruta válida', () => {
    expect(validateRoute(draft())).toEqual({});
  });

  it('pide al menos 2 puntos', () => {
    expect(validateRoute(draft({ points: [bogota[0]] })).points).toBe(
      'Marca al menos 2 puntos en el mapa.',
    );
  });

  it('rechaza más de 200 puntos', () => {
    const points = Array.from({ length: 201 }, (_, i) => ({
      latitude: 4.6 + i * 0.00001,
      longitude: -74.08,
    }));
    expect(validateRoute(draft({ points })).points).toBe('La ruta puede tener máximo 200 puntos.');
  });

  it('rechaza puntos fuera de Colombia', () => {
    const madrid = [
      { latitude: 40.41, longitude: -3.7 },
      { latitude: 40.42, longitude: -3.69 },
    ];
    expect(validateRoute(draft({ points: madrid })).points).toBe(
      'La ruta debe quedar dentro de Colombia.',
    );
  });

  it('rechaza rutas de más de 30 km', () => {
    const bogotaTunja = [
      { latitude: 4.6, longitude: -74.08 },
      { latitude: 5.53, longitude: -73.36 },
    ];
    expect(validateRoute(draft({ points: bogotaTunja })).points).toBe(
      'La ruta no puede medir más de 30 km.',
    );
  });

  it.each([24, 201, 50.5])('rechaza un corredor de %p m', (corridorMeters) => {
    expect(validateRoute(draft({ corridorMeters })).corridor).toBe(
      'El corredor va de 25 a 200 metros.',
    );
  });

  it.each([4, 121, NaN])('rechaza una duración de %p min', (expectedMinutes) => {
    expect(validateRoute(draft({ expectedMinutes })).duration).toBe(
      'La duración va de 5 a 120 minutos.',
    );
  });

  it('acepta los extremos de los rangos', () => {
    expect(validateRoute(draft({ corridorMeters: 25, expectedMinutes: 5 }))).toEqual({});
    expect(validateRoute(draft({ corridorMeters: 200, expectedMinutes: 120 }))).toEqual({});
  });
});

describe('utilidades de la ruta', () => {
  it('mide la longitud de la ruta en metros', () => {
    expect(routeLengthMeters(bogota)).toBeGreaterThan(1500);
    expect(routeLengthMeters(bogota)).toBeLessThan(1600);
    expect(routeLengthMeters([bogota[0]])).toBe(0);
  });

  it('reconoce los puntos dentro de Colombia', () => {
    expect(isInsideColombia(bogota[0])).toBe(true);
    expect(isInsideColombia({ latitude: 40.41, longitude: -3.7 })).toBe(false);
  });

  it('mueve el corredor de 25 en 25 sin salir del rango', () => {
    expect(stepCorridor(50, 1)).toBe(75);
    expect(stepCorridor(50, -1)).toBe(25);
    expect(stepCorridor(25, -1)).toBe(25);
    expect(stepCorridor(200, 1)).toBe(200);
  });
});

describe('ManageRoutes', () => {
  it('lista las rutas del menor', async () => {
    const { repository, manageRoutes } = setup();

    await manageRoutes.list('p-1');

    expect(repository.list).toHaveBeenCalledWith('p-1');
  });

  it('guarda una ruta válida', async () => {
    const { repository, manageRoutes } = setup();

    const result = await manageRoutes.save('p-1', draft());

    expect(result).toEqual({ ok: true, value: 'r-1' });
    expect(repository.save).toHaveBeenCalledWith('p-1', draft());
  });

  it('no envía al servidor una ruta inválida', async () => {
    const { repository, manageRoutes } = setup();

    const result = await manageRoutes.save('p-1', draft({ points: [], expectedMinutes: 0 }));

    expect(result).toEqual({
      ok: false,
      reason: 'INVALID_INPUT',
      errors: {
        points: 'Marca al menos 2 puntos en el mapa.',
        duration: 'La duración va de 5 a 120 minutos.',
      },
    });
    expect(repository.save).not.toHaveBeenCalled();
  });
});

const route = {
  id: 'r-1',
  direction: 'CASA_COLEGIO' as const,
  points: bogota,
  corridorMeters: 50,
  expectedMinutes: 25,
  updatedAt: '2026-10-12T15:00:00Z',
};

function setupWithCache(
  listResult: Awaited<ReturnType<RouteRepository['list']>>,
  cached: unknown = null,
) {
  const repository: jest.Mocked<RouteRepository> = {
    list: jest.fn().mockResolvedValue(listResult),
    save: jest.fn(),
  };
  const cache: jest.Mocked<RouteCache> = {
    load: jest.fn().mockResolvedValue(cached),
    save: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  };
  return { repository, cache, manageRoutes: new ManageRoutes(repository, cache) };
}

describe('ManageRoutes · caché local (E3-01b, D11)', () => {
  it('guarda en el teléfono las rutas que llegan del servidor', async () => {
    const { cache, manageRoutes } = setupWithCache({ ok: true, value: [route] });

    const result = await manageRoutes.list('p-1');

    expect(result).toEqual({ ok: true, value: [route], fromCache: false });
    expect(cache.save).toHaveBeenCalledWith('p-1', [route]);
  });

  it('sin conexión muestra las rutas guardadas en el teléfono', async () => {
    const { manageRoutes } = setupWithCache({ ok: false, reason: 'NETWORK' }, [route]);

    expect(await manageRoutes.list('p-1')).toEqual({ ok: true, value: [route], fromCache: true });
  });

  it('sin conexión y sin caché informa la falta de conexión', async () => {
    const { manageRoutes } = setupWithCache({ ok: false, reason: 'NETWORK' }, null);

    expect(await manageRoutes.list('p-1')).toEqual({ ok: false, reason: 'NETWORK' });
  });

  it('un error de permisos no usa la caché', async () => {
    const { cache, manageRoutes } = setupWithCache({ ok: false, reason: 'FORBIDDEN' }, [route]);

    expect(await manageRoutes.list('p-1')).toEqual({ ok: false, reason: 'FORBIDDEN' });
    expect(cache.load).not.toHaveBeenCalled();
  });

  it('si la caché falla al guardar, igual entrega las rutas del servidor', async () => {
    const { cache, manageRoutes } = setupWithCache({ ok: true, value: [route] });
    cache.save.mockRejectedValue(new Error('Keystore no disponible'));

    expect(await manageRoutes.list('p-1')).toEqual({ ok: true, value: [route], fromCache: false });
  });

  it('si la caché falla al leer, informa la falta de conexión', async () => {
    const { cache, manageRoutes } = setupWithCache({ ok: false, reason: 'NETWORK' });
    cache.load.mockRejectedValue(new Error('Keystore no disponible'));

    expect(await manageRoutes.list('p-1')).toEqual({ ok: false, reason: 'NETWORK' });
  });

  it('borra la caché al cerrar sesión', async () => {
    const { cache, manageRoutes } = setupWithCache({ ok: true, value: [] });

    await manageRoutes.clearCache();

    expect(cache.clear).toHaveBeenCalled();
  });

  it('sin caché configurada (navegador) funciona igual', async () => {
    const repository: jest.Mocked<RouteRepository> = {
      list: jest.fn().mockResolvedValue({ ok: false, reason: 'NETWORK' }),
      save: jest.fn(),
    };
    const manageRoutes = new ManageRoutes(repository);

    expect(await manageRoutes.list('p-1')).toEqual({ ok: false, reason: 'NETWORK' });
    await expect(manageRoutes.clearCache()).resolves.toBeUndefined();
  });
});
