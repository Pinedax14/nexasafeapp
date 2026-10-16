# Evaluación de impacto en privacidad (PIA) — NexaSafe

**Versión:** 0.1 (borrador) · **Fecha:** 03/10/2026 · **Alcance:** Sprint 01 (épicas E1 y E11)
**Responsable de la evaluación:** Juan Felipe Pineda Cardona (Security Champion, Sprints 00–01)
**Revisión siguiente:** cada vez que una historia nueva toque datos de menores o ubicación (Plan, sección 12). Próxima: Sprint 02 (rutas y trayectos).

> Proyecto académico. Durante el semestre solo se usan **datos de prueba**; no se registran menores reales. Un despliegue con personas reales exige antes la inscripción en el Registro Nacional de Bases de Datos (SIC) y la revisión legal de esta evaluación.

## 1. Datos personales que trata el Sprint 01

| Dato | Titular | Sensible | Dónde se guarda | Finalidad |
|---|---|---|---|---|
| Nombre, correo y contraseña del acudiente | Acudiente | No | Supabase Auth (contraseña con hash del proveedor) y `guardianes` | Identificar al acudiente y permitirle administrar al menor |
| Nombre del menor | Menor | Sí (dato de menor, C-748/2011) | `protegidos.nombre` | Identificar al menor ante su acudiente y su colegio |
| Documento de identidad del menor | Menor | Sí | `protegidos.documento_cifrado`, cifrado por columna | Permitir al colegio verificar la matrícula (RF-03) |
| Foto del menor | Menor | Sí | Bucket privado de Storage | Que el colegio y la red de apoyo reconozcan al menor |
| Colegio del menor | Menor | Sí | `protegidos.colegio_id` | Enviar la validación al colegio correcto |
| PIN del menor | Menor | Sí | Solo su hash Argon2id en `protegidos.pin_hash` | Autenticar al menor sin contraseña (RF-04) |
| Huella del documento del menor | Menor | Sí | `protegidos.documento_huella` (HMAC-SHA256 con llave en Vault, no reversible sin la llave) | Encontrar al menor cuando ingresa con documento y PIN sin descifrar documentos (RF-04) |
| Huella de la IP de ingresos con PIN fallidos | Quien intenta entrar | No | `private.intentos_pin_ip` (HMAC con llave en Vault), máximo 1 día | Frenar ataques de fuerza bruta al PIN (SEC-01) |
| Cuenta de acceso del menor | Menor | No | Supabase Auth, con un correo sintético `@example.org` que no identifica al menor | Darle al menor una sesión con rol `protegido` |
| Consentimiento (versión, fecha, actor) | Acudiente | No | `consentimientos`, append-only | Probar la autorización previa del representante legal (RF-38) |
| Registro de accesos (actor, acción, fecha) | Acudiente / personal | No | `audit_log`, sin valores de columnas | Trazabilidad de todo acceso a datos del menor |
| Nombre, cargo y correo del personal institucional | Personal del colegio | No | Supabase Auth y `personal_institucion` | Que el administrador (E1-06) habilite a quien valida matrículas |
| Rutas casa–colegio del menor (Sprint 02) | Menor | Sí: revela dónde vive y estudia | `rutas` (sin cifrado por columna, D13), con RLS y lectura auditada; copia cifrada en el teléfono con `expo-secure-store` que se borra al cerrar sesión (E3-01b, D11) | Acompañar el trayecto del menor (RF-09) |
| Zonas del mapa consultadas (Sprint 02) | Acudiente | No | No se guardan: el servidor de teselas de OpenStreetMap recibe la zona y el zoom que se ven en pantalla, con la IP del teléfono (D9) | Mostrar el mapa para dibujar la ruta |
| Inicio de cada trayecto (Sprint 02) | Menor | Sí: revela cuándo sale de casa o del colegio | `trayectos` (`inicio_en` con hora del servidor, ruta y estado), con RLS: solo el menor y su guardián; auditado con `INICIAR_TRAYECTO` | Acompañar el trayecto (RF-12). Sin ubicación: la posición en vivo llega con E4-02 (Sprint 03) |
| Ubicación del menor (Sprint 03) | Menor | Sí: revela dónde está en tiempo real | `posiciones`, con latitud y longitud cifradas por columna (`pgcrypto`, llave en Vault, RNF-02, D19); solo se guarda con un trayecto `EN_CURSO` o una alerta activa (RF-41); nadie la lee directamente: el guardián ve la última con una lectura auditada y la recibe en vivo por un canal privado de Realtime (D20). En el teléfono se captura con el servicio en primer plano de Android y su notificación fija, cada 15 s o 20 m en el trayecto y cada 5 s en una alerta (D18). Retención: 90 días con purga automática en la fase 2 (RF-39) | Acompañar el trayecto (RF-13), cerrarlo al llegar (RF-14) y dar trazabilidad a una alerta (RF-24) |
| Alertas del menor (Sprint 03) | Menor | Sí | `alertas` (tipo, estado, hora del servidor y trayecto si lo hay), con RLS: solo el menor y su guardián; disparo y cancelación auditados | Pedir ayuda con el botón de pánico (RF-20) y cancelarla con el PIN (RF-22) |
| Bitácora del incidente (Sprint 04) | Menor y quienes responden | Sí | `eventos_incidente` append-only (sin modificar ni borrar), con actor y hora del servidor; la leen solo quienes ven la alerta y cada lectura queda en `audit_log` (D27) | Dejar constancia auditable de cada alerta (RF-32) |
| Token push del teléfono (Sprint 04) | Guardián, contacto de apoyo y personal del colegio | No | `dispositivos_push` (token de Expo, sin acceso directo); se borra al cerrar sesión; Expo y Firebase Cloud Messaging lo reciben para entregar el aviso (D25) | Avisar la alerta con sonido prioritario (RF-26) |
| Acceso del colegio y del contacto de apoyo a la alerta (Sprint 04) | Menor | Sí | Ven la alerta y la última posición solo mientras está activa, nunca el trayecto diario (D26, RF-41); el gráfico del colegio muestra solo conteos sin nombres | Atender la alerta desde el puesto de control (RF-29) y la red de apoyo (D8) |
| Nombre y correo del contacto de apoyo (Sprint 02) | Contacto de apoyo | No | Supabase Auth (rol `apoyo`) y `contactos_apoyo` (nombre, menor, fecha de aceptación); la invitación guarda solo el hash del token | Que el guardián sepa quién recibirá las alertas del menor (RF-06). Antes de aceptar, el contacto solo ve el primer nombre del menor (D17) |

