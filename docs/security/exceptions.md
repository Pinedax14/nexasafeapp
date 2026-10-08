# Excepciones de seguridad

> No hay excepciones permanentes. Toda excepción vence.
>
> Las excepciones de SCA se reflejan también en [`audit-allowlist.json`](audit-allowlist.json), que lee el gate del CI (`apps/mobile/scripts/audit-gate.js`). El CI falla si una excepción vence o si aparece un hallazgo High/Critical sin excepción.

| ID | Hallazgo | Severidad | Justificación | Responsable | Fecha de vencimiento | Estado |
|---|---|---|---|---|---|---|
| EX-001 | `image-size` 1.2.1 — DoS por bucle infinito en parsers JXL/HEIF/ICNS ([GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)) | High | Dependencia de `metro` (herramienta de build de Expo SDK 54). Solo procesa imágenes del propio repositorio al empaquetar; no viaja en el APK. La versión corregida (2.x) cambia la API que usa `metro` | Juan Felipe Pineda Cardona (Security Champion) | 2026-10-31 | Aprobada el 03/10/2026; renovada el 05/10/2026 |
| EX-002 | `node-forge` 1.4.0 — verificación de firma RSA PKCS#1 v1.5 laxa ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)) | High | Dependencia de `@expo/cli` (servidor de desarrollo y firma de código de desarrollo). No viaja en el APK. No existe versión corregida | Juan Felipe Pineda Cardona (Security Champion) | 2026-10-31 | Aprobada el 03/10/2026; renovada el 05/10/2026 |
| EX-003 | `braces` 3.0.3 — DoS por patrones anidados ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) | High | Dependencia de `jest` (solo pruebas). Solo recibe patrones del propio repositorio. No viaja en el APK. No existe versión corregida | Juan Felipe Pineda Cardona (Security Champion) | 2026-10-31 | Aprobada el 03/10/2026; renovada el 05/10/2026 |

**Revisión del Sprint 01 (05/10/2026):** se verificó con `npm audit` y `npm view` que sigue sin existir una corrección compatible con Expo SDK 54:

- `image-size`: la versión corregida (2.0.4) cambia la API que usa `metro`; `npm audit` solo propone bajar `expo` a 44 (salto mayor).
- `node-forge`: la última versión publicada (1.4.0) es la vulnerable.
- `braces`: la última versión publicada (3.0.3) es la vulnerable; la corrección pasa por `jest` 30, que `jest-expo` 54 no soporta.

Las tres siguen siendo herramientas de build o de pruebas que no viajan en el APK. Se renuevan hasta el cierre del Sprint 02 (**31/10/2026**), cuando se revisan de nuevo.

**Hallazgos Moderate sin excepción** (el gate solo bloquea High/Critical): `uuid` < 11.1.1, `xcode` y paquetes de configuración de Expo, dependencias de las herramientas de Expo. No viajan en el APK. Quedan en seguimiento como SEC-04.

**Mitigaciones aplicadas sin excepción** (mediante `overrides` en `apps/mobile/package.json`):

- `postcss` 8.4.49 → 8.5.28 (GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849).
- `shell-quote` 1.10.0 → 1.12.0 (GHSA-pqg4-j6r4-53mv, Critical, inyección de comandos en `quote()`), dependencia de `react-devtools-core` (herramienta de desarrollo de React Native). Detectado por el gate del CI el 08/10/2026.
