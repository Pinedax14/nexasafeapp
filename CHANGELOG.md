# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Una sección por sprint.

## [Sin publicar] — Sprint 02

### Agregado
- E3-01a, E3-02 y E3-03 Rutas del menor: el guardián abre "Rutas ›" en un menor activo, ve sus 2 rutas (ida y regreso, D12) y dibuja cada una tocando el mapa de OpenStreetMap (Leaflet empaquetado en un WebView, D9), con corredor de 25 a 200 m en pasos de 25 (D10), duración esperada de 5 a 120 min y los límites de D15 validados en la app y en el servidor. Dependencias nuevas: `react-native-webview` 13.15.0 y `leaflet` 1.9.4. 47 pruebas Jest nuevas.
- Tipos de TypeScript regenerados con `rutas`, `trayectos`, `contactos_apoyo` y sus funciones (migración aplicada en dev el 09/10/2026).
- Migración `sprint_02_rutas_trayectos_contactos`: PostGIS; tablas `rutas`, `trayectos` y `contactos_apoyo` con RLS; funciones `guardar_ruta` (D10, D12, D15), `obtener_rutas` (auditada), `iniciar_trayecto` (un solo trayecto `EN_CURSO`), `crear_invitacion` (token de un solo uso, 72 h, 10 por hora), `ver_invitacion` (D17) y `aceptar_invitacion`; el registro con invitación crea la cuenta con rol `apoyo` (D8). 46 pruebas pgTAP.
- Propuesta del modelo de datos del Sprint 02 (`docs/architecture/modelo-datos-sprint-02.md`): `rutas`, `trayectos` y `contactos_apoyo` con PostGIS, funciones, políticas RLS y decisiones D14–D17 para aprobar.
- Lista de pruebas manuales en Android físico del Sprint 01 (`docs/scrum/sprint-01/pruebas-android.md`), que reemplaza la E2E con Maestro mientras no se monte (decisión del 09/10/2026).

## [0.1.0] — Sprint 01 — 09/10/2026

### Agregado
- Retrospectiva y resumen del Sprint 01 (`docs/scrum/sprint-01/retro.md` y `resumen.md`) y resultados del Sprint 01 en el Informe de Pruebas.
- Regla de registro: cada ceremonia muestra la fecha planificada y la real.
- Review del Sprint 01 (`docs/scrum/sprint-01/review.md`), hecha con el PO el 08/10/2026: 7 historias aceptadas, velocidad 29 de 29 pts.
- Refinement del Sprint 02 (`docs/scrum/sprint-02/refinement.md`): estado de la DoR de E3-01, E3-02, E3-03, E4-01, E4-04 y E2-01, criterios Gherkin en borrador y decisiones pendientes D8–D13; STRIDE de E2 y E3/E4 ampliado en `threat-model.md`.
- E1-04 Botón "Generar PIN aleatorio": el acudiente puede pedir que el servidor (`auth-pin`, `generar: true`) elija un PIN con aleatoriedad criptográfica, sin PIN fáciles de adivinar; se guarda solo su hash y se muestra una sola vez para entregarlo al menor en persona. 3 pruebas Deno y 5 pruebas Jest nuevas.
- E1-04 Ingreso del menor con documento y PIN de 4 dígitos: el acudiente asigna el PIN a un menor ya validado (D5) y el menor entra desde "Soy menor: entrar con documento y PIN". Edge Function `auth-pin` (acciones `asignar` e `ingresar`): hash Argon2id, verificación solo en el servidor, mensaje genérico ante documento o PIN incorrectos, bloqueo de 15 minutos tras 5 fallos (D7), sesión de Supabase con rol `protegido` y registro `ASIGNAR_PIN`, `INGRESO_PIN` e `INGRESO_PIN_FALLIDO` en `audit_log`. Migración `e1_04_ingreso_pin`: huella HMAC-SHA256 del documento (`documento_huella`, llave en Vault) para buscar al menor sin descifrar, columnas `usuario_id`, `pin_intentos_fallidos` y `pin_bloqueado_hasta`, y política para que el protegido lea solo su fila. 11 pruebas pgTAP y 19 pruebas Deno nuevas.
- E1-03 Validación por el colegio: el personal activo ve las matrículas pendientes de su colegio, revisa nombre, documento (descifrado) y foto (URL firmada de 2 minutos) y valida al menor, que pasa a ACTIVO. Cada lectura del detalle y cada validación quedan en `audit_log`.
- E1-02 Alta del menor: pantalla "Mis menores" con su estado y formulario de registro (nombre, documento, colegio y foto); el menor queda en PENDIENTE_VALIDACION. Migración `e1_02_fotos_protegidos`: bucket privado `fotos-protegidos` con políticas por rol y `registrar_protegido` con foto en la misma transacción. 16 pruebas pgTAP nuevas.
- E11-01 (pantalla): la política de tratamiento v1.0 se muestra en la app (RNF-21) y el registro exige aceptarla; el consentimiento se guarda con la versión, el acudiente y la fecha del servidor.
- E1-06 Rol administrador: pantallas para crear colegios y registrar, activar o desactivar personal institucional; Edge Function `admin-personal` que verifica el rol `admin`, crea la cuenta con rol `institucion` y contraseña temporal, deshace el alta si falla, registra `CREAR_PERSONAL` en `audit_log` y limita a 10 altas cada 10 minutos. 19 pruebas Deno y job de CI para Edge Functions.
- E1-05 Sesión cifrada en el dispositivo: la sesión de Supabase se guarda con `expo-secure-store` (Keystore de Android), partida en trozos de menos de 2 KB; al abrir la app se restaura y, si el refresh token vence o se revoca, la app vuelve al ingreso. En web la sesión no se persiste.
- E1-01 Registro e inicio de sesión del acudiente con Supabase Auth: pantallas de registro e ingreso, validación de nombre, correo y contraseña (mínimo 8 caracteres, D7), mensaje genérico ante correos ya registrados (D2) y cierre de sesión.
- Historia E1-08 (ingreso con la huella del celular, RF-44, `Could`, valor agregado) en el backlog, fuera del roadmap: backlog 233 pts y trabajo futuro 102 pts.
- Historia E1-07 (inicio de sesión con Google, RF-43, `Should`) en el backlog, fuera del roadmap: backlog 230 pts y trabajo futuro 99 pts.
- Planning del Sprint 01 (29 pts) con criterios Gherkin de E1-01 a E1-06 y E11-01.
- Nueva historia E1-06 y requisito RF-42: rol administrador que crea colegios y personal institucional desde la app (decisión D3). Backlog 225 pts y capacidad 131 pts.
- Evaluación de impacto en privacidad (`docs/privacy/pia.md`) y política de tratamiento de datos v1.0 (`docs/privacy/politica-tratamiento.md`), en borrador.
- Migración `e1_esquema_base`: tablas `colegios`, `personal_institucion`, `guardianes`, `protegidos`, `consentimientos` y `audit_log` con RLS; rol `guardian` asignado al registrarse; funciones `registrar_protegido` (alta + consentimiento), `validar_protegido` y `obtener_protegido` (con auditoría de lectura); documento del menor cifrado con una llave en Supabase Vault.
- Tipos de TypeScript de la base de datos en `apps/mobile/src/core/api/database.types.ts`.
- 38 pruebas pgTAP de políticas RLS y un job de CI que las ejecuta sobre una base de datos efímera.
- Propuesta del modelo de datos de la épica E1 con políticas RLS (`docs/architecture/modelo-datos-e1.md`), aprobado (decisiones D1–D7).