**No se recolecta en este sprint:** ubicación, fecha de nacimiento, dirección ni teléfono (decisión D6). La ubicación empieza en el Sprint 02 y solo durante trayectos o alertas (RF-41).

## 2. Base legal

- **Ley 1581 de 2012 y Decreto 1377 de 2013:** autorización previa, expresa e informada del representante legal (E11-01, RNF-20) y política de tratamiento publicada (`politica-tratamiento.md`, RNF-21).
- **Sentencia C-748 de 2011:** los datos de menores solo se tratan si responden a su interés superior. La finalidad única es su protección en el trayecto casa–colegio (RNF-22).

## 3. Flujo de datos del Sprint 01

```
Acudiente ──registro──► Supabase Auth ──trigger──► guardianes
    │
    └─ acepta política ─► registrar_protegido() ─► protegidos (PENDIENTE_VALIDACION)
                                │                 + consentimientos (OTORGADO)
                                └──────────────► audit_log
Personal del colegio ─► validar_protegido() ─► protegidos (ACTIVO) + audit_log
Acudiente ─► auth-pin (asignar) ─► protegidos.pin_hash + cuenta Auth del menor + audit_log
Protegido ─► documento + PIN ─► auth-pin (ingresar) ─► huella ─► verificación Argon2id ─► sesión + audit_log
```

