# Registro de riesgos — NexaSafe

Última actualización: cierre de los Sprints 03 y 04 (22/10/2026)

Fuente: Plan de Desarrollo v1.1, capítulo 8 (`PLAN_NEXASAFE.md` v1.2, sección 15).

| ID | Riesgo | Prob. | Impacto | Respuesta | Estado | Responsable | Última revisión |
|---|---|---|---|---|---|---|---|
| R1 | Ubicación en 2º plano detenida por optimización de batería (Xiaomi, Huawei) | Media | Alto | Investigación en Sprint 2, antes de E4-02; foreground service + guía de exclusión. Sprint 03: probado en un OPPO Reno 11 (Android 15) el 20/10/2026, con la app en segundo plano y la pantalla apagada; la ubicación siguió llegando. Sigue sin probarse en Xiaomi/Huawei, donde la optimización de batería es más agresiva | Abierto | Juan Felipe Pineda Cardona | Sprint 03 |
| R2 | Falsas alarmas erosionan la confianza | Media | Alto | Corredor configurable + PIN; sin sanción por falsa alarma | Abierto | PENDIENTE: asignar | Sprint 00 |
| R3 | Colegio sin responsable del puesto de control | Media | Alto | Tabla `personal_institucion` (varios responsables por colegio); flujo que funcione solo con la red de apoyo | Abierto | PENDIENTE: asignar | Sprint 00 |
| R4 | Fuga de datos de menores | Baja | Crítico | Cifrado, RLS, minimización, auditoría; pentest en fase 2. Sprint 01: RLS en las tablas de E1 y en el bucket de fotos con pruebas pgTAP, documento cifrado con llave en Vault, PIN con Argon2id, `audit_log` en cada lectura del detalle del menor y sin políticas para `admin`. Sprint 02: `rutas` sin acceso directo (solo `guardar_ruta` y `obtener_rutas`, que verifican al guardián y escriben en `audit_log`), `trayectos` de solo lectura para el menor y su guardián, rol `apoyo` sin acceso a rutas ni trayectos, token de invitación guardado como hash, y caché de rutas en `expo-secure-store` borrada al cerrar sesión | Abierto | Juan Felipe Pineda Cardona (Security Champion) | Sprint 02 |
| R5 | WhatsApp limitado a 5 destinatarios | Alta | Medio | Push como canal principal; WhatsApp pasa a fase 2 | Mitigado | PENDIENTE: asignar | Sprint 00 |
| R6 | Alcance excesivo (Sprint 4 = 32 pts) | Media | Alto | MoSCoW + revisión de alcance en H3; recalibrar con la velocidad del Sprint 1. Sprint 01: 29/29 pts. Sprint 02: 26/26 pts. 15/10/2026: el equipo decidió mantener el alcance completo de los Sprints 03 (26 pts) y 04 (32 pts) con un solo integrante. 22/10/2026: ambos se cerraron completos (26/26 y 32/32 pts) y probados en Android — el riesgo no se materializó, aunque exigió concentrar todo el trabajo de ambos sprints en la misma semana | Mitigado | Juan Felipe Pineda Cardona | Sprint 04 |
| R7 | Baja disponibilidad de un integrante | Media | Medio | Propiedad colectiva del código y documentación en el repo | Materializado | PENDIENTE: asignar | Sprint 00 |
| R8 | Falsos positivos por sacudida | Alta | Medio | Aplica a la fase 2 (E6-02) | Abierto | PENDIENTE: asignar | Sprint 00 |
| R9 | Sin Android físico para probar: el hito H2 (17/10), la demo de la review, la DoD de cada historia y la prueba E2E con Maestro lo necesitan | Media | Alto | Conseguir un Android 9+ e instalar el APK de EAS (`preview`). 05/10/2026: APK `preview` (build EAS 773d8111) en un Android prestado, flujo completo OK. 15/10/2026: el Android prestado dejó de estar disponible; Sprint 02 quedó sin probar. 13/10 y 20/10/2026: con un OPPO Reno 11 (Android 15) propio se corrieron las pruebas del Sprint 02, 03 y 04 completas — todas OK. Sigue sin montarse la prueba E2E con Maestro | Mitigado | Juan Felipe Pineda Cardona | Sprint 04 |
| R10 | Pérdida o fuga de las llaves de Vault (`documento_cifrado_key`, `documento_huella_key`) | Baja | Crítico | Llaves solo en Supabase Vault, leídas por funciones `security definer`; nunca en el repo ni en la app. Sin las llaves los documentos no se pueden descifrar: definir un respaldo antes del piloto | Abierto | Juan Felipe Pineda Cardona (Security Champion) | Sprint 01 |
| R11 | Bloqueo del PIN usado contra el menor: quien conozca su documento puede fallar 5 veces y bloquear su ingreso 15 minutos | Baja | Medio | El bloqueo solo afecta un ingreso nuevo (la sesión guardada sigue activa), asignar un PIN nuevo lo levanta y el límite por IP (SEC-01) frena al atacante; riesgo aceptado (SEC-02) | Abierto | Juan Felipe Pineda Cardona (Security Champion) | Sprint 01 |

