# Sprint 01 — Planning

**Fechas:** 06/10 – 17/10/2026 (planning preparado el 03/10/2026)
**Sprint Goal:** un acudiente puede registrarse, dar de alta a un menor y el colegio validarlo.
**Hito asociado:** H2 (17/10) — alta de usuario funcionando en un dispositivo real.
**Capacidad comprometida:** 24 pts · **Security Champion (Sprints 00–01):** Juan Felipe Pineda Cardona

| Historia | Descripción | Responsable | Pts |
|---|---|---|---|
| E1-01 | Registro de acudiente con correo y contraseña | Rol Móvil — Juan Felipe Pineda Cardona | 3 |
| E1-02 | Alta de menor y vinculación como guardián | Rol Móvil + Backend/Datos — Juan Felipe Pineda Cardona | 5 |
| E1-03 | Validación de matrícula por el colegio | Rol Backend/Datos — Juan Felipe Pineda Cardona | 5 |
| E1-04 | Ingreso del protegido con PIN corto | Rol Móvil — Juan Felipe Pineda Cardona | 3 |
| E1-05 | Sesión cifrada en el dispositivo | Rol Móvil — Juan Felipe Pineda Cardona | 3 |
| E11-01 | Consentimiento explícito y verificable del acudiente | Rol Backend/Datos + Móvil (UI) — Juan Felipe Pineda Cardona | 5 |

**Orden de trabajo propuesto:** E11-01 y el esquema base → E1-01 → E1-05 → E1-02 → E1-03 → E1-04. El consentimiento y las tablas son prerrequisito del alta; la sesión cifrada lo es de las demás pantallas.

## Antes de programar (obligatorio: este sprint toca datos de menores)

- [x] Evaluación de impacto en privacidad: [`docs/privacy/pia.md`](../../privacy/pia.md) (borrador).
- [x] Política de tratamiento de datos: [`docs/privacy/politica-tratamiento.md`](../../privacy/politica-tratamiento.md) (borrador).
- [ ] Esquema de la épica E1 aprobado: [`docs/architecture/modelo-datos-e1.md`](../../architecture/modelo-datos-e1.md) — PENDIENTE: aprobación del equipo.
- [ ] Migración con `colegios`, `personal_institucion`, `guardianes`, `protegidos`, `consentimientos` y `audit_log`, con RLS y pruebas de política en todas.

## Criterios de aceptación (Gherkin)

### E1-01 · Registro de acudiente (RF-01)
```gherkin
Dado que no tengo cuenta
Cuando me registro con nombre, correo válido y una contraseña que cumple la longitud mínima (propuesta: 8 caracteres, decisión D7)
Entonces se crea mi cuenta con el rol guardian
Y puedo iniciar sesión con ese correo y contraseña

Dado que ya existe una cuenta con mi correo
Cuando intento registrarme con ese correo
Entonces la app muestra un mensaje genérico que no revela si el correo existe
```

### E1-02 · Alta del menor (RF-02, RF-38)
```gherkin
Dado que soy un acudiente autenticado
Cuando registro un menor con nombre, documento, foto y colegio
Entonces el perfil queda en estado PENDIENTE_VALIDACION
Y no puede iniciar trayectos hasta que el colegio lo apruebe
Y queda registrada la autorización de tratamiento de datos del representante legal

Dado que soy un acudiente autenticado
Cuando consulto mis menores
Entonces solo veo los menores vinculados a mi cuenta
```

### E1-03 · Validación por el colegio (RF-03)
```gherkin
Dado que soy personal activo del colegio X
Cuando consulto los menores pendientes
Entonces solo veo los menores en PENDIENTE_VALIDACION del colegio X

Dado que soy personal activo del colegio X
Cuando valido la matrícula de un menor del colegio X
Entonces el menor pasa a ACTIVO
Y queda registrado en audit_log quién lo validó y cuándo

Dado que soy un acudiente o personal de otro colegio
Cuando intento cambiar el estado de un menor del colegio X
Entonces la operación es rechazada
```

### E1-04 · Ingreso del protegido con PIN (RF-04)
```gherkin
Dado que soy un protegido en estado ACTIVO con PIN asignado
Cuando ingreso mi PIN correcto
Entonces inicio sesión con el rol protegido

Dado que soy un protegido
Cuando ingreso un PIN incorrecto varias veces seguidas (propuesta: 5 intentos en 15 minutos, decisión D7)
Entonces la Edge Function auth-pin bloquea temporalmente los intentos (rate limiting)

Dado que soy un protegido en estado PENDIENTE_VALIDACION o INACTIVO
Cuando ingreso mi PIN
Entonces no puedo iniciar sesión
```

### E1-05 · Sesión cifrada (RF-05, RNF-03)
```gherkin
Dado que inicié sesión
Cuando cierro y vuelvo a abrir la app
Entonces sigo autenticado sin volver a ingresar credenciales
Y la sesión está guardada en expo-secure-store, no en AsyncStorage

Dado que mi token de acceso vence a los 15 minutos
Cuando sigo usando la app
Entonces la sesión se renueva con el refresh token rotativo sin intervención

Dado que cierro sesión
Cuando vuelvo a abrir la app
Entonces se me pide autenticarme de nuevo
```

### E11-01 · Consentimiento (RF-38, RNF-20)
```gherkin
Dado que voy a registrar a un menor
Cuando no he aceptado la política de tratamiento vigente
Entonces no puedo completar el alta

Dado que acepto la política de tratamiento
Cuando completo el alta del menor
Entonces queda un registro con la versión de la política, mi identidad y la fecha del servidor
Y ese registro no se puede modificar ni borrar
```

## Riesgos del sprint

- **R6 / R7:** 24 pts comprometidos con la velocidad de un solo integrante (Sprint 00: 18 pts en un día, con trabajo no planificado). Recalibrar la velocidad al cierre.
- **R4:** primer sprint con datos personales de menores. Toda tabla nace con RLS y prueba de política; ningún dato personal en logs.
- **Dependencia externa:** no hay historia para crear colegios ni personal institucional. Ver la decisión D3 en `modelo-datos-e1.md`.

## Tablero

PENDIENTE: crear los issues de estas 6 historias con las etiquetas `sprint:01`, `epic:E1` / `epic:E11` y `security` (requiere GitHub CLI: `winget install GitHub.cli` y `gh auth login`).