## 4. Riesgos y controles

| Riesgo | Prob. | Impacto | Control | Riesgo residual |
|---|---|---|---|---|
| Un tercero da de alta a un menor que no le corresponde | Media | Alto | Validación de matrícula por personal activo del colegio (E1-03) | Bajo |
| Un guardián o colegio ve menores ajenos | Baja | Crítico | RLS por `guardian_id` y por colegio, con pruebas de política en el CI | Bajo |
| Filtración del documento del menor | Baja | Crítico | Cifrado por columna con llave en Supabase Vault; nunca en logs | Bajo |
| Filtración de la foto | Baja | Alto | Bucket privado con políticas por guardián y colegio; URL firmadas de corta duración | Medio |
| Fuerza bruta sobre el PIN | Media | Alto | Argon2id + rate limiting en `auth-pin`; el PIN no se guarda en el teléfono | Bajo |
| Robo del teléfono con sesión abierta | Media | Medio | Sesión en `expo-secure-store`; JWT de 15 min y refresh token rotativo | Medio |
| Repudio del consentimiento | Baja | Medio | `consentimientos` append-only con timestamp del servidor | Bajo |
| Datos personales en logs o capturas del CI | Media | Alto | Regla Semgrep contra `console.*` en la app; `audit_log` sin valores | Bajo |
| El administrador accede a datos de menores | Baja | Crítico | El rol `admin` no tiene políticas sobre `protegidos` ni `consentimientos`; sus acciones quedan en `audit_log` | Bajo |
| Las teselas del mapa revelan a OpenStreetMap la zona de la casa y el colegio | Media | Medio | Solo se piden teselas al editar o ver la ruta; no se envían datos del menor ni coordenadas exactas, solo la zona visible; Leaflet empaquetado en la app, sin CDN (D9) | Bajo |
| Seguimiento de la ubicación fuera del trayecto o la alerta | Baja | Crítico | El servidor rechaza posiciones sin trayecto ni alerta activos y la app deja de capturar cuando el servidor lo indica, al llegar y al cerrar sesión (RF-41); la notificación fija de Android muestra cuándo se comparte | Bajo |
| Fuga del historial de ubicaciones | Baja | Crítico | Cifrado por columna con llave en Vault; sin lectura directa; lectura de la última posición auditada | Bajo |
| Un tercero escucha la ubicación en vivo | Baja | Crítico | Canal privado de Realtime autorizado por RLS solo para el guardián del menor (D20) | Bajo |
| El contenido del push revela datos del menor en la pantalla bloqueada | Media | Medio | Solo el primer nombre y "pidió ayuda", sin ubicación; canal con visibilidad privada en la pantalla de bloqueo | Bajo |
| Un agresor nota en el teléfono del menor que se pidió ayuda | Media | Alto | Modo discreto tras la ventana de 10 s y notificación fija con texto neutro (D30) | Medio |
| Toma de una cuenta de administrador | Baja | Crítico | Un solo administrador creado desde el panel; contraseña robusta; revisión de `audit_log` en cada Security Review | Medio |

## 5. Acciones pendientes

- [x] Aprobar las decisiones D1–D7 de `docs/architecture/modelo-datos-e1.md` (03/10/2026; D3 crea el rol administrador).
- [ ] Verificar con pruebas de política que cada control de RLS de la sección 4 funciona (DoD del Sprint 01).
- [ ] PENDIENTE: definir el canal de contacto para peticiones de habeas data (ver `politica-tratamiento.md`).
- [x] Declarar el servidor de teselas de OpenStreetMap y las rutas del menor (09/10/2026, E3-01a).
- [x] Actualizar esta evaluación para incluir la ubicación en vivo y las alertas (15/10/2026, Sprint 03).
- [x] Incluir la bitácora, los tokens push (Expo y Firebase como encargados) y el acceso del colegio y del contacto de apoyo a las alertas (16/10/2026, Sprint 04).
