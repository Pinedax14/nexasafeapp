/**
 * Almacenamiento cifrado de la sesión (RF-05, E1-05).
 *
 * expo-secure-store cifra cada valor con el Keystore de Android, pero puede rechazar
 * valores de más de ~2048 bytes. La sesión de Supabase es más grande, así que se
 * guarda partida en trozos: `<clave>.n` con la cantidad y `<clave>.0`, `<clave>.1`…
 */
export type SecureStoreLike = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

export type SessionStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

/** Margen bajo el límite de 2048 bytes (la sesión es JSON ASCII: 1 carácter = 1 byte). */
export const CHUNK_SIZE = 1800;

const countKey = (key: string) => `${key}.n`;
const chunkKey = (key: string, index: number) => `${key}.${index}`;

async function readCount(store: SecureStoreLike, key: string): Promise<number> {
  const raw = await store.getItemAsync(countKey(key));
  const count = raw === null ? 0 : Number.parseInt(raw, 10);
  return Number.isInteger(count) && count > 0 ? count : 0;
}

async function deleteChunks(store: SecureStoreLike, key: string, count: number): Promise<void> {
  for (let index = 0; index < count; index += 1) {
    await store.deleteItemAsync(chunkKey(key, index));
  }
  await store.deleteItemAsync(countKey(key));
}

export function createSecureSessionStorage(store: SecureStoreLike): SessionStorage {
  return {
    async getItem(key) {
      const count = await readCount(store, key);
      if (count === 0) return null;

      const chunks: string[] = [];
      for (let index = 0; index < count; index += 1) {
        const chunk = await store.getItemAsync(chunkKey(key, index));
        if (chunk === null) {
          // Sesión incompleta: se descarta en vez de entregar un valor corrupto.
          await deleteChunks(store, key, count);
          return null;
        }
        chunks.push(chunk);
      }
      return chunks.join('');
    },

    async setItem(key, value) {
      const previousCount = await readCount(store, key);
      const chunks: string[] = [];
      for (let start = 0; start < value.length; start += CHUNK_SIZE) {
        chunks.push(value.slice(start, start + CHUNK_SIZE));
      }

      for (let index = 0; index < chunks.length; index += 1) {
        await store.setItemAsync(chunkKey(key, index), chunks[index]);
      }
      for (let index = chunks.length; index < previousCount; index += 1) {
        await store.deleteItemAsync(chunkKey(key, index));
      }
      await store.setItemAsync(countKey(key), String(chunks.length));
    },

    async removeItem(key) {
      const count = await readCount(store, key);
      await deleteChunks(store, key, count);
    },
  };
}
