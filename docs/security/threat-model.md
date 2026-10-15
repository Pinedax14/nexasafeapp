# Modelo de amenazas (STRIDE) — NexaSafe

Versión inicial del Sprint 00 (03/10/2026), a partir del Plan (`PLAN_NEXASAFE.md` v1.2, secciones 9.4 y 11) y del Diseño v1.1 (capítulo 7). Cubre solo las épicas de la fase 1. Cada refinement amplía la épica que entra al siguiente sprint. Estados de E0 y E1 actualizados en la Security Review del Sprint 01 (05/10/2026).

> PENDIENTE: revisión del equipo, facilitada por el Security Champion de los Sprints 00–01 (Juan Felipe Pineda Cardona).

Estado: **Planificado** (control definido, sin construir) · **Implementado** · **Verificado** (con prueba).

## E0 — Plataforma DevSecOps

| Categoría | Amenaza | Componente | Control | Estado |
|---|---|---|---|---|
| Spoofing | Push directo a `main` sin revisión | GitHub | Protección de `main`: PR + checks verdes. Desviación: 0 aprobaciones obligatorias porque un solo integrante ejecuta el trabajo (R7) | Implementado (parcial) |
| Tampering | Dependencia maliciosa o vulnerable | `package-lock.json` | `npm ci`, `npm audit --audit-level=high`, Dependabot | Implementado |
| Repudiation | Cambio sin autor trazable | Repositorio | PR obligatorio, historial de git y Conventional Commits | Implementado |
| Information disclosure | Llaves de Supabase o EAS en el código | Repositorio, CI | Gitleaks (pre-commit + CI); secretos solo en GitHub/EAS Secrets | Implementado |
| Denial of service | Pipeline roto que bloquea al equipo | GitHub Actions | Jobs independientes; corrección en el mismo día | Implementado |
| Elevation of privilege | Workflow con permisos excesivos | GitHub Actions | `permissions` mínimos por workflow | Implementado |

## E1 — Identidad y vinculación

| Categoría | Amenaza | Componente | Control | Estado |
|---|---|---|---|---|
| Spoofing | Un tercero se registra como guardián de un menor ajeno | Alta de protegido | Validación de matrícula por `personal_institucion` del colegio (E1-03) | Verificado (pgTAP) |
| Spoofing | Fuerza bruta sobre el PIN del protegido | Edge Function `auth-pin` | Argon2id + bloqueo de 15 min tras 5 fallos por menor + 20 fallos por IP cada 15 min (SEC-01) + mensaje genérico | Verificado (Deno y pgTAP) |
| Tampering | El cliente se asigna un rol superior | Supabase Auth | Rol en `app_metadata` (solo escribe el servidor) | Implementado |
| Repudiation | El acudiente niega haber dado el consentimiento | `consentimientos` | Tabla append-only con versión, actor y timestamp de servidor | Verificado (pgTAP) |
| Information disclosure | Lectura de protegidos de otro colegio o guardián | `protegidos` | RLS por guardián y por `personal_institucion.colegio_id` | Verificado (pgTAP) |
| Information disclosure | Robo de la sesión en el teléfono | App | Sesión en `expo-secure-store`; el PIN nunca se guarda en el dispositivo | Verificado (Jest) y probado en Android físico (05/10/2026) |
| Denial of service | Registro masivo de cuentas | Supabase Auth | Rate limiting de Auth y confirmación de correo | Implementado; PENDIENTE: confirmar "Confirm email" en dev y staging |
| Elevation of privilege | Un guardián activa a su propio protegido | `protegidos.estado` | Solo `personal_institucion` activo puede pasar a `ACTIVO` (RLS) | Verificado (pgTAP) |
| Elevation of privilege | Un usuario se asigna el rol admin o crea personal institucional | Edge Function `admin-personal`, `colegios` | Rol en `app_metadata` solo escribible por el servidor; la función verifica `rol = admin` antes de usar la API de administración | Verificado (Deno) |
| Spoofing | Alguien entra como un menor con el documento de otro | Edge Function `auth-pin` | Documento + PIN que solo conoce el menor; el acudiente lo entrega en persona; el PIN generado en el servidor excluye PIN débiles | Verificado (Deno) |
| Elevation of privilege | El personal institucional conserva la contraseña temporal que conoce el administrador | `admin-personal`, RLS | Marca `debe_cambiar_contrasena`: sin acceso a menores hasta cambiar la contraseña en el primer ingreso (SEC-03) | Verificado (pgTAP y Jest) |
| Information disclosure | El administrador consulta datos de menores | `protegidos` | Sin políticas RLS para `admin` sobre `protegidos` ni `consentimientos` | Verificado (pgTAP) |
| Repudiation | Un administrador niega haber creado o desactivado personal | `audit_log` | Toda acción del administrador se registra | Verificado (Deno) |

## E2 — Red de apoyo (E2-01)

STRIDE ampliado en el refinement del Sprint 02 (05/10/2026). Los controles marcados con (D8) dependen de las decisiones pendientes de [`docs/scrum/sprint-02/refinement.md`](../scrum/sprint-02/refinement.md).

