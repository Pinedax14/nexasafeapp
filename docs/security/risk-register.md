# Registro de riesgos — NexaSafe

Última actualización: Sprint 00 (03/10/2026)

Fuente: Plan de Desarrollo v1.1, capítulo 8 (`PLAN_NEXASAFE.md` v1.2, sección 15).

| ID | Riesgo | Prob. | Impacto | Respuesta | Estado | Responsable | Última revisión |
|---|---|---|---|---|---|---|---|
| R1 | Ubicación en 2º plano detenida por optimización de batería (Xiaomi, Huawei) | Alta | Alto | Investigación en Sprint 2, antes de E4-02; foreground service + guía de exclusión | Abierto | PENDIENTE: asignar | Sprint 00 |
| R2 | Falsas alarmas erosionan la confianza | Media | Alto | Corredor configurable + PIN; sin sanción por falsa alarma | Abierto | PENDIENTE: asignar | Sprint 00 |
| R3 | Colegio sin responsable del puesto de control | Media | Alto | Tabla `personal_institucion` (varios responsables por colegio); flujo que funcione solo con la red de apoyo | Abierto | PENDIENTE: asignar | Sprint 00 |
| R4 | Fuga de datos de menores | Baja | Crítico | Cifrado, RLS, minimización, auditoría; pentest en fase 2 | Abierto | PENDIENTE: asignar | Sprint 00 |
| R5 | WhatsApp limitado a 5 destinatarios | Alta | Medio | Push como canal principal; WhatsApp pasa a fase 2 | Mitigado | PENDIENTE: asignar | Sprint 00 |
| R6 | Alcance excesivo (Sprint 4 = 32 pts) | Alta | Alto | MoSCoW + revisión de alcance en H3; recalibrar con la velocidad del Sprint 1 | Abierto | PENDIENTE: asignar | Sprint 00 |
| R7 | Baja disponibilidad de un integrante | Media | Medio | Propiedad colectiva del código y documentación en el repo | Materializado | PENDIENTE: asignar | Sprint 00 |
| R8 | Falsos positivos por sacudida | Alta | Medio | Aplica a la fase 2 (E6-02) | Abierto | PENDIENTE: asignar | Sprint 00 |

## Historial de cambios

| Sprint | Cambio |
|---|---|
| 00 | Registro creado con R1–R8 del Plan. R3 suma `personal_institucion` (decisión G); R5 queda mitigado porque WhatsApp pasa a fase 2; R6 refleja el Sprint 4 de 32 pts. |
| 00 | Decisión del 03/10/2026: caché (E3-01) y gráfico interactivo (E8-01) se agregan sin reestimar; aumenta la exposición de R6. Reestimar ambas historias en su refinement. |
| 00 | R7 materializado: el trabajo del Sprint 00 lo ejecutó un integrante y los PR se integraron sin aprobación de par. Recalibrar la velocidad al cierre del Sprint 01. Nuevo control: Access Token de Supabase con permisos mínimos (solo staging, escritura en Migrations y Edge Functions) tras la exposición del token anterior. |
