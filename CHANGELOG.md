# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Una sección por sprint.

## [0.0.0] — Sprint 00 — 03/10/2026

### Agregado
- E0-01 Monorepo: la app pasa a `apps/mobile/`; plantillas de PR (con la Definition of Done) e issues (historia, bug, hallazgo de seguridad).
- E0-02 Pipeline de CI (`.github/workflows/ci.yml`): `npm ci` → ESLint → Prettier → TypeScript → Jest con umbral de cobertura del 70 % → `expo export` Android.
- Primeras pruebas unitarias sobre el login del prototipo (`AuthenticateUser`, `LocalAuthRepository`), caso piloto del Informe de Pruebas.
- E0-03 Controles de seguridad en el CI: Gitleaks (secretos), Semgrep con reglas propias + CodeQL (SAST) y gate de `npm audit --audit-level=high` con excepciones que vencen (SCA); Dependabot (solo versiones menores y parches; los saltos mayores se hacen con la SDK de Expo) y hook de pre-commit.
- E0-04 Supabase inicializado (`supabase/`): migración inicial vacía, JWT de 15 min, carpeta de políticas RLS y workflow `deploy-staging.yml` que aplica migraciones y Edge Functions al hacer merge en `main`. Perfiles de EAS `development`, `preview` y `production` (`expo-dev-client` instalado).
- Registro de seguridad inicial: `threat-model.md`, `risk-register.md` y `exceptions.md`.
- Registro del Sprint 00: `planning.md`, `review.md`, `retro.md` y `resumen.md`, y resultados del sprint en `05-informe-pruebas-calidad.md`.

### Seguridad
- `postcss` forzado a 8.5.28 con `overrides` (GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849).
- Excepciones EX-001 a EX-003 (`image-size`, `node-forge`, `braces`: herramientas de build y pruebas, sin versión corregida compatible), aprobadas por el Security Champion (Juan Felipe Pineda Cardona) con vencimiento el 17/10/2026.

### Cambiado
- La app se llama NexaSafe (paquete Android `com.nexasafe.app`).
- `npm start` abre la app en modo Expo Go (`expo start --go`).
- Entregables de Ingeniería de Software I corregidos a v1.1 y `PLAN_NEXASAFE.md` a v1.2 (ver la sección 0 de la guía).