| Categoría | Amenaza | Componente | Control | Estado |
|---|---|---|---|---|
| Spoofing | Reutilización o adivinación del enlace de invitación | Invitaciones | Token aleatorio de al menos 128 bits, guardado solo como hash, de un solo uso y con vencimiento (D8) | Implementado (E2-01, 12/10/2026) |
| Spoofing | Un tercero que recibe el enlace reenviado lo acepta en lugar del contacto | Invitaciones | Aceptar exige iniciar sesión; el guardián ve quién aceptó cada invitación. La revocación (E2-03) es de la fase 2: riesgo residual hasta entonces. Esquema propio `nexasafe://` capturable por otra app: SEC-06, riesgo aceptado (15/10/2026) | Implementado (E2-01, 12/10/2026) |
| Tampering | Un contacto de apoyo modifica rutas, trayectos o datos del menor | `rutas`, `trayectos`, `protegidos` | El rol `apoyo` no tiene políticas de escritura (RLS) | Implementado (E2-01, 12/10/2026) |
| Repudiation | El guardián niega haber invitado a un contacto, o el contacto niega haber aceptado | `audit_log` | Creación y aceptación de invitaciones registradas | Implementado (E2-01, 12/10/2026) |
| Information disclosure | Enumeración de usuarios por el endpoint de invitación | Invitaciones | Respuestas genéricas + rate limiting | Implementado (E2-01, 12/10/2026) |
| Information disclosure | El contacto de apoyo ve la rutina del menor | `rutas`, `trayectos` | Sin E2-02 (fase 2), el contacto ve solo alertas: mínimo privilegio por defecto (D8) | Implementado (E2-01, 12/10/2026) |
| Denial of service | Creación masiva de invitaciones | Invitaciones | Límite de invitaciones por guardián y por hora | Implementado (E2-01, 12/10/2026) |
| Elevation of privilege | Un contacto de apoyo accede a funciones de guardián | RBAC | Rol `apoyo` verificado en el servidor; pruebas de autorización en CI | Implementado (E2-01, 12/10/2026) |

## E3/E4 — Rutas y trayecto acompañado

STRIDE ampliado en el refinement del Sprint 02 (05/10/2026) para E3-01, E3-02, E3-03, E4-01 y E4-04, y en el refinement del Sprint 03 (15/10/2026) para E4-02 y E4-03 (decisiones D18–D21 aprobadas el 15/10/2026 en [`docs/scrum/sprint-03/refinement.md`](../scrum/sprint-03/refinement.md)).

