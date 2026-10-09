# Sprint 01 — Review

**Fecha de la review:** 08/10/2026 (planificada para el 17/10/2026). Documento escrito el 09/10/2026.
**Sprint Goal:** un acudiente puede registrarse, dar de alta a un menor y el colegio validarlo.
**Sprint Goal cumplido:** Sí. Hito H2 (alta de usuario funcionando en un dispositivo real) cumplido el 05/10/2026 con el APK de prueba en un Android físico.

| Historia | Pts | Estado | Feedback del PO |
|---|---|---|---|
| E1-01 Registro de acudiente con correo y contraseña | 3 | Aceptada | "Todo estaba perfecto" (aplica a todo el incremento) |
| E1-02 Alta de menor y vinculación como guardián | 5 | Aceptada | Ídem |
| E1-03 Validación de matrícula por el colegio | 5 | Aceptada | Ídem |
| E1-04 Ingreso del protegido con PIN corto | 3 | Aceptada | Ídem |
| E1-05 Sesión cifrada en el dispositivo | 3 | Aceptada | Ídem |
| E11-01 Consentimiento explícito y verificable del acudiente | 5 | Aceptada | Ídem |
| E1-06 Administrador: crear colegios y registrar su personal institucional | 5 | Aceptada | Ídem |

**Velocidad:** 29 pts completados de 29 comprometidos.

## Qué se revisó

El docente (PO) revisó la app, el avance del proyecto y la estructura del repositorio, y aceptó las 7 historias. No pidió cambios.

Incremento disponible en `main` (PR #21 a #31):

- Registro e ingreso del acudiente, con la política de tratamiento y el consentimiento.
- Alta del menor con foto, que queda en `PENDIENTE_VALIDACION`.
- Validación del menor por el personal del colegio, que lo pasa a `ACTIVO`.
- Ingreso del menor con documento y PIN de 4 dígitos, verificado en la Edge Function `auth-pin`.
- Rol administrador: crear colegios y registrar el personal institucional.
- Sesión guardada con `expo-secure-store`.

## Estado de seguridad

- **Hallazgos Critical/High abiertos sin excepción:** 0.
- **Excepciones vigentes:** EX-001 (`image-size`), EX-002 (`node-forge`) y EX-003 (`braces`), renovadas hasta el 31/10/2026.
- **Security Review (05/10/2026):** SEC-01 (límite de PIN por IP) y SEC-03 (cambio obligatorio de la contraseña temporal) corregidos en el PR #31; SEC-02 y SEC-04 aceptados como riesgo bajo.
- **Corregido el 08/10/2026:** `shell-quote` forzado a 1.12.0 (GHSA-pqg4-j6r4-53mv, Critical), detectado por el gate de SCA del CI (PR #35).

## Desviaciones frente a la Definition of Done

- **Prueba E2E con Maestro:** no se hizo. El flujo se verificó a mano con el APK de prueba en un Android físico prestado (05/10/2026). El PO no hizo observaciones sobre este punto.
- **PR aprobado por un compañero:** no se cumplió. `main` sigue con 0 aprobaciones obligatorias por disponibilidad del equipo; los controles automáticos sí fueron obligatorios en todos los PR.
- **Fechas:** el sprint estaba planificado del 06/10 al 17/10. Las historias se integraron entre el 03/10 y el 05/10, y la review se hizo el 08/10.

## Trabajo no planificado (sin estimación en puntos)

- E1-04 resultó más grande de lo estimado (3 pts): Edge Function `auth-pin`, migración de la huella del documento, pantalla del acudiente para asignar el PIN y botón de PIN aleatorio generado en el servidor (PR #29).
- Corrección de SEC-01 y SEC-03 (PR #31).
- Corrección de `shell-quote` (PR #35).
- Historias E1-07 (Google) y E1-08 (huella del celular) agregadas al backlog, fuera del roadmap.
