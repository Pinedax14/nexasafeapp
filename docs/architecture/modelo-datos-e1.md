# Modelo de datos — Épica E1 (Sprint 01)

**Estado:** APROBADO el 03/10/2026 (decisiones D1–D7). Siguiente paso: la migración.
**Base:** Diseño Arquitectónico v1.1, capítulos 6 y 7; decisiones D (credenciales en Supabase Auth), E (PIN en el servidor), F (`consentimientos`) y G (`personal_institucion`).

## 1. Tablas

Todas en el esquema `public`, con **RLS activado** y sin acceso para el rol `anon`.

### `colegios`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `nombre` | `text` not null | |
| `nit` | `text` not null unique | |
| `creado_en` | `timestamptz` not null | `now()` |

### `personal_institucion`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK → `auth.users(id)` | Misma identidad que Supabase Auth |
| `colegio_id` | `uuid` not null → `colegios(id)` | |
| `nombre` | `text` not null | |
| `cargo` | `text` | |
| `activo` | `boolean` not null | `true`; `false` retira el acceso sin borrar historial |
| `creado_en` | `timestamptz` not null | `now()` |

### `guardianes`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK → `auth.users(id)` | Sin `password_hash`: la contraseña la gestiona Supabase Auth |
| `nombre` | `text` not null | |
| `email` | `text` not null | Copia de `auth.users.email` al registrarse |
| `creado_en` | `timestamptz` not null | `now()` |

### `protegidos`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `guardian_id` | `uuid` not null → `guardianes(id)` | |
| `colegio_id` | `uuid` not null → `colegios(id)` | |
| `nombre` | `text` not null | |
| `documento_cifrado` | `bytea` not null | Ver decisión D4 (RNF-02) |
| `foto_path` | `text` | Ruta en un bucket **privado** de Storage. Ver D4 |
| `pin_hash` | `text` null | Argon2id; solo lo escribe y lee la Edge Function `auth-pin`. Ver D5 |
| `estado` | enum `estado_protegido` not null | `PENDIENTE_VALIDACION` (por defecto), `ACTIVO`, `INACTIVO` |
| `validado_por` | `uuid` null → `personal_institucion(id)` | |
| `validado_en` | `timestamptz` null | |
| `creado_en` | `timestamptz` not null | `now()` |

### `consentimientos` (append-only)
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `guardian_id` | `uuid` not null → `guardianes(id)` | |
| `protegido_id` | `uuid` not null → `protegidos(id)` | |
| `tipo` | enum `tipo_consentimiento` | `OTORGADO`, `REVOCADO` (una revocación es una fila nueva) |
| `version_politica` | `text` not null | Ej. `1.0` (versión de `politica-tratamiento.md`) |
| `aceptado_en` | `timestamptz` not null | `now()` del servidor; el cliente no lo envía |

### `audit_log` (append-only)
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `bigint` identity PK | |
| `actor_id` | `uuid` null | `auth.uid()` |
| `entidad` | `text` not null | Ej. `protegidos` |
| `entidad_id` | `uuid` | |
| `accion` | `text` not null | `INSERT`, `UPDATE`, `VALIDAR`, `LEER` |
| `creado_en` | `timestamptz` not null | `now()` del servidor |

Nunca guarda valores de columnas: solo quién hizo qué sobre qué fila (sin datos personales).

## 2. Roles y alta de usuarios

- El rol vive en `auth.users.raw_app_meta_data ->> 'rol'`, que solo el servidor puede escribir.
- **Guardián:** un trigger `security definer` sobre `auth.users` crea la fila en `guardianes` y asigna `rol = 'guardian'` cuando alguien se registra desde la app (E1-01).
- **Administrador (`admin`, E1-06):** crea colegios y registra personal institucional desde la app. El primer administrador se crea una sola vez a mano (ver README, "Crear el primer administrador").
- **Personal institucional:** lo crea el administrador mediante la Edge Function `admin-personal`, que verifica `rol = admin`, crea la cuenta en Supabase Auth ya con `rol = institucion` y una **contraseña temporal** que el administrador entrega en privado (el correo gratuito de Supabase no envía invitaciones fuera de la organización), inserta la fila en `personal_institucion` y registra `CREAR_PERSONAL` en `audit_log`. Rate limiting: máximo 10 altas cada 10 minutos por administrador.
- **Protegido:** ver D5.