| Categoría | Amenaza | Componente | Control | Estado |
|---|---|---|---|---|
| Spoofing | Alguien inicia un trayecto haciéndose pasar por el menor | `trayectos` (E4-01) | Solo una sesión con rol `protegido` inicia su propio trayecto; RLS por `protegidos.usuario_id` | Implementado (E4-01, 12/10/2026) |
| Tampering | GPS falso para simular la llegada | Geocerca (E4-03) | Validación de plausibilidad en el servidor; detección de mock location en release | Planificado |
| Tampering | Un tercero o el propio menor cambia la ruta o el corredor | `rutas` (E3-01, E3-02) | Solo el guardián del menor escribe en `rutas`; cambios auditados | Implementado (E3-01a, 12/10/2026): sin acceso directo a la tabla; `guardar_ruta` verifica al guardián y registra `GUARDAR_RUTA` |
| Tampering | El cliente fuerza un estado inválido del trayecto | `trayectos.estado` | Cambios de estado solo por funciones con transiciones permitidas (`EN_CURSO` → `CERRADO` en la fase 1) | Parcial (E4-01, 12/10/2026): el cliente solo puede leer `trayectos` y crear con `iniciar_trayecto`; el cierre llega con E4-03 |
| Tampering | Alteración de la ruta guardada en el teléfono | Caché local (E3-01) | La caché solo sirve para mostrar la ruta; el servidor es la fuente de verdad y la reemplaza al sincronizar | Implementado (E3-01b, 12/10/2026) |
| Repudiation | Disputa sobre cuándo empezó un trayecto o quién cambió la ruta | `trayectos`, `audit_log` | `inicio_en` con hora del servidor; cambios de ruta en `audit_log` | Implementado (E3-01a y E4-01, 12/10/2026) |
| Information disclosure | Fuga del histórico de rutas (rutina del menor) | `rutas`, `trayectos` | RLS estricto; ubicación solo durante trayecto o alerta (E11-04) | Parcial (12/10/2026): RLS de `trayectos` y lectura de `rutas` auditada; la ubicación llega con E4-02 |
| Information disclosure | La ruta revela la casa y el colegio del menor | `rutas`, caché local | Solo el guardián (y el menor, para su trayecto) leen la ruta; el rol `apoyo` no. Caché cifrada en el dispositivo y borrada al cerrar sesión (D11) | Implementado (E3-01b, 12/10/2026) |
| Information disclosure | El proveedor del mapa recibe las coordenadas que se ven en pantalla | Componente de mapa (E3-01) | OpenStreetMap (D9): sin cuenta ni llave; Leaflet empaquetado en la app; declarar en la PIA que el servidor de teselas recibe las zonas consultadas | Implementado (E3-01a, 12/10/2026; declarado en `docs/privacy/pia.md`) |
| Information disclosure | Ubicación recolectada fuera de un trayecto | App | Captura solo con trayecto `EN_CURSO` o alerta activa; el indicador de E4-04 es visible siempre que se comparte | Parcial (E4-04, 12/10/2026): banda visible con trayecto `EN_CURSO`; la app aún no captura ubicación (E4-02, Sprint 03) |
| Denial of service | Rutas enormes o inválidas que degradan la base de datos | `rutas.geometria` | Validación en el servidor: geometría válida (`ST_IsValid`), número de puntos y longitud máximos | Implementado (E3-01a, 12/10/2026): 2–200 puntos, `ST_IsValid`, máximo 30 km y dentro de Colombia (D15) |
| Denial of service | Varios trayectos `EN_CURSO` a la vez para el mismo menor | `trayectos` | Índice único parcial: un solo trayecto `EN_CURSO` por menor | Implementado (E4-01, 12/10/2026) |
| Elevation of privilege | El menor o un contacto de apoyo edita la configuración de su propia vigilancia | `rutas` | Sin políticas de escritura para `protegido` ni `apoyo` | Implementado (E3-01a, 12/10/2026) |
| Spoofing | Un tercero envía posiciones a nombre del menor | `posiciones` (E4-02) | Solo `registrar_posicion` escribe, con la sesión del propio menor (rol `protegido`) y su trayecto `EN_CURSO` o alerta activa (D19) | Planificado |
| Tampering | Posiciones con saltos imposibles para cerrar el trayecto a propósito | `registrar_posicion`, geocerca (E4-03) | Rechazar posiciones con velocidad implausible frente a la anterior (más de 200 km/h) y con precisión peor de 100 m; el cierre solo usa posiciones aceptadas (D21). La detección de mock location en release queda para el endurecimiento (RNF-07) | Planificado |
| Information disclosure | Un guardián de otro menor o un contacto de apoyo escucha el canal en vivo | Realtime Broadcast (E4-02) | Canal privado `trayecto:<id>` con política RLS en `realtime.messages` solo para el guardián del menor (D20) | Planificado |
| Information disclosure | Fuga de la ubicación histórica desde la base de datos | `posiciones` | Latitud y longitud cifradas con `pgcrypto` y llave en Vault (RNF-02); sin `SELECT` directo; lectura de la última posición auditada (D19) | Planificado |
| Information disclosure | La app sigue capturando después de llegar o de cancelar | App (servicio en primer plano) | La captura se detiene cuando el servidor responde que el trayecto o la alerta ya no están activos; el servidor rechaza posiciones fuera de trayecto o alerta (RF-41) | Planificado |
| Denial of service | Envío masivo de posiciones | `registrar_posicion` | Máximo 1 posición por segundo por menor; las demás se rechazan | Planificado |

## E6/E7 — Alerta de pánico y respuesta

| Categoría | Amenaza | Componente | Control | Estado |
|---|---|---|---|---|
| Spoofing | Un agresor fuerza al menor a cancelar la alerta | Ventana de PIN | Pasados 10 s la alerta no se cancela; modo discreto (E6-04) | Planificado |
| Spoofing | Alguien que no es el menor cancela la alerta | `auth-pin` acción `cancelar_alerta` (E6-03) | PIN verificado solo en el servidor con Argon2id y los límites de intentos de E1-04 (D23) | Planificado |
| Tampering | El cliente alarga la ventana de cancelación | `alertas.cancelable_hasta` | Hora del servidor; la cancelación compara con `now()` en el servidor (D22, D23) | Planificado |
| Repudiation | El menor niega haber disparado o cancelado | `audit_log` | `DISPARAR_ALERTA` y `CANCELAR_ALERTA` con actor y hora del servidor; la bitácora `eventos_incidente` llega con E9-01 (D24) | Planificado |
| Repudiation | Un guardián niega haber recibido la alerta | `eventos_incidente` | Bitácora append-only con acuse y timestamp de servidor (E9-01) | Planificado |
| Denial of service | Inundación de alertas falsas | Endpoint de alerta | Rate limiting por usuario (máximo 3 alertas por menor cada 10 min, D22) + cierre clasificado (E9-02) | Planificado |

## E8/E9 — Vista institucional y bitácora

| Categoría | Amenaza | Componente | Control | Estado |
|---|---|---|---|---|
| Tampering | Modificación de eventos de un incidente | `eventos_incidente` | Sin UPDATE ni DELETE en RLS | Planificado |
| Information disclosure | El puesto de control ve alertas de otro colegio | Vista institucional | RLS por `colegio_id` | Planificado |
| Repudiation | Acceso a datos de un menor sin rastro | `audit_log` | Registro de actor, acción y timestamp | Planificado |
