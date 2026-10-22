const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Compara ignorando mayúsculas, tildes y espacios de más (ej. buscar colegio por nombre). */
export function matchesQuery(text: string, query: string): boolean {
  const q = normalize(query).trim();
  if (!q) return true;
  return normalize(text).includes(q);
}
