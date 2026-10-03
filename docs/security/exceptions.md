# Excepciones de seguridad

> No hay excepciones permanentes. Toda excepción vence.
>
> Las excepciones de SCA se reflejan también en [`audit-allowlist.json`](audit-allowlist.json), que lee el gate del CI (`apps/mobile/scripts/audit-gate.js`). El CI falla si una excepción vence o si aparece un hallazgo High/Critical sin excepción.

| ID | Hallazgo | Severidad | Justificación | Responsable | Fecha de vencimiento | Estado |
|---|---|---|---|---|---|---|
| EX-001 | `image-size` 1.2.1 — DoS por bucle infinito en parsers JXL/HEIF/ICNS ([GHSA-w3rx-r6r6-pgpr](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [GHSA-5p2g-fcmc-qvqq](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq)) | High | Dependencia de `metro` (herramienta de build de Expo SDK 54). Solo procesa imágenes del propio repositorio al empaquetar; no viaja en el APK. La versión corregida (2.x) cambia la API que usa `metro` | PENDIENTE: Security Champion | 2026-10-17 | Propuesta — PENDIENTE aprobación |
| EX-002 | `node-forge` 1.4.0 — verificación de firma RSA PKCS#1 v1.5 laxa ([GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)) | High | Dependencia de `@expo/cli` (servidor de desarrollo y firma de código de desarrollo). No viaja en el APK. No existe versión corregida | PENDIENTE: Security Champion | 2026-10-17 | Propuesta — PENDIENTE aprobación |
| EX-003 | `braces` 3.0.3 — DoS por patrones anidados ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) | High | Dependencia de `jest` (solo pruebas). Solo recibe patrones del propio repositorio. No viaja en el APK. No existe versión corregida | PENDIENTE: Security Champion | 2026-10-17 | Propuesta — PENDIENTE aprobación |

**Revisión:** en la Security Review del Sprint 01 (17/10/2026) el Security Champion verifica si ya hay versiones corregidas o si Expo actualizó estas dependencias, y renueva o cierra cada excepción.

**Mitigación aplicada sin excepción:** `postcss` 8.4.49 → 8.5.28 mediante `overrides` en `apps/mobile/package.json` (GHSA-6g55-p6wh-862q, GHSA-r28c-9q8g-f849).
