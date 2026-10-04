# Sprint 00 — Resumen

**Fechas:** planificadas 22/09 – 02/10/2026 · ejecutado el 03/10/2026
**Sprint Goal:** la plataforma técnica y de seguridad está lista para producir código auditable. · **Cumplido:** Sí (H1 cumplido el 03/10, un día tarde)

| Métrica | Valor |
|---|---|
| Puntos comprometidos | 18 |
| Puntos completados (velocidad) | 18 |
| Trabajo no planificado | Sin estimación en puntos (ver `review.md`) |
| Cobertura unitaria (`domain` + `data`) | 100 % líneas, ramas, funciones y sentencias (6 pruebas) |
| Hallazgos Critical/High abiertos sin excepción | 0 (3 excepciones vigentes hasta el 17/10/2026) |
| Bugs abiertos / cerrados | 0 / 0 |
| PR integrados a `main` | 7 (#1–#6, #17) |
| Runs del pipeline CI (verde / rojo) | 14 / 4. Los 4 rojos fueron PR de Dependabot que no se integraron; `main` nunca estuvo en rojo |
| Runs de CodeQL (verde / rojo) | 17 / 0 |
| Despliegues a staging | 2 exitosos. El primero necesitó 4 intentos por la configuración de los secretos |

Fuente: API de GitHub (PR y Actions), `npm run test:coverage` y `npm run audit:gate` sobre `main` (`4b28e10`), 03/10/2026.

**Historias completadas:** E0-01, E0-02, E0-03 y E0-04.
**Historias que pasan al siguiente sprint:** ninguna.
**Acciones de la retro:** comenzar el Sprint 01 en la fecha planificada (06/10/2026) — Juan Felipe Pineda Cardona.
