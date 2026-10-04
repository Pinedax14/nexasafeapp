# Políticas RLS

Cada tabla tiene RLS activado y una prueba de política asociada (RNF-27).

- Las políticas se crean dentro de las migraciones de `supabase/migrations/`.
- El diseño de cada política (tabla, rol, operación y regla) está en
  [`docs/architecture/modelo-datos-e1.md`](../../docs/architecture/modelo-datos-e1.md), sección 3.
- Las pruebas viven en [`supabase/tests/database/`](../tests/database/) (pgTAP) y el CI las ejecuta en cada PR
  contra una base de datos efímera (`supabase db start` + `supabase test db`).
- El rol del usuario se lee de `auth.jwt() -> 'app_metadata' ->> 'rol'` mediante `private.rol_actual()`;
  solo el servidor lo escribe.

## Cómo simular un usuario en una prueba

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub": "<uuid>", "role": "authenticated", "app_metadata": {"rol": "guardian"}}';
```