### Seguridad
- `shell-quote` forzado a 1.12.0 con `overrides` (GHSA-pqg4-j6r4-53mv, Critical), detectado por el gate de SCA del CI el 08/10/2026.
- SEC-01 corregido: `auth-pin` cuenta los ingresos fallidos por IP (20 cada 15 minutos) en `private.intentos_pin_ip`, que guarda la huella HMAC de la IP y no la IP. 4 pruebas Deno y 8 pgTAP.
- SEC-03 corregido: el personal institucional creado por el administrador debe cambiar la contraseña temporal en su primer ingreso. Hasta hacerlo, la base de datos no le muestra ningún menor (`es_personal_activo_de`) y la app solo muestra la pantalla "Cambia tu contraseña"; un trigger quita la marca al cambiar la contraseña. 4 pruebas pgTAP y 16 Jest.
- SEC-02 y SEC-04 aceptados como riesgo bajo (ver `risk-register.md`).
- Security Review del Sprint 01 (05/10/2026): excepciones EX-001 a EX-003 renovadas hasta el 31/10/2026 (sigue sin haber corrección compatible con Expo SDK 54); riesgos R9 (sin Android físico), R10 (llaves de Vault) y R11 (bloqueo del PIN como denegación de servicio); hallazgos SEC-01 a SEC-04; estados de E0 y E1 actualizados en el modelo de amenazas.

### Eliminado
- Login de prueba del prototipo (`LocalAuthRepository` y `users.json` con contraseñas en texto plano).

## [0.0.0] — Sprint 00 — 03/10/2026

### Agregado
- E0-01 Monorepo: la app pasa a `apps/mobile/`; plantillas de PR (con la Definition of Done) e issues (historia, bug, hallazgo de seguridad).
- E0-02 Pipeline de CI (`.github/workflows/ci.yml`): `npm ci` → ESLint → Prettier → TypeScript → Jest con umbral de cobertura del 70 % → `expo export` Android.
- Primeras pruebas unitarias sobre el login del prototipo (`AuthenticateUser`, `LocalAuthRepository`), caso piloto del Informe de Pruebas.
- E0-03 Controles de seguridad en el CI: Gitleaks (secretos), Semgrep con reglas propias + CodeQL (SAST) y gate de `npm audit --audit-level=high` con excepciones que vencen (SCA); Dependabot (solo versiones menores y parches; los saltos mayores se hacen con la SDK de Expo) y hook de pre-commit.
- E0-04 Supabase inicializado (`supabase/`): migración inicial vacía, JWT de 15 min, carpeta de políticas RLS y workflow `deploy-staging.yml` que aplica migraciones y Edge Functions al hacer merge en `main`. Perfiles de EAS `development`, `preview` y `production` (`expo-dev-client` instalado).
- Registro de seguridad inicial: `threat-model.md`, `risk-register.md` y `exceptions.md`.
- Registro del Sprint 00: `planning.md`, `review.md`, `retro.md` y `resumen.md`, y resultados del sprint en `05-informe-pruebas-calidad.md`.

### Seguridad
- `postcss` forzado a 8.5.28 con `overrides` (GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849).
- Excepciones EX-001 a EX-003 (`image-size`, `node-forge`, `braces`: herramientas de build y pruebas, sin versión corregida compatible), aprobadas por el Security Champion (Juan Felipe Pineda Cardona) con vencimiento el 17/10/2026.

### Cambiado
- La app se llama NexaSafe (paquete Android `com.nexasafe.app`).
- `npm start` abre la app en modo Expo Go (`expo start --go`).
- Entregables de Ingeniería de Software I corregidos a v1.1 y `PLAN_NEXASAFE.md` a v1.2 (ver la sección 0 de la guía).
