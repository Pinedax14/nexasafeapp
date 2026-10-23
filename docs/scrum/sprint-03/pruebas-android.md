# Sprint 03 — Pruebas manuales en Android físico

Lista para verificar a mano E4-02, E4-03, E6-01, E6-03 y E6-05 en un Android físico (criterio de la DoD "probado en Android físico"). Sale de los criterios Gherkin de [`planning.md`](planning.md). La ubicación en segundo plano **no funciona** en el navegador ni en Expo Go: se prueba con el APK de EAS (perfil `preview`).

Lo que no se ve desde la app (RLS, cifrado de `posiciones`, `audit_log`, límites del servidor) lo cubren las pruebas pgTAP, Deno y Jest del CI.

## Datos de la sesión de prueba

**Sesión 1 — 16/10/2026** (Samsung Remote Test Lab): A1–A2 OK; A3–A6, B1–B2 y D1 quedaron pendientes porque el celular remoto no está físicamente en Colombia (no hay GPS real); C quedó pendiente de repetir.

| Dato | Valor |
|---|---|
| Fecha | 16/10/2026 |
| Quién probó | Juan Felipe Pineda Cardona |
| Celular (marca y modelo) | Samsung Galaxy del Samsung Remote Test Lab (PENDIENTE: modelo exacto) |
| Versión de Android (mínimo 9) | PENDIENTE: versión exacta |
| Build de EAS (perfil `preview`) | `d115a5d9-e332-412f-afd3-bd7fab9ccc37` |
| Ambiente | dev |

**Sesión 2 — 20/10/2026** (celular propio en Colombia, con GPS real): completa lo que la Sesión 1 no pudo verificar.

| Dato | Valor |
|---|---|
| Fecha | 20/10/2026 |
| Quién probó | Juan Felipe Pineda Cardona |
| Celular (marca y modelo) | OPPO Reno 11 |
| Versión de Android | 15 |
| Build de EAS (perfil `preview`) | `preview` |
| Ambiente | dev |

## Antes de empezar

1. Instalar el APK `preview` en el celular del **menor**. El **acudiente** usa otro teléfono con el APK o la app en el navegador del PC (`npx expo start` → `w`).
2. Tener un menor ACTIVO, con PIN y con la ruta "Casa → colegio" definida. **Para probar la llegada (E4-03)**, dibujar la ruta de modo que su **último punto** quede en un lugar al que se pueda caminar (por ejemplo, la esquina de la cuadra).
3. Si quedó un trayecto o una alerta de pruebas anteriores, cerrarlos en el SQL Editor de Supabase (dev):

   ```sql
   update public.trayectos set estado = 'CERRADO', fin_en = now() where estado = 'EN_CURSO';
   update public.alertas set estado = 'CERRADA', clasificacion = 'FALSA_ALARMA', cerrada_en = now()
   where estado in ('ENVIADA', 'ATENDIDA');
   ```

Marcar cada prueba con **OK** o **Falla**. Si falla, anotar qué pasó y tomar una captura.

## A. Permiso y ubicación en vivo (E4-02)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| A1 | Menor: tocar "Casa → colegio" por primera vez | Aparece "Para acompañarte necesitamos tu ubicación" (W8) y el trayecto todavía no empieza | OK |
| A2 | "Continuar" → en los diálogos de Android elegir "Mientras la app está en uso" y luego **"Permitir todo el tiempo"** | Empieza el trayecto, aparece la banda "🛡 Te estamos acompañando" y en la barra de Android la notificación fija "NexaSafe te está acompañando" | OK |
| A3 | Acudiente: en "Mis menores" tocar "Ver en vivo ›" | Se ve el mapa con la ruta, el punto rojo del menor y "Última posición: hace N s" | OK (Sesión 2) |
| A4 | Menor: caminar 1–2 cuadras con la **pantalla apagada** | En el acudiente el punto se mueve (cada 15 s o 20 m) | OK (Sesión 2) |
| A5 | Menor: quitar la app de recientes y seguir caminando | La notificación fija sigue y el punto sigue moviéndose. **Si se detiene, anotar marca y modelo: es el riesgo R1** | OK (Sesión 2) |
| A6 | Con otro menor: negar la ubicación en W8 | "Sin permiso de ubicación tu acudiente no puede acompañarte." y no se inicia el trayecto | OK (Sesión 2) |

## B. Llegada automática (E4-03)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| B1 | Menor: caminar hasta menos de 50 m del último punto de la ruta | El trayecto se cierra solo: desaparecen la banda y la notificación fija, y vuelven los botones "¿A dónde vas?" | OK (Sesión 2) |
| B2 | Acudiente: en "Ver en vivo" | Aparece "Llegó a las …" | OK (Sesión 2) |

## C. Botón de pánico y cancelación (E6-01, E6-03)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| C1 | Menor: tocar y soltar "AYUDA" antes de 3 s | No pasa nada | OK (Sesión 2) |
| C2 | Mantener "AYUDA" 3 s | "Alerta enviada" con la cuenta regresiva de 10 s y el campo de PIN | OK (Sesión 2) |
| C3 | Escribir un PIN incorrecto → "Cancelar" | "El PIN no es correcto." y la alerta sigue | OK (Sesión 2) |
| C4 | Escribir el PIN correcto antes de 10 s → "Cancelar" | "Alerta cancelada." y vuelve el botón AYUDA | OK (Sesión 2) |
| C5 | Disparar otra alerta y dejar pasar los 10 s | La pantalla entra en modo discreto (Sprint 04, prueba A1) | OK (Sesión 2) |

## D. Ubicación durante la alerta (E6-05)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| D1 | Con una alerta activa y **sin trayecto**, caminar | El acudiente ve la posición actualizarse cada ~5 s en la pantalla de la alerta | OK (Sesión 2) |
| D2 | El acudiente cierra la alerta (Sprint 04, prueba C4) | En menos de 30 s el menor sale del modo discreto y la notificación fija desaparece | OK (Sesión 2) |

## Resultado de la sesión

| Bloque | OK | Falla | Observaciones |
|---|---|---|---|
| A. Ubicación en vivo (E4-02) | 6 | 0 | A1–A2 en la Sesión 1 (16/10); A3–A6 completadas en la Sesión 2 (20/10, con GPS real) |
| B. Llegada (E4-03) | 2 | 0 | Completada en la Sesión 2 (20/10) |
| C. Pánico y cancelación (E6-01, E6-03) | 5 | 0 | Repetida en la Sesión 2 (20/10); la cancelación sí se vio funcionar |
| D. Ubicación en la alerta (E6-05) | 2 | 0 | Completada en la Sesión 2 (20/10) |
