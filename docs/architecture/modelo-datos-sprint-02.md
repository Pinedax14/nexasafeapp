# Modelo de datos — Sprint 02 (E2-01, E3-01, E3-02, E3-03, E4-01, E4-04)

**Estado:** APROBADO el 09/10/2026, con las decisiones D14–D17. Siguiente paso: la migración.
**Base:** Diseño Arquitectónico v1.1, capítulos 6 y 7; decisiones D8–D13 del refinement ([`sprint-02/refinement.md`](../scrum/sprint-02/refinement.md)); controles STRIDE de E2 y E3/E4 ([`threat-model.md`](../security/threat-model.md)); bocetos W1–W6 ([`sprint-02/wireframes.md`](../scrum/sprint-02/wireframes.md)).

No se agregan tablas fuera del Diseño: las tres son `rutas`, `trayectos` y `contactos_apoyo`. Las columnas extra salen de las decisiones aprobadas o se proponen en la sección 5.

## 1. Extensión

- `postgis` en el esquema `extensions` (Supabase la trae disponible). La usan `rutas.geometria` y, desde el Sprint 03, la geocerca de llegada.

## 2. Tablas

Todas en `public`, con **RLS activado** y sin acceso para `anon`.

### `rutas` (E3-01, E3-02, E3-03)
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `protegido_id` | `uuid` not null → `protegidos(id)` | |
| `sentido` | enum `sentido_ruta` not null | `CASA_COLEGIO`, `COLEGIO_CASA` (D12). Único por menor: máximo 2 rutas |
| `geometria` | `extensions.geography(LineString, 4326)` not null | Sin cifrado por columna (D13). Validada en el servidor (ver D15) |
| `corredor_m` | `int` not null | 25–200, 50 por defecto (D10) |
| `duracion_esperada_min` | `int` not null | 5–120 (D10) |
| `creado_en` | `timestamptz` not null | `now()` |
| `actualizado_en` | `timestamptz` not null | `now()`; lo cambia `guardar_ruta` |

### `trayectos` (E4-01, E4-04)
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `protegido_id` | `uuid` not null → `protegidos(id)` | |
| `ruta_id` | `uuid` not null → `rutas(id)` | |
| `inicio_en` | `timestamptz` not null | Hora del servidor (`now()`) |
| `fin_en` | `timestamptz` null | La llena el cierre (E4-03, Sprint 03) |
| `estado` | enum `estado_trayecto` not null | Solo `EN_CURSO` y `CERRADO` (fase 1). `DESVIADO`, `ALERTA` y `VENCIDO` se agregan con `alter type … add value` en la fase 2 |

Índice único parcial `(protegido_id) where estado = 'EN_CURSO'`: un solo trayecto en curso por menor.

### `contactos_apoyo` (E2-01, D8)