## Historial de cambios

| Sprint | Cambio |
|---|---|
| 00 | Registro creado con R1–R8 del Plan. R3 suma `personal_institucion` (decisión G); R5 queda mitigado porque WhatsApp pasa a fase 2; R6 refleja el Sprint 4 de 32 pts. |
| 00 | Decisión del 03/10/2026: caché (E3-01) y gráfico interactivo (E8-01) se agregan sin reestimar; aumenta la exposición de R6. Reestimar ambas historias en su refinement. |
| 00 | R7 materializado: el trabajo del Sprint 00 lo ejecutó un integrante y los PR se integraron sin aprobación de par. Recalibrar la velocidad al cierre del Sprint 01. Nuevo control: Access Token de Supabase con permisos mínimos (solo staging, escritura en Migrations y Edge Functions) tras la exposición del token anterior. |
| 01 | Decisión D3 (03/10/2026): nueva historia E1-06 (5 pts) en el Sprint 01, que sube a 29 pts con un solo integrante; aumenta la exposición de R6. |
| 01 | Security Review (05/10/2026): R4 actualizado con los controles construidos; nuevos R9 (sin Android físico), R10 (llaves de Vault) y R11 (bloqueo del PIN como denegación de servicio). Excepciones EX-001 a EX-003 renovadas hasta el 31/10/2026. Hallazgos SEC-01 a SEC-04. |
| 01 | 08/10/2026: el gate de SCA bloqueó un hallazgo Critical nuevo en `shell-quote` (GHSA-pqg4-j6r4-53mv); corregido con `overrides` a 1.12.0, sin excepción. |
| 01 | 05/10/2026: R9 mitigado con la prueba del APK en un Android físico (hito H2). |
| 02 | Security Review (15/10/2026): R9 pasa a materializado (sin Android para probar el Sprint 02); R1 sigue sin investigar y bloquea E4-02; R4 y R6 actualizados. Hallazgos SEC-05 y SEC-06; SEC-04 suma `sprintf-js`. Las excepciones EX-001 a EX-003 se revisan y siguen hasta el 31/10/2026. |
| 03-04 | Cierre conjunto (22/10/2026): R9 y R1 pasan a mitigado — pruebas reales en un OPPO Reno 11 (Android 15) el 13/10 (Sprint 02 regresión) y el 20/10 (Sprint 03 y 04), todas OK. R6 pasa a mitigado: los dos sprints (58 pts) se cerraron completos con un solo integrante. Hallazgos Critical/High: 0, verificado localmente (`npm run audit:gate`); sin `gh` autenticado no se pudieron confirmar los runs de CodeQL/secret scanning de GitHub ni abrir una Security Review completa — queda `PENDIENTE`. |

## Hallazgos de la Security Review del Sprint 01 (05/10/2026)

Fuentes: pipeline de `main` en verde (CI con Gitleaks, Semgrep, `npm audit` y pgTAP; CodeQL; deploy a staging), `npm audit` local, Gitleaks local sobre el historial y revisión del código de E1.