## 3. Políticas RLS

| Tabla | Rol | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `colegios` | `guardian`, `institucion` | Todos (para elegir el colegio en el alta) | — | — | — |
| `colegios` | `admin` | Todos | Sí | Sí | — |
| `personal_institucion` | `institucion` | Su propia fila | — | — | — |
| `personal_institucion` | `admin` | Todas | Solo vía `admin-personal` | `activo`, `cargo` | — |
| `guardianes` | `guardian` | Su propia fila | Solo vía trigger | Su `nombre` | — |
| `protegidos` | `guardian` | Sus menores (`guardian_id = auth.uid()`) | Solo vía función `registrar_protegido` | — | — |
| `protegidos` | `institucion` | Menores de su colegio, si `activo` | — | Solo vía función `validar_protegido` | — |
| `consentimientos` | `guardian` | Los propios | Solo vía `registrar_protegido` | Nunca | Nunca |
| `audit_log` | todos | — | Solo funciones/triggers | Nunca | Nunca |

El rol `admin` **no** tiene ninguna política sobre `protegidos`, `consentimientos` ni `audit_log`: no accede a datos de menores. Toda acción del administrador queda en `audit_log`.

Los cambios sensibles pasan por **funciones de base de datos** que verifican el rol y escriben en `audit_log` en la misma transacción:

- `registrar_protegido(nombre, documento, colegio_id, foto_path, version_politica)` (firma desde E1-02; la foto debe estar ya subida en la carpeta del guardián y no usarse en otro menor) → crea el protegido en `PENDIENTE_VALIDACION` **y** su consentimiento `OTORGADO`, o nada si algo falla (E1-02 + E11-01).
- `validar_protegido(protegido_id)` → solo personal activo del mismo colegio; pasa a `ACTIVO` y registra `VALIDAR` (E1-03).

### Fotos de los menores (Storage, E1-02)

Bucket privado `fotos-protegidos` (solo JPG/PNG, máximo 2 MB). Ruta de cada foto: `<guardian_id>/<archivo>`.

| Rol | Subir | Ver |
|---|---|---|
| `guardian` | Solo en su carpeta | Solo su carpeta |
| `institucion` | — | Fotos de los menores de su colegio, si está activo |
| `admin` | — | — |

Cada política tendrá su prueba en `supabase/tests/` (pgTAP, `supabase test db`), ejecutada en el CI (RNF-27).

## 4. Decisiones (aprobadas el 03/10/2026)

| # | Decisión | Propuesta |
|---|---|---|
| **D1** | Registro de lecturas en `audit_log` | PostgreSQL no tiene triggers de SELECT. Las lecturas del detalle de un menor se hacen con una función `obtener_protegido(id)` que registra `LEER`; las listas solo muestran nombre y estado |
| **D2** | Correo duplicado en el registro | Supabase Auth con confirmación de correo activada; la app muestra siempre el mismo mensaje para no revelar si el correo existe |
| **D3** | ¿Quién crea colegios y personal institucional? Ninguna historia lo cubre | **Rol `admin` con pantallas en la app** (nueva historia E1-06, 5 pts, Sprint 01, RF-42). `supabase/seed.sql` solo para datos de prueba en dev |
| **D4** | Cifrado de `documento` y `foto` (RNF-02: cifrado por columna) | `documento` cifrado con `pgcrypto` usando una llave guardada en **Supabase Vault**. La foto, en un bucket privado de Storage con políticas por guardián y colegio (cifrado en reposo del proveedor) |
| **D5** | ¿Quién asigna el PIN y cómo obtiene sesión el protegido? | El guardián asigna el PIN cuando el colegio valida al menor (estado `ACTIVO`), a través de `auth-pin`. El mecanismo exacto de sesión se define en el refinement de E1-04 |
| **D6** | Datos mínimos del menor | Solo nombre, documento, foto y colegio (lo que pide el Gherkin de E1-02). Sin fecha de nacimiento, dirección ni teléfono |
| **D7** | Umbrales de seguridad no definidos en los documentos | Contraseña de al menos 8 caracteres; `auth-pin` bloquea 15 minutos tras 5 PIN incorrectos |
