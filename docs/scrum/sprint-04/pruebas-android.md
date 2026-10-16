# Sprint 04 — Pruebas manuales en Android físico

Lista para verificar a mano E6-04, E7-01, E7-02, E9-01, E9-02, E8-01 y E11-04 en Android físico (criterio de la DoD). Sale de los criterios Gherkin de [`planning.md`](planning.md). El push solo llega en el APK de EAS (no en Expo Go ni en el navegador).

## Datos de la sesión de prueba

| Dato | Valor |
|---|---|
| Fecha | 16/10/2026 |
| Quién probó | Juan Felipe Pineda Cardona |
| Celulares (marca y modelo) | Samsung Galaxy del Samsung Remote Test Lab (PENDIENTE: modelos exactos) |
| Versión de Android (mínimo 9) | PENDIENTE: versión exacta |
| Build de EAS (perfil `preview`) | `d115a5d9-e332-412f-afd3-bd7fab9ccc37` |
| Ambiente | dev |

## Antes de empezar

1. **Dos teléfonos con el APK:** el del **menor** y el del **acudiente**. El contacto de apoyo y el colegio pueden entrar en el navegador del PC para ver las pantallas (sin push).
2. Al entrar como acudiente, **aceptar el permiso de notificaciones**.
3. Tener un contacto de apoyo aceptado (Sprint 02) y una cuenta del personal del colegio del menor.

## A. Modo discreto (E6-04)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| A1 | Menor: mantener AYUDA 3 s y dejar pasar los 10 s | Solo se ve "Hola, …" y un escudo 🛡 pequeño: sin "alerta", sin botón, sin mensajes | |
| A2 | Bajar la barra de notificaciones del menor | La notificación fija dice "NexaSafe · Servicio activo" | |

## B. Push (E7-01)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| B1 | Acudiente con el teléfono bloqueado; el menor dispara una alerta y no la cancela | A los ~10 s llega "🚨 (primer nombre) pidió ayuda" **con sonido** | |
| B2 | Tocar la notificación | Se abre la pantalla de la alerta (W11) | |
| B3 | El menor dispara otra alerta y la **cancela** con el PIN antes de 10 s | **No** llega ninguna notificación | |

## C. Respuesta, cierre y bitácora (E7-02, E9-01, E9-02, E11-04)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| C1 | Contacto de apoyo (navegador): abrir la alerta | Ve el mapa y "Voy en camino"; **no** ve "Cerrar alerta" | |
| C2 | Contacto de apoyo: "Voy en camino" | "Avisamos que vas en camino." y la alerta pasa a "Atendida" | |
| C3 | Acudiente: abrir la alerta | La bitácora muestra Disparada, Notificada y Voy en camino con nombres y horas | |
| C4 | Acudiente: "Cerrar alerta" → "Situación resuelta" → nota → "Cerrar alerta" | "La alerta quedó cerrada." y la bitácora agrega "Cerrada · (nombre) · Situación resuelta" | |
| C5 | Menor (E11-04) | En menos de 30 s sale del modo discreto y desaparece la notificación fija | |

## D. Puesto de control (E8-01)

| # | Pasos | Resultado esperado | Resultado |
|---|---|---|---|
| D1 | Personal del colegio: entrar | Abre en "Puesto de control" con "Alertas activas" | |
| D2 | El menor dispara una alerta | En 15 s o menos aparece en la lista y como punto rojo en el mapa | |
| D3 | Tocar un día del gráfico | Aparece el detalle del día, por ejemplo "16/10: 1 Situación resuelta" | |
| D4 | Abrir la alerta | Puede cerrarla; **no** ve "Voy en camino" | |
| D5 | "Matrículas pendientes ›" y luego "‹ Alertas activas" | Navega entre las dos pantallas | |
| D6 | Con un menor en trayecto **sin alerta** | El colegio **no** ve su posición (RF-41) | |

## Resultado de la sesión

| Bloque | OK | Falla | Observaciones |
|---|---|---|---|
| A. Modo discreto (E6-04) | | | PENDIENTE |
| B. Push (E7-01) | | | |
| C. Respuesta, cierre y bitácora | | | PENDIENTE |
| D. Puesto de control (E8-01) | | | |
