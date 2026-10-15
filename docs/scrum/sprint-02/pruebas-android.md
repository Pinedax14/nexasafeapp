# Sprint 02 — Pruebas manuales en Android físico

Lista para verificar a mano las historias del Sprint 02 en un Android físico (criterio de la DoD "probado en Android físico"). Sale de los criterios Gherkin de [`planning.md`](planning.md). Reemplaza la prueba E2E con Maestro mientras no se monte (decisión del 09/10/2026; se registra como desviación en la review).

El mapa (WebView + Leaflet) **no funciona en el navegador** (R9), así que E3-01a, E3-02 y la vista del mapa de E3-01b solo se pueden verificar aquí.

Lo que no se ve desde la app (políticas RLS, `audit_log`, límites del servidor para geometría, corredor y duración, límite de 10 invitaciones por hora) lo cubren las pruebas pgTAP, Deno y Jest del CI.

> **PENDIENTE: prueba en Android físico.** El 15/10/2026 el equipo decidió dejarla para más adelante (no hay un Android disponible por ahora). Las 7 historias del sprint quedan con este punto de la DoD abierto y se registra como desviación en la review.

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

1. Generar el APK desde `apps/mobile`: `npx eas build --platform android --profile preview` e instalarlo desde el enlace o QR de EAS.
2. Tener a mano:
   - una cuenta de **acudiente** con un menor **ACTIVO** (validado por el colegio) y su **PIN**;
   - el documento del menor;
   - un **correo nuevo** para el contacto de apoyo (por ejemplo `jufepica2004+apoyo<fecha>@gmail.com`);
   - un segundo teléfono o WhatsApp Web para recibir el enlace de invitación.
3. Si el menor tiene un trayecto `EN_CURSO` de una prueba anterior, cerrarlo en dev desde el SQL Editor de Supabase (D16: el cierre desde la app llega con E4-03 en el Sprint 03):

   ```sql
   update public.trayectos set estado = 'CERRADO', fin_en = now() where estado = 'EN_CURSO';
   ```

Marcar cada prueba con **OK** o **Falla**. Si falla, anotar qué pasó y tomar una captura.

## A. Acudiente: rutas sobre el mapa (E3-01a, E3-02, E3-03)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| A1 | Entrar como acudiente → en el menor activo, "Rutas ›" | Se abre "Rutas de <menor>" con "Casa → colegio" y "Colegio → casa" en "Sin definir" (si es la primera vez) | |
| A2 | Tocar "Casa → colegio" | Se ve el mapa de OpenStreetMap con calles y el texto "Toca el mapa para agregar puntos." | |
| A3 | Tocar el mapa en un solo punto → "Guardar ruta" | La app no la guarda y muestra "Marca al menos 2 puntos en el mapa." | |
| A4 | Agregar 3 o más puntos sobre el mapa → "Deshacer" | Se borra el último punto | |
| A5 | Tocar "−" y "+" del corredor varias veces | El texto "Corredor: N m" cambia y la franja alrededor de la línea se ve más angosta o más ancha en el mapa | |
| A6 | Bajar el corredor hasta el mínimo y subirlo hasta el máximo | No baja de 25 m ni sube de 200 m; por defecto empieza en 50 m | |
| A7 | Escribir 3 en "Duración esperada (min)" → "Guardar ruta" | La app no la guarda y muestra el error de la duración (5 a 120 minutos) | |
| A8 | Escribir 150 → "Guardar ruta" | La app no la guarda y muestra el mismo error | |
| A9 | Escribir 25 → "Guardar ruta" | Vuelve a "Rutas" y "Casa → colegio" muestra "Corredor N m · 25 min" | |
| A10 | Definir también "Colegio → casa" | Quedan las 2 rutas definidas | |
| A11 | Abrir otra vez "Casa → colegio", cambiar los puntos y guardar | La ruta se reemplaza (siguen siendo 2 rutas, no 3) | |

