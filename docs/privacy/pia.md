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
| Cuenta de acceso del menor | Menor | No | Supabase Auth, con un correo sintético `@example.org` que no identifica al menor | Darle al menor una sesión con rol `protegido` |
| Consentimiento (versión, fecha, actor) | Acudiente | No | `consentimientos`, append-only | Probar la autorización previa del representante legal (RF-38) |
| Registro de accesos (actor, acción, fecha) | Acudiente / personal | No | `audit_log`, sin valores de columnas | Trazabilidad de todo acceso a datos del menor |
| Nombre, cargo y correo del personal institucional | Personal del colegio | No | Supabase Auth y `personal_institucion` | Que el administrador (E1-06) habilite a quien valida matrículas |

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
| Toma de una cuenta de administrador | Baja | Crítico | Un solo administrador creado desde el panel; contraseña robusta; revisión de `audit_log` en cada Security Review | Medio |

## 5. Acciones pendientes

- [x] Aprobar las decisiones D1–D7 de `docs/architecture/modelo-datos-e1.md` (03/10/2026; D3 crea el rol administrador).
- [ ] Verificar con pruebas de política que cada control de RLS de la sección 4 funciona (DoD del Sprint 01).
- [ ] PENDIENTE: definir el canal de contacto para peticiones de habeas data (ver `politica-tratamiento.md`).
- [ ] Actualizar esta evaluación en el Sprint 02 para incluir la ubicación.
