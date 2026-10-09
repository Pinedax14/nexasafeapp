# Sprint 01 — Pruebas manuales en Android físico

Lista para verificar a mano las historias del Sprint 01 en un Android físico (criterio de la DoD "probado en Android físico"). Sale de los criterios Gherkin de [`planning.md`](planning.md). Reemplaza la prueba E2E con Maestro mientras no se monte (decisión del 09/10/2026; se registra como desviación en cada review).

Lo que no se ve desde la app (políticas RLS, `audit_log`, consentimiento inmutable, almacenamiento en `expo-secure-store`) lo cubren las pruebas pgTAP, Deno y Jest del CI.

## Datos de la sesión de prueba

| Dato | Valor |
|---|---|
| Fecha | |
| Quién probó | |
| Celular (marca y modelo) | |
| Versión de Android (mínimo 9) | |
| Build de EAS (perfil `preview`) | |
| Ambiente | dev |

## Antes de empezar

1. Instalar el APK de la build `preview` desde el enlace o QR de EAS.
2. Tener a mano tres cuentas: la de **administrador**, una de **acudiente** nueva (por ejemplo `jufepica2004+prueba<fecha>@gmail.com`) y la de una persona del **colegio** que se crea en la prueba A2.
3. Tener una foto en el celular para el alta del menor.

Marcar cada prueba con **OK** o **Falla**. Si falla, anotar qué pasó y tomar una captura.

## A. Administrador (E1-06)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| A1 | Entrar con la cuenta de administrador → "Nuevo colegio" → nombre y NIT → "Crear colegio" | El colegio aparece en la lista "Colegios" | |
| A2 | En el colegio, "Personal ›" → nombre, cargo, correo y contraseña temporal (8+ caracteres) → "Registrar personal" | Aparece "Cuenta creada. Entrega la contraseña temporal…" y la persona sale en "Personal registrado" | |
| A3 | Crear otro colegio con el mismo NIT | La app no lo crea y muestra un error | |
| A4 | "Cerrar sesión" | Vuelve a la pantalla de ingreso | |

## B. Acudiente: registro y sesión (E1-01, E1-05)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| B1 | "¿No tienes cuenta? Regístrate" → nombre, correo nuevo y contraseña de menos de 8 caracteres | La app no deja crear la cuenta y pide una contraseña más larga | |
| B2 | Repetir con una contraseña de 8 o más caracteres → "Crear cuenta" | Se crea la cuenta y entra (o pide confirmar el correo si "Confirm email" está activo) | |
| B3 | Cerrar sesión e intentar registrarse otra vez con el mismo correo | Mensaje genérico que no dice si el correo ya existe | |
| B4 | Entrar con contraseña incorrecta | "Correo o contraseña incorrectos." | |
| B5 | Entrar bien → cerrar la app por completo (quitarla de recientes) → abrirla otra vez | Sigue en "Mis menores" sin pedir contraseña | |
| B6 | Dejar la app abierta más de 15 minutos y luego tocar "Actualizar" | Sigue funcionando sin pedir contraseña (renovó la sesión sola) | |
| B7 | "Cerrar sesión" → cerrar y abrir la app | Pide ingresar de nuevo | |

## C. Acudiente: alta del menor y consentimiento (E1-02, E11-01)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| C1 | "Registrar menor" → llenar nombre, documento, colegio (el de A1) y foto, **sin** marcar "Acepto la política de tratamiento de datos" | "Debes aceptar la política de tratamiento de datos para registrar al menor." | |
| C2 | Abrir la sección "Tratamiento de datos" | Se lee la política completa en la app | |
| C3 | Marcar la casilla → "Registrar menor" | El menor aparece en "Mis menores" como pendiente de validación | |
| C4 | Intentar asignarle PIN ("PIN ›") | "El colegio todavía no ha validado a este menor." | |
| C5 | Entrar con otra cuenta de acudiente | No ve el menor de C3 | |

## D. Colegio: validación (E1-03 y SEC-03)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| D1 | Entrar con la cuenta creada en A2 y su contraseña temporal | Aparece "Cambia tu contraseña" y no deja ver menores | |
| D2 | Poner la nueva contraseña → "Guardar contraseña" | Entra a "Puesto de control" → "Matrículas pendientes" | |
| D3 | Revisar la lista | Solo aparece el menor de C3 (pendientes de su colegio) | |
| D4 | "Revisar ›" | Se ven nombre, documento y foto del menor | |
| D5 | "Validar matrícula" | El menor sale de la lista de pendientes | |
| D6 | Entrar como el acudiente de C3 | El menor aparece como activo | |

## E. Menor: PIN e ingreso (E1-04 y SEC-01)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| E1 | Acudiente → "PIN ›" → escribir `1234` en "Nuevo PIN" y "Confirmar PIN" → "Guardar PIN" | "Ese PIN es muy fácil de adivinar. Elige otro." | |
| E2 | "Generar PIN aleatorio" | Muestra un PIN de 4 números una sola vez; anotarlo | |
| E3 | Cerrar sesión → "Soy menor: entrar con documento y PIN" → documento y PIN de E2 → "Entrar" | Entra como menor | |
| E4 | Cerrar sesión → entrar con el documento correcto y un PIN equivocado | "Documento o PIN incorrectos." | |
| E5 | Entrar con un documento que no existe | El mismo mensaje "Documento o PIN incorrectos." | |
| E6 | Fallar el PIN 5 veces seguidas con el mismo documento | "Demasiados intentos. Espera unos minutos e intenta de nuevo." (dura 15 minutos) | |
| E7 | Volver a asignar un PIN desde el acudiente y entrar con él | El menor entra de nuevo (el PIN nuevo levanta el bloqueo) | |

## Resultado

| Dato | Valor |
|---|---|
| Pruebas OK | |
| Pruebas con falla | |
| Issues creados por las fallas | |
