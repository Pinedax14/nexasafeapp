import {
  createSecureSessionStorage,
  SecureStoreLike,
} from '../../../../core/storage/secureSessionStorage';
import { Platform } from 'react-native';
import { createRouteCache, ROUTE_CACHE_KEY, SecureStoreRouteCache } from './SecureStoreRouteCache';

function createMemoryStore(): SecureStoreLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItemAsync: jest.fn(async (key: string) => data.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      data.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      data.delete(key);
    }),
  };
}

function setup() {
  const store = createMemoryStore();
  return { store, cache: new SecureStoreRouteCache(createSecureSessionStorage(store)) };
}

const route = {
  id: 'r-1',
  direction: 'CASA_COLEGIO' as const,
  points: [
    { latitude: 4.6, longitude: -74.08 },
    { latitude: 4.61, longitude: -74.07 },
  ],
  corridorMeters: 50,
  expectedMinutes: 25,
  updatedAt: '2026-10-12T15:00:00Z',
};

describe('SecureStoreRouteCache (E3-01b, D11)', () => {
  it('no hay caché antes de sincronizar', async () => {
    const { cache } = setup();

    expect(await cache.load('p-1')).toBeNull();
  });

  it('guarda y lee las rutas de cada menor', async () => {
    const { cache } = setup();

    await cache.save('p-1', [route]);
    await cache.save('p-2', []);

    expect(await cache.load('p-1')).toEqual([route]);
    expect(await cache.load('p-2')).toEqual([]);
  });

  it('una sincronización nueva reemplaza la copia anterior', async () => {
    const { cache } = setup();

    await cache.save('p-1', [route]);
    await cache.save('p-1', [{ ...route, corridorMeters: 75 }]);

    expect((await cache.load('p-1'))?.[0].corridorMeters).toBe(75);
  });

  it('guarda en trozos una ruta larga (límite de SecureStore)', async () => {
    const { cache, store } = setup();
    const points = Array.from({ length: 200 }, (_, i) => ({
      latitude: 4.6 + i * 0.0001,
      longitude: -74.08 + i * 0.0001,
    }));

    await cache.save('p-1', [{ ...route, points }]);

    expect(Number(store.data.get(`${ROUTE_CACHE_KEY}.n`))).toBeGreaterThan(1);
    expect((await cache.load('p-1'))?.[0].points).toHaveLength(200);
  });

  it('borra todo al cerrar sesión', async () => {
    const { cache, store } = setup();
    await cache.save('p-1', [route]);

    await cache.clear();

    expect(await cache.load('p-1')).toBeNull();
    expect(store.data.size).toBe(0);
  });

  it.each([
    ['JSON dañado', '{no es json'],
    ['un arreglo en lugar de un objeto', '[]'],
    [
      'una ruta sin puntos válidos',
      JSON.stringify({ 'p-1': [{ ...route, points: [{ latitude: 'x' }] }] }),
    ],
    ['un sentido desconocido', JSON.stringify({ 'p-1': [{ ...route, direction: 'OTRO' }] })],
  ])('ignora una caché con %s', async (_, raw) => {
    const { cache, store } = setup();
    store.data.set(`${ROUTE_CACHE_KEY}.n`, '1');
    store.data.set(`${ROUTE_CACHE_KEY}.0`, raw);

    expect(await cache.load('p-1')).toBeNull();
  });

  it('una caché dañada se reemplaza al guardar', async () => {
    const { cache, store } = setup();
    store.data.set(`${ROUTE_CACHE_KEY}.n`, '1');
    store.data.set(`${ROUTE_CACHE_KEY}.0`, '{no es json');

    await cache.save('p-1', [route]);

    expect(await cache.load('p-1')).toEqual([route]);
  });
});

describe('createRouteCache', () => {
  afterEach(() => jest.restoreAllMocks());

  it('en Android usa expo-secure-store', () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    expect(createRouteCache()).toBeInstanceOf(SecureStoreRouteCache);
  });

  it('en el navegador no guarda caché', () => {
    jest.replaceProperty(Platform, 'OS', 'web');

    expect(createRouteCache()).toBeUndefined();
  });
});
