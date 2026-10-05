import { CHUNK_SIZE, createSecureSessionStorage, SecureStoreLike } from './secureSessionStorage';

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

const KEY = 'sb-test-auth-token';

describe('secureSessionStorage', () => {
  it('devuelve null si no hay sesión guardada', async () => {
    const storage = createSecureSessionStorage(createMemoryStore());

    await expect(storage.getItem(KEY)).resolves.toBeNull();
  });

  it('guarda y recupera una sesión pequeña en un solo trozo', async () => {
    const store = createMemoryStore();
    const storage = createSecureSessionStorage(store);

    await storage.setItem(KEY, '{"access_token":"abc"}');

    expect(store.data.get(`${KEY}.n`)).toBe('1');
    await expect(storage.getItem(KEY)).resolves.toBe('{"access_token":"abc"}');
  });

  it('parte una sesión grande en trozos menores al límite de SecureStore', async () => {
    const store = createMemoryStore();
    const storage = createSecureSessionStorage(store);
    const value = 'x'.repeat(CHUNK_SIZE * 2 + 10);

    await storage.setItem(KEY, value);

    expect(store.data.get(`${KEY}.n`)).toBe('3');
    for (const [key, chunk] of store.data) {
      if (key !== `${KEY}.n`) expect(chunk.length).toBeLessThanOrEqual(CHUNK_SIZE);
    }
    await expect(storage.getItem(KEY)).resolves.toBe(value);
  });

  it('borra los trozos sobrantes cuando la nueva sesión es más corta', async () => {
    const store = createMemoryStore();
    const storage = createSecureSessionStorage(store);

    await storage.setItem(KEY, 'x'.repeat(CHUNK_SIZE * 3));
    await storage.setItem(KEY, 'corta');

    expect(store.data.has(`${KEY}.1`)).toBe(false);
    expect(store.data.has(`${KEY}.2`)).toBe(false);
    await expect(storage.getItem(KEY)).resolves.toBe('corta');
  });

  it('elimina todos los trozos al cerrar sesión', async () => {
    const store = createMemoryStore();
    const storage = createSecureSessionStorage(store);
    await storage.setItem(KEY, 'x'.repeat(CHUNK_SIZE + 1));

    await storage.removeItem(KEY);

    expect(store.data.size).toBe(0);
    await expect(storage.getItem(KEY)).resolves.toBeNull();
  });

  it('descarta una sesión incompleta en vez de devolverla corrupta', async () => {
    const store = createMemoryStore();
    const storage = createSecureSessionStorage(store);
    await storage.setItem(KEY, 'x'.repeat(CHUNK_SIZE + 1));
    store.data.delete(`${KEY}.1`);

    await expect(storage.getItem(KEY)).resolves.toBeNull();
    expect(store.data.size).toBe(0);
  });

  it('ignora un contador inválido', async () => {
    const store = createMemoryStore();
    store.data.set(`${KEY}.n`, 'no-es-numero');
    const storage = createSecureSessionStorage(store);

    await expect(storage.getItem(KEY)).resolves.toBeNull();
  });
});
