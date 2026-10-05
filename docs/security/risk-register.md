# Registro de riesgos — NexaSafe

Última actualización: Security Review del Sprint 01 (05/10/2026)

Fuente: Plan de Desarrollo v1.1, capítulo 8 (`PLAN_NEXASAFE.md` v1.2, sección 15).

| ID | Riesgo | Prob. | Impacto | Respuesta | Estado | Responsable | Última revisión |
|---|---|---|---|---|---|---|---|
| R1 | Ubicación en 2º plano detenida por optimización de batería (Xiaomi, Huawei) | Alta | Alto | Investigación en Sprint 2, antes de E4-02; foreground service + guía de exclusión | Abierto | PENDIENTE: asignar | Sprint 00 |
| R2 | Falsas alarmas erosionan la confianza | Media | Alto | Corredor configurable + PIN; sin sanción por falsa alarma | Abierto | PENDIENTE: asignar | Sprint 00 |
| R3 | Colegio sin responsable del puesto de control | Media | Alto | Tabla `personal_institucion` (varios responsables por colegio); flujo que funcione solo con la red de apoyo | Abierto | PENDIENTE: asignar | Sprint 00 |
| R4 | Fuga de datos de menores | Baja | Crítico | Cifrado, RLS, minimización, auditoría; pentest en fase 2. Sprint 01: RLS en las tablas de E1 y en el bucket de fotos con pruebas pgTAP, documento cifrado con llave en Vault, PIN con Argon2id, `audit_log` en cada lectura del detalle del menor y sin políticas para `admin` | Abierto | Juan Felipe Pineda Cardona (Security Champion) | Sprint 01 |
| R5 | WhatsApp limitado a 5 destinatarios | Alta | Medio | Push como canal principal; WhatsApp pasa a fase 2 | Mitigado | PENDIENTE: asignar | Sprint 00 |
| R6 | Alcance excesivo (Sprint 4 = 32 pts) | Alta | Alto | MoSCoW + revisión de alcance en H3; recalibrar con la velocidad del Sprint 1. Sprint 01: las 7 historias (29 pts) ya están integradas en `main`; la velocidad oficial se fija en la review | Abierto | PENDIENTE: asignar | Sprint 01 |
| R7 | Baja disponibilidad de un integrante | Media | Medio | Propiedad colectiva del código y documentación en el repo | Materializado | PENDIENTE: asignar | Sprint 00 |
| R8 | Falsos positivos por sacudida | Alta | Medio | Aplica a la fase 2 (E6-02) | Abierto | PENDIENTE: asignar | Sprint 00 |
| R9 | Sin Android físico para probar: el hito H2 (17/10), la demo de la review, la DoD de cada historia y la prueba E2E con Maestro lo necesitan | Alta | Alto | Conseguir un Android 9+ prestado e instalar el APK de EAS (`preview`); mientras tanto se prueba en el navegador. 05/10/2026: APK `preview` (build EAS 773d8111) instalado en un Android prestado; el flujo completo funcionó según el equipo. Celular OPPO; versión de Android no registrada. Falta la prueba E2E con Maestro | Mitigado | Juan Felipe Pineda Cardona | Sprint 01 |
| R10 | Pérdida o fuga de las llaves de Vault (`documento_cifrado_key`, `documento_huella_key`) | Baja | Crítico | Llaves solo en Supabase Vault, leídas por funciones `security definer`; nunca en el repo ni en la app. Sin las llaves los documentos no se pueden descifrar: definir un respaldo antes del piloto | Abierto | Juan Felipe Pineda Cardona (Security Champion) | Sprint 01 |
| R11 | Bloqueo del PIN usado contra el menor: quien conozca su documento puede fallar 5 veces y bloquear su ingreso 15 minutos | Media | Medio | El bloqueo solo afecta un ingreso nuevo (la sesión guardada sigue activa); seguimiento en SEC-02 | Abierto | Juan Felipe Pineda Cardona (Security Champion) | Sprint 01 |

## Historial de cambios

| Sprint | Cambio |
|---|---|
| 00 | Registro creado con R1–R8 del Plan. R3 suma `personal_institucion` (decisión G); R5 queda mitigado porque WhatsApp pasa a fase 2; R6 refleja el Sprint 4 de 32 pts. |
| 00 | Decisión del 03/10/2026: caché (E3-01) y gráfico interactivo (E8-01) se agregan sin reestimar; aumenta la exposición de R6. Reestimar ambas historias en su refinement. |
| 00 | R7 materializado: el trabajo del Sprint 00 lo ejecutó un integrante y los PR se integraron sin aprobación de par. Recalibrar la velocidad al cierre del Sprint 01. Nuevo control: Access Token de Supabase con permisos mínimos (solo staging, escritura en Migrations y Edge Functions) tras la exposición del token anterior. |
| 01 | Decisión D3 (03/10/2026): nueva historia E1-06 (5 pts) en el Sprint 01, que sube a 29 pts con un solo integrante; aumenta la exposición de R6. |
| 01 | Security Review (05/10/2026): R4 actualizado con los controles construidos; nuevos R9 (sin Android físico), R10 (llaves de Vault) y R11 (bloqueo del PIN como denegación de servicio). Excepciones EX-001 a EX-003 renovadas hasta el 31/10/2026. Hallazgos SEC-01 a SEC-04. |
| 01 | 05/10/2026: R9 mitigado con la prueba del APK en un Android físico (hito H2). |

## Hallazgos de la Security Review del Sprint 01 (05/10/2026)

Fuentes: pipeline de `main` en verde (CI con Gitleaks, Semgrep, `npm audit` y pgTAP; CodeQL; deploy a staging), `npm audit` local, Gitleaks local sobre el historial y revisión del código de E1.

| ID | Hallazgo | Severidad | Acción propuesta | Issue |
|---|---|---|---|---|
| SEC-01 | `auth-pin` limita los intentos por menor (5 fallos → 15 min) pero no por IP, como pedía el modelo de amenazas: se pueden probar PIN contra muchos documentos | Medium | Límite de intentos por IP en `auth-pin` | PENDIENTE: crear issue `security` |
| SEC-02 | El bloqueo por menor permite bloquear a propósito el ingreso de un menor cuyo documento se conozca (R11) | Low | Evaluar junto con SEC-01; avisar al acudiente del bloqueo | PENDIENTE: crear issue `security` |
| SEC-03 | El personal institucional entra con la contraseña temporal que le dio el administrador y la app no le pide cambiarla | Medium | Obligar el cambio de contraseña en el primer ingreso | PENDIENTE: crear issue `security` |
| SEC-04 | `npm audit` reporta 11 hallazgos Moderate (`uuid` < 11.1.1, `xcode` y paquetes de configuración de Expo) sin corrección compatible con Expo SDK 54 | Low | Revisar en cada Security Review y al actualizar la SDK de Expo | PENDIENTE: crear issue `security` |

**Pendientes de verificación (requieren la sesión del Security Champion):**

- PENDIENTE: revisar la pestaña **Security** de GitHub (alertas de CodeQL y Dependabot).
- PENDIENTE: confirmar en Supabase (dev y staging) que **Confirm email** está activo, control del modelo de amenazas contra el registro masivo de cuentas.
