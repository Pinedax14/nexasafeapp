# Sprint 02 — Retrospectiva

**Ceremonia planificada:** 31/10/2026 · **Fecha real:** 15/10/2026

Los puntos los propuso la IA a partir del registro del sprint (git, `gh` y la Security Review) y Juan Felipe Pineda Cardona los aceptó para el equipo el 15/10/2026.

**Seguimiento de las acciones del Sprint 01:**

| Acción | Resultado |
|---|---|
| Partir las historias que necesiten Edge Function, migración y pantalla | Cumplida: E3-01 se dividió en E3-01a (5) y E3-01b (3) |
| Montar Maestro al inicio del Sprint 02 | No cumplida: se reemplazó por una lista de pruebas manuales en Android (09/10/2026) |
| Asegurar acceso a un Android antes de las historias de mapa y GPS | No cumplida: R9 materializado |
| Trabajar un poco cada día | Parcial: las historias se integraron entre el 09/10 y el 12/10 |
| Revisar cada PR con el checklist de la DoD | Parcial: los controles automáticos del CI se cumplieron en todos los PR; sin revisión de un compañero |

**Qué salió bien:**
- Se entregaron las 7 historias (26 pts) entre el 09/10 y el 12/10, antes de las fechas planificadas (20/10–31/10), y el PO las aceptó.
- Partir E3-01 en E3-01a y E3-01b funcionó: PR más pequeños y más fáciles de revisar.
- Las decisiones se tomaron antes de programar: wireframes W1–W6, modelo de datos y decisiones D8–D17 aprobados antes del código; no hubo que rehacer el esquema.
- La seguridad venía dentro del diseño: RLS, auditoría y 46 pruebas pgTAP llegaron con la migración, y la Security Review no encontró hallazgos High ni Critical sin excepción.
- El mapa se resolvió sin Google Maps: cuando Google Cloud rechazó la tarjeta, se cambió a OpenStreetMap sin bloquear el sprint.

**Qué mejorar:**
- Ninguna historia se probó en un celular: el mapa nunca ha corrido fuera del CI y la review aceptó las historias con la prueba en Android pendiente.
- Se repitieron dos acciones incumplidas de la retro anterior: ni Maestro ni un Android propio.
- Los PR se quedaron días sin abrir ni fusionar: ramas encadenadas, conflictos de CHANGELOG y un PR (#60) cerrado por error sin fusionar.
- Las fechas son confusas: el Cronograma dice 20/10–31/10, el Excel de ejecución 21/09–02/10 y el trabajo real fue del 09/10 al 12/10.
- Sin revisión de pares: todo el código lo escribió e integró un solo integrante.
- R1 (la ubicación en segundo plano se detiene) sigue sin investigar y era requisito para E4-02.

**Acciones:**

| # | Acción | Responsable | Para cuándo |
|---|---|---|---|
| 1 | Conseguir un Android 9+ fijo (o un emulador de Android Studio como respaldo) y correr la lista de pruebas del Sprint 02 antes de empezar E4-02 | Juan Felipe Pineda Cardona | Antes del planning del Sprint 03 |
| 2 | Investigar R1 (el sistema detiene la app en segundo plano) en ese celular antes de construir E4-02 | Juan Felipe Pineda Cardona | Primer día del Sprint 03 |
| 3 | Fusionar cada PR en cuanto el CI esté verde; no encadenar ramas | Juan Felipe Pineda Cardona | Durante el Sprint 03 |
| 4 | Aprobar con su cuenta de GitHub al menos los PR de documentación, para tener revisión de pares real | David Alejandro del Prado Camargo e Ingrith Yuliana García Galvis | Durante el Sprint 03 |
| 5 | Dejar una sola fuente de fechas: decidir si mandan las del Cronograma o las del Excel y corregir la otra | Juan Felipe Pineda Cardona y el equipo | Antes del planning del Sprint 03 |
| 6 | Renovar o corregir las excepciones EX-001 a EX-003 | Juan Felipe Pineda Cardona (Security Champion) | Antes del 31/10/2026 |

**Conclusión:** el equipo programa rápido, pero verifica poco en el mundo real. El Sprint 03 trae ubicación en segundo plano y geocercas, que casi no se pueden validar sin un celular; la acción 1 es la más importante.
