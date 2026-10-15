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

## Resultados Sprint 01 (09/10/2026)

| Elemento | Resultado |
|---|---|
| Cobertura unitaria (`domain` + `data` + `core/storage`) | 99,36 % líneas, 96,55 % ramas (umbral de la DoD: 70 %) |
| Pruebas unitarias | 177 pasan / 177 total (23 suites Jest) |
| Pruebas de políticas RLS (RNF-27) | 77 aserciones pgTAP en 4 archivos, ejecutadas por el CI sobre una base de datos efímera |
| Pruebas de Edge Functions | Pruebas Deno de `admin-personal` y `auth-pin` (rol, rate limiting, Argon2id, bloqueo por menor y por IP), ejecutadas por el CI |
| Flujos E2E ejecutados | Ninguno con Maestro. El flujo 1 (registro → alta del menor → validación → ingreso con PIN) se verificó a mano con el APK de prueba en un Android físico (05/10/2026) |
| SAST (Semgrep / CodeQL) | Semgrep sin High/Critical en los PR integrados. CodeQL: 42 runs en verde y 2 en rojo en PR, corregidos antes del merge |
| SCA (`npm audit --audit-level=high`) | 4 advisories High cubiertos por EX-001 a EX-003 (vencen el 31/10/2026); 0 Critical abiertos. `shell-quote` (Critical) corregido el 08/10/2026 con `overrides` |
| Secretos (Gitleaks) | Limpio en todos los PR integrados |
| Pipeline CI en `main` | 14 runs en verde, 0 en rojo |
| Bugs abiertos / cerrados | 0 / 0 |

**Defectos relevantes:** la Security Review (05/10/2026) encontró SEC-01 (`auth-pin` sin límite de intentos por IP) y SEC-03 (contraseña temporal del personal sin cambio obligatorio); ambos se corrigieron con pruebas en el PR #31.

**Acciones para el siguiente sprint:**
- Montar Maestro y automatizar el flujo E2E 1 antes de las historias de E3 y E4.
- Probar en un Android físico las historias de mapa y GPS (riesgo R1 y R9).

## Resultados Sprint 02 (15/10/2026)

| Elemento | Resultado |
|---|---|
| Cobertura unitaria (`domain` + `data` + `core/storage`) | 99,59 % líneas, 97,67 % ramas (umbral de la DoD: 70 %) |
| Pruebas unitarias | 320 pasan / 320 total (37 suites Jest) |
| Pruebas de políticas RLS (RNF-27) | 123 aserciones pgTAP en 5 archivos (46 nuevas para `rutas`, `trayectos` y `contactos_apoyo`), ejecutadas por el CI sobre una base de datos efímera |
| Pruebas de Edge Functions | Sin cambios: `admin-personal` y `auth-pin`, ejecutadas por el CI |
| Flujos E2E ejecutados | Ninguno. La prueba manual en Android físico ([`pruebas-android.md`](../../scrum/sprint-02/pruebas-android.md)) quedó pendiente porque no hay un Android disponible; el mapa (WebView + Leaflet) no funciona en el navegador y solo está cubierto por pruebas automáticas |
| SAST (Semgrep / CodeQL) | Semgrep sin High/Critical en los PR integrados. CodeQL: 49 runs en verde, 0 alertas abiertas |
| SCA (`npm audit --audit-level=high`) | 4 advisories High cubiertos por EX-001 a EX-003 (vencen el 31/10/2026); 0 Critical; 16 Moderate en herramientas de build y pruebas (SEC-04) |
| Secretos (Gitleaks) | Limpio en todos los PR integrados; 0 alertas de secret scanning |
| Pipeline CI en `main` | 13 runs en verde, 1 en rojo por un fallo de infraestructura (límite de peticiones de GitHub al descargar la CLI de Supabase) |
| Bugs abiertos / cerrados | 0 / 0 |

**Defectos relevantes:** ninguno en el código. La Security Review (15/10/2026) registró SEC-05 (alertas de Dependabot desactivadas) y SEC-06 (enlace de invitación con esquema propio `nexasafe://`), ambos Low.

**Acciones para el siguiente sprint:**
- Correr la lista de pruebas en Android del Sprint 02 en un Android fijo o en un emulador antes de E4-02.
- Investigar R1 (ubicación en segundo plano) antes de construir E4-02.
- Renovar o corregir EX-001 a EX-003 antes del 31/10/2026.
