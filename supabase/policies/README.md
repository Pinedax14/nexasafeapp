# Políticas RLS

Cada tabla tiene RLS activado y una prueba de política asociada (RNF-27).

- Las políticas se crean dentro de las migraciones de `supabase/migrations/`.
- Este directorio documenta cada política (tabla, rol, operación y regla) y guarda sus pruebas.
- El rol del usuario se lee de `auth.jwt() -> 'app_metadata' ->> 'rol'`; solo el servidor lo escribe.
