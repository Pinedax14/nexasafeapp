# Sprint 00 — Planning

**Fechas planificadas:** 22/09 – 02/10/2026
**Fechas reales:** el trabajo del sprint empezó el 03/10/2026 (ver "Desviación")
**Sprint Goal:** la plataforma técnica y de seguridad está lista para producir código auditable.
**Hito asociado:** H1 (02/10) — todo PR ejecuta lint + test + SAST + SCA automáticamente.
**Capacidad:** 18 pts · **Security Champion (Sprints 00–01):** Juan Felipe Pineda Cardona

| Historia | Descripción | Responsable | Pts |
|---|---|---|---|
| E0-01 | Monorepo con ramas protegidas y plantillas de PR | Rol DevSecOps/QA — Juan Felipe Pineda Cardona | 3 |
| E0-02 | Pipeline de CI: lint, pruebas y build en cada PR | Rol DevSecOps/QA — Juan Felipe Pineda Cardona | 5 |
| E0-03 | SAST, SCA y escaneo de secretos automáticos | Rol DevSecOps/QA (Security Champion) — Juan Felipe Pineda Cardona | 5 |
| E0-04 | Ambientes dev y staging desplegados por pipeline | Rol Backend/Datos — Juan Felipe Pineda Cardona | 5 |
| — | Modelado de amenazas inicial (STRIDE por épica) | Equipo completo | — |

## Desviación

Al 03/10/2026 el repositorio no tenía ningún entregable del Sprint 00 y el hito H1 (02/10) estaba vencido. El equipo decidió ejecutar el sprint de inmediato para no retrasar el Sprint 01 (inicia el 06/10). El retraso se registra aquí y en `review.md`; no se modifican las fechas planificadas del Cronograma.

Antes de iniciar el sprint, el 03/10/2026 se corrigieron las inconsistencias de los entregables (v1.1; ver la sección 0 de `docs/GUIA_PROYECTO_NEXASAFE.md`).

## Riesgos del sprint

- **R6 / R7:** el sprint se ejecuta comprimido y sin el tiempo planificado.
- Las tareas que requieren cuentas del equipo (proteger `main`, GitHub Projects, proyectos de Supabase, GitHub Secrets) no se pueden automatizar desde el repositorio y quedan como tareas manuales.

## Tareas manuales del equipo

- [x] Proteger `main` (Settings → Branches): PR obligatorio y los 5 checks en verde. Aprobaciones obligatorias: 0 (ver `review.md`).
- [ ] Crear GitHub Projects con las vistas *Backlog* y *Sprint actual*.
- [ ] Cargar las historias como issues con etiquetas `epic:*`, `type:*`, `security` y `sprint:XX`.
- [x] Crear los proyectos de Supabase `nexasafe-dev` y `nexasafe-staging` (PostgreSQL 17.11).
- [x] Guardar en GitHub Secrets (ambiente `staging`): `SUPABASE_ACCESS_TOKEN`, `SUPABASE_STAGING_PROJECT_REF` y `SUPABASE_STAGING_DB_PASSWORD`.
- [x] Nombrar al Security Champion de los Sprints 00–01: Juan Felipe Pineda Cardona (03/10/2026).
- [ ] Asignar responsables de las demás historias y de los riesgos R1–R8.
