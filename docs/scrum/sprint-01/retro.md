# Sprint 01 — Retrospectiva

**Ceremonia planificada:** 17/10/2026 · **Fecha real:** 09/10/2026

**Qué salió bien:**
- Se completaron las 7 historias (29 pts) antes de la fecha planificada y el PO las aceptó sin pedir cambios.
- La seguridad se construyó desde el inicio: RLS en todas las tablas con pruebas pgTAP, PIN verificado solo en el servidor y documento del menor cifrado.
- El gate de SCA del CI detectó una vulnerabilidad Critical (`shell-quote`) y se corrigió el mismo día.
- La Security Review encontró dos fallas reales (SEC-01, sin límite de PIN por IP, y SEC-03, contraseña temporal sin cambio obligatorio) y se corrigieron dentro del sprint.
- Se probó el APK en un Android físico (H2) a pesar de no tener un dispositivo propio.

**Qué mejorar:**
- E1-04 se estimó en 3 pts y fue mucho más grande: Edge Function, migración, pantalla del acudiente y PIN aleatorio.
- Sin Android propio, casi todas las pruebas se hicieron en el navegador y hubo que conseguir un celular prestado.
- No se hizo la prueba E2E con Maestro.
- Ningún compañero revisó los PR (se trabajó con un solo integrante).
- Hubo bloqueos externos: el correo gratuito de Supabase no envía a personal externo y Google Cloud rechazó la tarjeta.
- El trabajo se concentró en muy pocos días (03–05/10) y el ritmo no fue constante.

**Acciones:**

| Acción | Responsable | Para cuándo |
|---|---|---|
| Partir en el refinement las historias que necesiten Edge Function, migración y pantalla, o estimarlas más alto | Juan Felipe Pineda Cardona | Planning del Sprint 02 (20/10/2026) |
| Montar Maestro al inicio del Sprint 02, antes de E3 y E4 | Juan Felipe Pineda Cardona | 22/10/2026 |
| Asegurar acceso a un Android antes de las historias de mapa y GPS | Juan Felipe Pineda Cardona | 20/10/2026 |
| Trabajar un poco cada día en lugar de concentrar el sprint en 2 o 3 días | Juan Felipe Pineda Cardona | Durante el Sprint 02 |
| Revisar cada PR al día siguiente con el checklist de la DoD, para compensar la falta de revisión de un compañero | Juan Felipe Pineda Cardona | Durante el Sprint 02 |
