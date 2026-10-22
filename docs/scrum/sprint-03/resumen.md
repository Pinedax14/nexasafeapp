# Sprint 03 — Resumen

**Fechas:** planificadas 05/10 – 19/10/2026 (Excel de ejecución) · inicio real 15/10/2026 · Android, review, retro y cierre el 20-22/10/2026
**Sprint Goal:** el guardián sigue el trayecto en vivo y el botón de pánico funciona de extremo a extremo con cancelación por PIN. · **Cumplido:** Sí, con prueba en Android física hecha y pasada.

| Métrica | Valor |
|---|---|
| Puntos comprometidos | 26 |
| Puntos completados (velocidad) | 26 |
| Trabajo no planificado | Ver `review.md` (fix de `ControlRoomScreen`, catálogo de colegios, puesta al día de registros) |
| Cobertura unitaria (`domain` + `data` + `core/storage`) | 98,98 % sentencias · 97,08 % ramas · 98,77 % funciones · 99,72 % líneas (estado actual del repo, incluye Sprint 04) |
| Pruebas Jest | 488 pasan / 488 (54 suites, estado actual del repo) |
| Pruebas pgTAP (RLS y funciones) | 43 nuevas del Sprint 03 (`alertas`, `posiciones`), ejecutadas por el CI |
| Pruebas Deno (Edge Functions) | 10 nuevas en `auth-pin` (acción `cancelar_alerta`) |
| Prueba en Android físico | Hecha el 20/10/2026 — OPPO Reno 11, Android 15, build `preview`. Todo OK (detalle en `pruebas-android.md`) |
| Prueba E2E (Maestro) | No ejecutada (sigue reemplazada por la prueba manual en Android) |
| Hallazgos Critical/High abiertos sin excepción | 0 (verificado localmente con `npm run audit:gate`) |
| PR integrados a `main` / runs de CI | PENDIENTE: `gh` instalado pero no autenticado en esta sesión |

Fuente: `git log`, `npm run test:coverage`, `npm run lint` (sin errores) y `npm run audit:gate`, 22/10/2026. Los conteos de PR y runs de CI quedan `PENDIENTE` hasta autenticar `gh`.

**Historias completadas:** E4-02, E4-03, E6-01, E6-03 y E6-05.
**Historias que pasan al siguiente sprint:** ninguna.
**Acciones de la retro:** renovar EX-001 a EX-003 antes del 31/10/2026, actualizar backlog e informe de pruebas al cierre de cada sprint (no después), autenticar `gh`.
