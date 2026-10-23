# Sprint 04 — Retrospectiva

**Ceremonia planificada:** 28/10/2026 · **Fecha real:** 22/10/2026

Los puntos los propuso la IA a partir del registro del sprint (git, el código y la sesión de trabajo del cierre) y Juan Felipe Pineda Cardona los aceptó para el equipo el 22/10/2026.

**Seguimiento de las acciones del Sprint 03:** este sprint se trabajó junto con el Sprint 03 (ambos arrancaron el 15/10/2026), así que comparte las mismas acciones; ver [`sprint-03/retro.md`](../sprint-03/retro.md).

**Qué salió bien:**
- Las 7 historias (32 pts) del hito H4 (ubicación en vivo + flujo alerta → notificación → respuesta → cierre) quedaron completas y probadas en Android el mismo día que el Sprint 03.
- El diseño por capas permitió encontrar y corregir un bug real (`ControlRoomScreen`) con una prueba dirigida, sin tocar nada más del incremento.
- El puesto de control (E8-01), la historia más grande del sprint (8 pts), llegó funcionando de punta a punta: mapa, lista de alertas y gráfico interactivo.

**Qué se dificultó (de la sesión de cierre del 22/10/2026):**
- El gráfico de `ControlRoomScreen` (E8-01) se caía con cualquier colegio sin historial de alertas — justo el estado de cualquier colegio recién creado. No lo detectaron las pruebas automáticas porque mockean `BarChart` por completo; solo apareció al probar con una cuenta real de `institucion`.
- La fecha de cierre del proyecto se confirmó apenas hoy como el 30/10/2026, muy distinta a la que tenían el Cronograma (03) y `PLAN_NEXASAFE.md` (sustentación el 28/11/2026). Falta propagar ese cambio a esos documentos y a la sección 0 de la Guía.
- Igual que en el Sprint 03: sin `gh` autenticado, varias métricas de proceso no se pudieron confirmar con datos reales hasta hoy.

**Acciones:**

| # | Acción | Responsable | Para cuándo |
|---|---|---|---|
| 1 | Corregir el Cronograma (03), `PLAN_NEXASAFE.md` y la sección 0 de la Guía con la fecha de cierre real (30/10/2026) | Juan Felipe Pineda Cardona | Antes de la sustentación |
| 2 | Generar y probar la build `production` de EAS (el release candidate) | Juan Felipe Pineda Cardona | Antes del 30/10/2026 |
| 3 | Autenticar `gh` para dejar completos los registros de PR y CI | Juan Felipe Pineda Cardona | Antes de la sustentación |

**Conclusión:** el desarrollo llegó al hito H4 completo y probado. Lo que queda es administrativo: alinear fechas en los documentos oficiales y cerrar los registros de proceso que dependen de GitHub.
