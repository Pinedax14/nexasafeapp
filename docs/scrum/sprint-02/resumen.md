# Sprint 02 — Resumen

**Fechas:** planificadas 20/10 – 31/10/2026 · planning real 09/10/2026 · historias integradas del 09/10 al 12/10/2026 · Security Review, review, retro y cierre el 15/10/2026
**Sprint Goal:** un guardián puede definir la ruta del protegido y el protegido puede iniciar un trayecto acompañado. · **Cumplido:** Sí en el código; la prueba en Android físico está pendiente, así que el hito H3 queda pendiente de esa verificación.

| Métrica | Valor |
|---|---|
| Puntos comprometidos | 26 |
| Puntos completados (velocidad) | 26 (aceptados por el PO con la prueba en Android pendiente) |
| Trabajo no planificado | Sin estimación en puntos (ver `review.md`) |
| Cobertura unitaria (`domain` + `data` + `core/storage`) | 99,59 % líneas · 97,67 % ramas · 98,71 % funciones · 99,32 % sentencias |
| Pruebas Jest | 320 pasan / 320 (37 suites) |
| Pruebas pgTAP (RLS y funciones) | 123 aserciones en 5 archivos (46 nuevas del Sprint 02), ejecutadas por el CI |
| Pruebas Deno (Edge Functions) | `admin-personal` y `auth-pin`, ejecutadas por el CI (el Sprint 02 no agregó Edge Functions) |
| Prueba en Android físico | No ejecutada: no hay un Android disponible (desviación registrada en `review.md`, R9) |
| Prueba E2E (Maestro) | No ejecutada |
| Hallazgos Critical/High abiertos sin excepción | 0 (4 advisories High cubiertos por EX-001 a EX-003, vigentes hasta el 31/10/2026) |
| Hallazgos de la Security Review | SEC-05 y SEC-06 nuevos (Low, #62 y #63) · SEC-04 actualizado (#61) |
| Bugs abiertos / cerrados | 0 / 0 |
| PR integrados a `main` | 14 (#34, #38–#40, #42, #43, #52–#54, #56–#59, #64); #60 se cerró sin fusionar y su contenido entró en #64 |
| Runs del pipeline CI en PR (verde / rojo) | 30 / 4. Los rojos se corrigieron antes del merge |
| Runs del pipeline CI en `main` (verde / rojo) | 13 / 1. El rojo (tras #54) fue un fallo de infraestructura: límite de peticiones de GitHub al descargar la CLI de Supabase; el siguiente run pasó sin cambios |
| Runs de CodeQL (verde / rojo) | 49 / 0 |
| Despliegues a staging | 1 exitoso |

Fuente: API de GitHub Actions (runs creados desde el 09/10/2026 07:52, cierre del Sprint 01), `git log` de `main`, `npm run test:coverage`, `npm run lint` (sin errores) y `npm run audit:gate` sobre `main` (`a3f6765`), 15/10/2026.

**Historias completadas:** E3-01a, E3-01b, E3-02, E3-03, E4-01, E4-04 y E2-01 (prueba en Android pendiente en las 7; issues #45 a #51 abiertos hasta hacerla).
**Historias que pasan al siguiente sprint:** ninguna. La prueba en Android del Sprint 02 pasa como tarea del Sprint 03.
**Acciones de la retro:** Android fijo o emulador antes de E4-02, investigar R1 antes de E4-02, fusionar cada PR con el CI en verde, revisión de pares en los PR de documentación (David e Ingrith), una sola fuente de fechas y renovar EX-001 a EX-003 antes del 31/10/2026.
