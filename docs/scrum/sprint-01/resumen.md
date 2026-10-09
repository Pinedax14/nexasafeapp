# Sprint 01 — Resumen

**Fechas:** planificadas 06/10 – 17/10/2026 · historias integradas del 03/10 al 05/10/2026 · review el 08/10/2026 · cierre el 09/10/2026
**Sprint Goal:** un acudiente puede registrarse, dar de alta a un menor y el colegio validarlo. · **Cumplido:** Sí (H2 cumplido el 05/10/2026)

| Métrica | Valor |
|---|---|
| Puntos comprometidos | 29 |
| Puntos completados (velocidad) | 29 |
| Trabajo no planificado | Sin estimación en puntos (ver `review.md`) |
| Cobertura unitaria (`domain` + `data` + `core/storage`) | 99,36 % líneas · 96,55 % ramas · 97,93 % funciones · 98,95 % sentencias |
| Pruebas Jest | 177 pasan / 177 (23 suites) |
| Pruebas pgTAP (RLS y funciones) | 77 aserciones en 4 archivos, ejecutadas por el CI |
| Pruebas Deno (Edge Functions) | `admin-personal` y `auth-pin`, ejecutadas por el CI |
| Prueba E2E (Maestro) | No ejecutada (desviación registrada en `review.md`) |
| Hallazgos Critical/High abiertos sin excepción | 0 (4 advisories High cubiertos por EX-001 a EX-003, vigentes hasta el 31/10/2026) |
| Hallazgos de la Security Review | SEC-01 y SEC-03 corregidos · SEC-02 y SEC-04 aceptados |
| Bugs abiertos / cerrados | 0 / 0 |
| PR integrados a `main` | 13 (#20–#29, #31, #33, #35) |
| Runs del pipeline CI en PR (verde / rojo / cancelado) | 21 / 5 / 3. Los rojos se corrigieron antes del merge |
| Runs del pipeline CI en `main` (verde / rojo) | 14 / 0 |
| Runs de CodeQL (verde / rojo) | 42 / 2 (los 2 rojos en PR) |
| Despliegues a staging | 7 exitosos |

Fuente: API pública de GitHub Actions (runs creados desde el 03/10/2026 19:26, cierre del Sprint 00), `git log` de `main`, `npm run test:coverage`, `npm run lint` (sin errores) y `npm run audit:gate` sobre `main` + la rama de cierre, 09/10/2026.

**Historias completadas:** E1-01, E1-02, E1-03, E1-04, E1-05, E1-06 y E11-01.
**Historias que pasan al siguiente sprint:** ninguna.
**Acciones de la retro:** partir las historias grandes en el refinement, montar Maestro al inicio del Sprint 02, asegurar un Android antes de mapa y GPS, trabajar a ritmo diario y revisar cada PR con la DoD al día siguiente — Juan Felipe Pineda Cardona.