| ID | Hallazgo | Severidad | Acción propuesta | Issue |
|---|---|---|---|---|
| SEC-01 | `auth-pin` limita los intentos por menor (5 fallos → 15 min) pero no por IP, como pedía el modelo de amenazas: se pueden probar PIN contra muchos documentos | Medium | Límite de intentos por IP en `auth-pin` | **Corregido** (05/10/2026): 20 fallos por IP cada 15 min, con la IP guardada como huella |
| SEC-02 | El bloqueo por menor permite bloquear a propósito el ingreso de un menor cuyo documento se conozca (R11) | Low | Asignar un PIN nuevo desbloquea al menor de inmediato y SEC-01 limita al atacante | **Riesgo aceptado** (05/10/2026), seguimiento en R11 |
| SEC-03 | El personal institucional entra con la contraseña temporal que le dio el administrador y la app no le pide cambiarla | Medium | Obligar el cambio de contraseña en el primer ingreso | **Corregido** (05/10/2026): sin acceso a menores hasta cambiarla |
| SEC-04 | `npm audit` reporta 11 hallazgos Moderate (`uuid` < 11.1.1, `xcode` y paquetes de configuración de Expo) sin corrección compatible con Expo SDK 54 | Low | Revisar en cada Security Review y al actualizar la SDK de Expo | **Riesgo aceptado** hasta la próxima actualización de la SDK de Expo; issue #61 (creado el 15/10/2026) |

**Pendientes de verificación (requieren la sesión del Security Champion):**

- PENDIENTE: revisar la pestaña **Security** de GitHub (alertas de CodeQL y Dependabot).
- PENDIENTE: confirmar en Supabase (dev y staging) que **Confirm email** está activo, control del modelo de amenazas contra el registro masivo de cuentas.

## Hallazgos de la Security Review del Sprint 02 (15/10/2026)

Fuentes: pipeline de `main` en verde (CI y CodeQL sobre `3e2299c`), `npm audit` y `npm run audit:gate` locales, API de GitHub (alertas de CodeQL y de secretos), revisión de la migración `20261009150000_sprint_02_rutas_trayectos_contactos.sql` y del código de E2-01, E3 y E4.

**Resultado:** 0 hallazgos Critical/High sin excepción. El gate de SCA pasa: los 45 paquetes High que muestra `npm audit` dependen de los 4 avisos cubiertos por EX-001 a EX-003. CodeQL: 0 alertas abiertas. Secret scanning: 0 alertas abiertas. Sin `console.log` en el código de la app.

| ID | Hallazgo | Severidad | Acción propuesta | Issue |
|---|---|---|---|---|
| SEC-04 (actualizado) | `npm audit` pasa de 11 a 16 hallazgos Moderate: se suma `sprintf-js` 1.0.3 (GHSA-hp3w-g68c-fv3c), que llega por la cobertura de Jest (`babel-plugin-istanbul` → `js-yaml` → `argparse`). No viaja en el APK | Low | Revisar en cada Security Review y al actualizar la SDK de Expo | **Riesgo aceptado**, #61 |
| SEC-05 | Las alertas de Dependabot están desactivadas en el repositorio (la API responde 403). Las actualizaciones de Dependabot sí funcionan | Low | Activarlas en Settings → Code security (dueño del repo) | #62 |
| SEC-06 | El enlace de invitación usa el esquema propio `nexasafe://`: otra app instalada en el teléfono de quien la recibe podría registrar el mismo esquema y capturar el token | Low | Token de un solo uso, 72 h, guardado como hash; aceptar exige cuenta y el guardián ve quién aceptó. Evaluar Android App Links verificados con E2-03 (fase 2) | **Riesgo aceptado** en la fase 1, #63 |

**Pendientes de verificación (requieren la sesión del Security Champion):**

- PENDIENTE (desde el Sprint 01): confirmar en Supabase (dev y staging) que **Confirm email** está activo. Nota del 22/10/2026: en `nexasafe-dev` quedó **desactivado** a propósito, porque el plan gratuito de Supabase agotó su límite de envío de correos (`over_email_send_rate_limit`) al crear las cuentas de prueba; hay que decidir si se reactiva antes del cierre o si se documenta como excepción de ambiente de desarrollo.
- ~~Prueba en Android físico de las historias del Sprint 02 (R9).~~ Hecha el 13/10/2026 (ver R9).

## Pendientes del cierre (22/10/2026)

No hubo una Security Review formal en el cierre de los Sprints 03 y 04 — esta sesión no tuvo `gh` autenticado para sacar los datos de GitHub (runs de CodeQL, secret scanning, alertas de Dependabot) que las Security Review anteriores sí citan como fuente. Antes de la sustentación falta:

- PENDIENTE: Security Review real de los Sprints 03 y 04 con `gh` autenticado (runs de CI, CodeQL, secret scanning, PR fusionados).
- PENDIENTE: renovar o corregir las excepciones EX-001 a EX-003 (vencen el 31/10/2026).
- PENDIENTE: decidir sobre "Confirm email" en `nexasafe-dev` (ver arriba).