Guarda la invitación y, cuando se acepta, el contacto. Así no hace falta una tabla `invitaciones` aparte.

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` PK | |
| `guardian_id` | `uuid` not null → `guardianes(id)` | Quien invita |
| `protegido_id` | `uuid` not null → `protegidos(id)` | Menor al que apoya (D8) |
| `alcance_visibilidad` | enum `alcance_visibilidad` not null | Solo `SOLO_ALERTAS` en la fase 1 (D8). E2-02 (fase 2) agrega más valores |
| `token_hash` | `text` not null unique | SHA-256 del token; el token (32 bytes aleatorios) no se guarda |
| `vence_en` | `timestamptz` not null | Creación + 72 horas (W5) |
| `usuario_id` | `uuid` null → `auth.users(id)` | Cuenta `apoyo` que aceptó; `null` mientras está pendiente |
| `nombre` | `text` null | Nombre del contacto, al aceptar |
| `aceptada_en` | `timestamptz` null | Un solo uso: si no es `null`, el token ya no sirve |
| `creado_en` | `timestamptz` not null | `now()` |

Estados que muestra la app (W5), calculados y sin columna propia: **Pendiente** (`aceptada_en` null y `vence_en` futuro), **Vencida** y **Aceptó**.

## 3. Funciones (cambios sensibles con rol verificado y `audit_log` en la misma transacción)

| Función | Quién | Qué hace | `audit_log` |
|---|---|---|---|
| `guardar_ruta(protegido_id, sentido, geojson, corredor_m, duracion_min)` | `guardian` del menor, menor `ACTIVO` | Crea o reemplaza la ruta de ese sentido; valida rangos y geometría (D15) | `GUARDAR_RUTA` |
| `obtener_rutas(protegido_id)` | `guardian` del menor o el propio `protegido` | Devuelve sus rutas en GeoJSON (patrón D1: las lecturas de datos del menor pasan por función) | `LEER_RUTAS` |
| `iniciar_trayecto(ruta_id)` | `protegido` dueño de la ruta, `ACTIVO` | Crea el trayecto `EN_CURSO` con hora del servidor; rechaza si ya hay uno en curso | `INICIAR_TRAYECTO` |
| `crear_invitacion(protegido_id)` | `guardian` del menor `ACTIVO` | Genera el token, guarda su hash y devuelve el token una sola vez. Máximo 10 por guardián cada hora | `CREAR_INVITACION` |
| `ver_invitacion(token)` | cualquiera con el token | Devuelve el nombre del menor y del guardián si el token sirve; si no, el mismo error genérico (W6) | — |
| `aceptar_invitacion(token)` | `apoyo` con sesión | Vincula su cuenta al menor; token usado o vencido → error genérico | `ACEPTAR_INVITACION` |

**Alta de la cuenta `apoyo` (D8):** la app registra al contacto con `supabase.auth.signUp` y envía el token en los metadatos. El trigger `asignar_rol_por_defecto` se amplía: si los metadatos traen un token válido, la cuenta nace con `rol = apoyo` y queda vinculada en la misma transacción; si el token no sirve, el registro se rechaza con un mensaje genérico. Sin token, todo sigue igual (`guardian`). `crear_guardian` ya ignora las cuentas que no son `guardian`.

## 4. Políticas RLS

| Tabla | Rol | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `rutas` | `guardian` | Rutas de sus menores (vía `obtener_rutas`) | Solo vía `guardar_ruta` | Solo vía `guardar_ruta` | — |
| `rutas` | `protegido` | Sus rutas (vía `obtener_rutas`) | — | — | — |
| `trayectos` | `protegido` | Los suyos | Solo vía `iniciar_trayecto` | — (cierre en E4-03) | — |
| `trayectos` | `guardian` | Los de sus menores | — | — | — |
| `contactos_apoyo` | `guardian` | Los suyos, **sin** `token_hash` | Solo vía `crear_invitacion` | — | — |
| `contactos_apoyo` | `apoyo` | Sus filas aceptadas, sin `token_hash` | — | Solo vía `aceptar_invitacion` | — |

Sin políticas para `apoyo` en `rutas` ni `trayectos` (D8: solo alertas), ni para `institucion` y `admin` en ninguna de las tres tablas. Cada política lleva su prueba pgTAP (RNF-27), ejecutada en el CI.

## 5. Decisiones nuevas (aprobadas el 09/10/2026)

| # | Tema | Propuesta |
|---|---|---|
| **D14** | Cómo llega el enlace al contacto (E2-01). La app no tiene dominio web, y WhatsApp no convierte en enlace tocable una dirección propia como `nexasafe://…` | El mensaje de compartir lleva el enlace `nexasafe://invitacion/<token>` **y** el mismo token como código. En el ingreso se agrega "Tengo una invitación" para pegar el código. Hay que declarar `"scheme": "nexasafe"` en `app.json` |
| **D15** | Límites de la geometría (DoS en `rutas`) | Entre 2 y 200 puntos, longitud total de hasta 30 km, `ST_IsValid` y coordenadas dentro de Colombia (latitud −4,3 a 13,5; longitud −82 a −66) |
| **D16** | Sin E4-03 (Sprint 03), un trayecto iniciado en el Sprint 02 nunca se cierra y el menor no puede iniciar otro | Aceptarlo en el Sprint 02: en dev se cierra a mano por SQL para volver a probar, y se deja anotado en la review. No se adelanta E4-03 |
| **D17** | `ver_invitacion` muestra el nombre del menor antes de tener cuenta (W6) | Mostrar solo el **primer nombre** del menor y el nombre del guardián. Quien tiene el token fue invitado por el guardián, y el token de 128 bits no se puede adivinar |

## 6. Lo que no cambia en este sprint

- **Sin ubicación:** el Sprint 02 no captura GPS. La ubicación en vivo es E4-02 (Sprint 03). E4-04 solo muestra el indicador cuando hay un trayecto `EN_CURSO`.
- **Caché de la ruta (D11):** va en `expo-secure-store` del teléfono y no toca el esquema.
- **PIA:** agregar que el servidor de teselas de OpenStreetMap recibe las zonas del mapa que se ven (D9).
- **Tipos de Supabase:** se regeneran después de la migración (DoD).
