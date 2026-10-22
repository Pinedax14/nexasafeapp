# Sprint 04 — Resumen

**Fechas:** planificadas 20/10 – 28/10/2026 (Excel de ejecución) · inicio real 15/10/2026 · Android, review, retro y cierre el 20-22/10/2026
**Sprint Goal:** el puesto de control atiende alertas desde la app y deja bitácora del incidente. · **Cumplido:** Sí, con prueba en Android física hecha y pasada. Hito H4 alcanzado.

| Métrica | Valor |
|---|---|
| Puntos comprometidos | 32 |
| Puntos completados (velocidad) | 32 |
| Trabajo no planificado | Ver `review.md` (fix de `ControlRoomScreen`, catálogo de colegios, puesta al día de registros) |
| Cobertura unitaria (`domain` + `data` + `core/storage`) | 98,98 % sentencias · 97,08 % ramas · 98,77 % funciones · 99,72 % líneas |
| Pruebas Jest | 488 pasan / 488 (54 suites) |
| Pruebas pgTAP (RLS y funciones) | 46 nuevas del Sprint 04 (`eventos_incidente`, cierre de alertas, `dispositivos_push`), ejecutadas por el CI |
| Pruebas Deno (Edge Functions) | 12 nuevas en `notify-push` |
| Prueba en Android físico | Hecha el 20/10/2026 — OPPO Reno 11, Android 15, build `preview`. Todo OK (detalle en `pruebas-android.md`) |
| Prueba E2E (Maestro) | No ejecutada |
| Hallazgos Critical/High abiertos sin excepción | 0 (verificado localmente con `npm run audit:gate`) |
| Bugs encontrados / corregidos antes del cierre | 1 / 1 (`ControlRoomScreen`, gráfico con colegio sin alertas) |
| PR integrados a `main` / runs de CI | PENDIENTE: `gh` instalado pero no autenticado en esta sesión |

Fuente: `git log`, `npm run test:coverage`, `npm run lint` (sin errores) y `npm run audit:gate`, 22/10/2026. Los conteos de PR y runs de CI quedan `PENDIENTE` hasta autenticar `gh`.

**Historias completadas:** E9-01, E7-01, E7-02, E9-02, E8-01, E6-04 y E11-04.
**Historias que pasan al siguiente sprint:** ninguna. No hay más sprints planificados: con este cierre termina el desarrollo del semestre.
**Acciones de la retro:** corregir las fechas del Cronograma y el Plan con la fecha de cierre real (30/10/2026), generar y probar el release candidate (`production`), autenticar `gh`.
