# Informe de Pruebas de Calidad y Control de Errores — resultados por sprint

Complementa al documento oficial [`05-informe-pruebas-calidad.pdf`](05-informe-pruebas-calidad.pdf) (v1.1, iteración 0), que fija la estrategia de pruebas, el quality gate y las métricas objetivo. Aquí se registran los **resultados reales** al cierre de cada sprint; en el hito H5 (25/11/2026) se consolidan en la versión final del informe.

## Resultados Sprint 00 (03/10/2026)

| Elemento | Resultado |
|---|---|
| Cobertura unitaria (`domain` + `data`) | 100 % (umbral de la DoD: 70 %) |
| Pruebas unitarias | 6 pasan / 6 total (`AuthenticateUser`, `LocalAuthRepository`) |
| Pruebas de integración | No aplica aún: no hay tablas ni Edge Functions |
| Flujos E2E ejecutados | Ninguno: los flujos 1–5 dependen de las épicas E1–E9 |
| SAST (Semgrep / CodeQL) | Semgrep: 0 hallazgos de severidad ERROR (High). CodeQL `security-extended`: análisis en verde en 17 runs. Medium/Low: PENDIENTE revisar en *Security → Code scanning* |
| SCA (`npm audit --audit-level=high`) | 4 advisories High en herramientas de build y pruebas, cubiertos por las excepciones EX-001 a EX-003 (vencen el 17/10/2026); 0 Critical; 11 Moderate. `postcss` corregido con `overrides` |
| Secretos (Gitleaks) | Limpio en todos los PR |
| Build (`expo export` Android) | Exitoso en cada PR |
| Bugs abiertos / cerrados | 0 / 0 |

**Defectos relevantes:** ninguno en el código de la app. En el pipeline:
- `deploy-staging.yml` falló 3 veces por secretos mal cargados; se agregó la limpieza y validación de los secretos antes de usarlos.
- Dependabot propuso actualizaciones incompatibles con Expo SDK 54 (4 runs de CI en rojo); se restringió a versiones menores.

**Acciones para el siguiente sprint:**
- Agregar pruebas unitarias para los casos de uso de E1 y pruebas de políticas RLS (RNF-27) desde la primera migración.
- Revisar en la Security Review del Sprint 01 si siguen siendo necesarias las excepciones EX-001 a EX-003.
