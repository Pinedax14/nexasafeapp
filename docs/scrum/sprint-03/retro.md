# Sprint 03 — Retrospectiva

**Ceremonia planificada:** 19/10/2026 · **Fecha real:** 22/10/2026

Los puntos los propuso la IA a partir del registro del sprint (git, el código y la sesión de trabajo del cierre) y Juan Felipe Pineda Cardona los aceptó para el equipo el 22/10/2026.

**Seguimiento de las acciones del Sprint 02:**

| Acción | Resultado |
|---|---|
| Conseguir un Android 9+ fijo y correr la lista de pruebas del Sprint 02 antes de E4-02 | Cumplida, aunque tarde: se hizo el 16/10/2026 (después de empezar a programar), con un Samsung Galaxy del Samsung Remote Test Lab |
| Investigar R1 (la ubicación en segundo plano se detiene) antes de construir E4-02 | PENDIENTE: no quedó registro de una investigación aparte; se verificó junto con la prueba de E4-02 del 20/10/2026 |
| Fusionar cada PR en cuanto el CI esté verde | PENDIENTE confirmar sin `gh` autenticado |
| Revisión de pares en los PR de documentación | PENDIENTE confirmar sin `gh` autenticado |
| Una sola fuente de fechas | No cumplida: el Excel de ejecución (05/10–19/10) y la fecha real de cierre (22/10) siguen sin alinearse |
| Renovar EX-001 a EX-003 antes del 31/10/2026 | Vencen esta semana; PENDIENTE renovarlas o corregirlas |

**Qué salió bien:**
- Las 5 historias (26 pts) quedaron con código funcionando y la prueba en Android confirmó que el flujo completo de ubicación en vivo y botón de pánico funciona de extremo a extremo.
- La arquitectura por capas (domain/data/presentation) hizo que agregar ubicación y alertas no tocara código de sprints anteriores.

**Qué se dificultó (de la sesión de cierre del 22/10/2026):**
- El Product Backlog (Excel) y el Informe de Pruebas llevaban desde el cierre del Sprint 02 (15/10) sin actualizarse, a pesar de que el Sprint 03 ya había arrancado — se descubrió solo al revisar el estado real contra `git log`, no porque alguien lo hubiera marcado.
- Crear cuentas de prueba de los distintos roles tomó más de lo esperado por un límite de envío de correos del plan gratuito de Supabase (`over_email_send_rate_limit`); hubo que desactivar "Confirm email" en dev.
- Sin `gh` autenticado durante la mayor parte del sprint, varias métricas de proceso (PR fusionados, runs de CI, revisión de pares) no se pudieron confirmar con datos reales de GitHub hasta el cierre.

**Acciones:**

| # | Acción | Responsable | Para cuándo |
|---|---|---|---|
| 1 | Renovar o corregir EX-001 a EX-003 | Juan Felipe Pineda Cardona (Security Champion) | Antes del 31/10/2026 |
| 2 | Actualizar el Product Backlog y el Informe de Pruebas al cerrar cada sprint, no varios sprints después | Juan Felipe Pineda Cardona | Desde el cierre de este sprint en adelante |
| 3 | Autenticar `gh` en el equipo para poder registrar PR, runs de CI y revisión de pares con datos reales | Juan Felipe Pineda Cardona | Antes del cierre del Sprint 04 |

**Conclusión:** el código y la prueba en Android llegaron bien; lo que se atrasó fue el registro del proceso (backlog, informe de pruebas), no la construcción.
