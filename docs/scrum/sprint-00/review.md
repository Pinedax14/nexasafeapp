# Sprint 00 — Review

**Fecha:** 03/10/2026
**Sprint Goal:** la plataforma técnica y de seguridad está lista para producir código auditable.
**Sprint Goal cumplido:** Sí. Hito H1 (todo PR ejecuta lint + test + SAST + SCA) cumplido el 03/10/2026, un día después de la fecha planificada (02/10).

| Historia | Pts | Estado | Feedback del PO |
|---|---|---|---|
| E0-01 Monorepo con ramas protegidas y plantillas de PR | 3 | Aceptada | "Quedó bien" (aplica a todo el incremento) |
| E0-02 Pipeline de CI: lint, pruebas y build en cada PR | 5 | Aceptada | Ídem |
| E0-03 SAST, SCA y escaneo de secretos automáticos | 5 | Aceptada | Ídem |
| E0-04 Ambientes dev y staging desplegados por pipeline | 5 | Aceptada | Ídem |

**Velocidad:** 18 pts completados de 18 comprometidos.

## Qué se demostró

- La app en `apps/mobile/` corriendo en Expo Go (login del prototipo).
- PR con el pipeline completo en verde: ESLint, Prettier, TypeScript, Jest con cobertura, build, Gitleaks, Semgrep, `npm audit` y CodeQL.
- `main` protegida: solo acepta cambios por PR con los 5 controles en verde.
- Despliegue automático a `nexasafe-staging` al hacer merge en `main` (migración inicial aplicada).

## Estado de seguridad

- **Hallazgos Critical/High abiertos sin excepción:** 0.
- **Excepciones vigentes:** EX-001 (`image-size`), EX-002 (`node-forge`) y EX-003 (`braces`), aprobadas por el Security Champion y con vencimiento el 17/10/2026.
- **Mitigado:** `postcss` actualizado a 8.5.28 mediante `overrides`.
- **Incidente:** el 03/10/2026 un Access Token de Supabase quedó expuesto fuera de los secretos de GitHub. Se reemplazó por un token nuevo con permisos mínimos (solo `nexasafe-staging`; escritura solo en Migrations y Edge Functions). PENDIENTE: confirmar la revocación del token expuesto.

## Desviaciones frente a la Definition of Done

- **PR aprobado por un compañero:** no se cumplió. `main` quedó configurada con 0 aprobaciones obligatorias desde el 03/10/2026 por disponibilidad del equipo; los controles automáticos sí fueron obligatorios en todos los PR.
- **Probado en Android físico:** no verificado. Las historias del Sprint 00 son de plataforma y no tienen UI nueva.
- **Fechas:** el sprint se ejecutó el 03/10/2026 en lugar del 22/09–02/10.

## Trabajo no planificado (sin estimación en puntos)

- Corrección de inconsistencias de los entregables (v1.1) y de `PLAN_NEXASAFE.md` (v1.2), con las decisiones B–G y 1–4.
- Dependabot restringido a versiones menores: propuso saltos a Expo SDK 57, TypeScript 7 y ESLint 10, incompatibles con Expo SDK 54. Sus 11 PR (#7–#16 y #18) se cerraron sin integrar.
- Limpieza y validación de los secretos de staging en `deploy-staging.yml`.