## B. Acudiente: caché sin conexión (E3-01b)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| B1 | Con las rutas de A ya guardadas, activar el modo avión → entrar a "Rutas ›" | Aparece "Sin conexión: estas son las rutas guardadas en el teléfono. Solo puedes verlas." y se ven las 2 rutas | |
| B2 | Abrir una ruta sin conexión | Aparece "Modo lectura: sin conexión no se pueden guardar cambios." y no se puede guardar | |
| B3 | Quitar el modo avión → "Cerrar sesión" → entrar de nuevo → activar el modo avión → "Rutas ›" | No aparecen las rutas de la sesión anterior: al cerrar sesión se borra la caché (también lo cubre Jest) | |

## C. Menor: iniciar trayecto e indicador (E4-01, E4-04)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| C1 | Con un menor **sin rutas** (otro menor o antes de A), entrar con "Soy menor: entrar con documento y PIN" | Aparece "Tu acudiente todavía no ha definido tus rutas." y no hay botones de trayecto | |
| C2 | Entrar con el menor de A | Aparece "¿A dónde vas?" con los botones "Casa → colegio" y "Colegio → casa"; **no** aparece la banda "🛡 Te estamos acompañando" | |
| C3 | Tocar "Casa → colegio" una sola vez | Aparece el trayecto en curso con "En curso desde las <hora>", "Tu acudiente sabe que vas en camino." y la banda "🛡 Te estamos acompañando" arriba | |
| C4 | Cerrar la app por completo y abrirla otra vez | Sigue el trayecto en curso con la banda (no se creó otro) | |
| C5 | En el teléfono del acudiente (o entrando como acudiente), abrir "Mis menores" y tocar "Actualizar" si hace falta | El menor muestra "En trayecto · en curso desde las <hora>" | |
| C6 | En los ajustes de Android → Aplicaciones → NexaSafe → Permisos | La app **no** tiene el permiso de ubicación concedido ni lo pidió (la ubicación llega con E4-02, Sprint 03) | |

## D. Red de apoyo: invitar y aceptar (E2-01)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| D1 | Como acudiente, en el menor activo → "Red ›" | Se abre "Red de apoyo de <menor>" con "Todavía no has invitado a nadie." (si es la primera vez) | |
| D2 | "Invitar a un contacto" | Se abre el menú de compartir de Android con un enlace `nexasafe://…` y un código; se ve "El enlace sirve una sola vez y vence en 72 horas." | |
| D3 | Compartirlo a WhatsApp o al otro teléfono, volver a la app | En la lista aparece "Invitación · Vence el <dd/mm>" (3 días después) | |
| D4 | "Cerrar sesión" → "Tengo una invitación" → pegar un código inventado → "Continuar" | "Esta invitación ya no es válida. Pide una nueva." | |
| D5 | Pegar el código o el enlace real de D2 → "Continuar" | "Te invitaron a la red de apoyo de <solo el primer nombre del menor>" e "Invitación de <acudiente>." | |
| D6 | Nombre, correo nuevo y contraseña → "Crear cuenta y aceptar" | "Revisa tu correo" (o entra directo si "Confirm email" está apagado en dev) | |
| D7 | Confirmar el correo si hace falta → iniciar sesión con la cuenta de apoyo | Entra a la pantalla de apoyo con "Alertas", "Aún no hay alertas." y "Solo verás las alertas del menor, no sus trayectos." No ve rutas, trayectos ni "Mis menores" | |
| D8 | Cerrar sesión → "Tengo una invitación" → pegar otra vez el mismo código | "Esta invitación ya no es válida. Pide una nueva." | |
| D9 | Entrar como el acudiente → "Red ›" | El contacto aparece con su nombre y el estado "Aceptó" | |
| D10 | En el otro teléfono con la app instalada, tocar el enlace `nexasafe://` de una invitación nueva | La app se abre directo en "Tengo una invitación" con el código ya puesto | |

## Resultado de la sesión

| Bloque | OK | Falla | Observaciones |
|---|---|---|---|
| A. Rutas (E3-01a, E3-02, E3-03) | | | |
| B. Caché (E3-01b) | | | |
| C. Trayecto e indicador (E4-01, E4-04) | | | |
| D. Red de apoyo (E2-01) | | | |
