# Sprint 04 — Review

**Ceremonia planificada:** 28/10/2026 según el Excel de ejecución · **Fecha real:** feedback del PO informado el 22/10/2026
**Sprint Goal:** el puesto de control atiende alertas desde la app y deja bitácora del incidente.
**Hito H4:** ubicación en vivo y flujo alerta → notificación → respuesta → cierre completo; fin del desarrollo.
**Sprint Goal cumplido:** Sí. Las 7 historias están integradas en `main`, con prueba en Android física hecha el 20/10/2026 (OPPO Reno 11, Android 15, build `preview`; detalle en [`pruebas-android.md`](pruebas-android.md)).

| Historia | Pts | Estado | Feedback del PO |
|---|---|---|---|
| E9-01 Bitácora inmutable de cada evento del incidente | 5 | Aceptada | Confirmada por Juan Felipe Pineda Cardona el 22/10/2026, con la prueba en Android ya hecha |
| E7-01 Notificación push con sonido prioritario ante una alerta | 5 | Aceptada | Ídem |
| E7-02 Marcar "voy en camino" sobre una alerta | 3 | Aceptada | Ídem |
| E9-02 Cerrar la alerta clasificándola | 3 | Aceptada | Ídem |
| E8-01 Puesto de control con alertas en el mapa y gráfico interactivo | 8 | Aceptada, con un bug corregido antes del cierre (ver abajo) | Ídem |
| E6-04 Modo discreto de la pantalla durante la alerta | 5 | Aceptada | Ídem |
| E11-04 No compartir la ubicación fuera de trayecto o alerta | 3 | Aceptada | Ídem |

**Velocidad:** 32 pts completados de 32 comprometidos (R6 aceptado: el equipo mantuvo el alcance completo con un integrante).

## Qué se revisó

Incremento disponible en `main` (ver el detalle de commits en [`CHANGELOG.md`](../../../CHANGELOG.md), sección Sprint 04):

- Migración `sprint_04_bitacora_respuesta_push`: bitácora `eventos_incidente` append-only, cierre clasificado de alertas, lectura para contacto de apoyo y colegio (solo durante alerta activa, RF-41), tabla `dispositivos_push` y trigger que llama a `notify-push`. 46 pruebas pgTAP.
- Edge Function `notify-push`: envía el push por Expo tras la ventana de 10 s si la alerta sigue `ENVIADA`, sin ubicación en el mensaje. 12 pruebas Deno.
- Pantalla de la alerta con mapa, "Voy en camino", cierre con 3 clasificaciones y nota, y bitácora con actores.
- Puesto de control del colegio: alertas activas en mapa y lista, y gráfico interactivo de 14 días por clasificación.
- Modo discreto: al vencer la ventana de 10 s la pantalla del menor vuelve a verse normal, sin palabra "alerta" ni botón.

## Bug encontrado y corregido antes del cierre

Probando la cuenta de `institucion` (puesto de control, E8-01) con un colegio sin historial de alertas, el gráfico interactivo (`react-native-gifted-charts`) se caía: la librería lee `stacks[0]` de cada día sin validar que exista, y un día sin alertas producía un arreglo vacío. Se corrigió rellenando esos días con un valor en 0 en vez de un arreglo vacío. Con pruebas verificadas (7/7 en `ControlRoomScreen.test.tsx`) antes de aceptar la historia.

## Estado de seguridad

- **Hallazgos Critical/High abiertos sin excepción:** 0 (verificado con `npm run audit:gate` local sobre `main`).
- **Excepciones EX-001 a EX-003:** vencían el 31/10/2026; PENDIENTE renovarlas o corregirlas antes de esa fecha.
- PENDIENTE: no hay `gh` autenticado en esta sesión para confirmar los runs de CodeQL y de secret scanning de GitHub Actions.
- El refinement del Sprint 04 ya incluyó el STRIDE de E6/E7/E8/E9 en `threat-model.md` (15/10/2026); no se identificaron hallazgos nuevos que exijan una Security Review aparte en el cierre.

## Desviaciones frente a la Definition of Done

- **Prueba en Android físico:** hecha el 20/10/2026 (ver arriba, con las dos cuentas — menor y acudiente — en el mismo OPPO Reno 11, en sesiones separadas).
- **Prueba E2E con Maestro:** no se hizo.
- **PR aprobado por un compañero:** PENDIENTE confirmar — no se pudo verificar sin `gh` autenticado.
- **Fechas:** el Excel de ejecución planificaba el sprint del 20/10 al 28/10; `PLAN_NEXASAFE.md` v1.2 lo tenía del 17 al 24 de noviembre. El equipo adelantó el cierre real a hoy, 22/10/2026 (fecha de sustentación confirmada por el Product Owner).

## Participación del equipo

PENDIENTE: no se registraron las horas por integrante de este sprint.

## Trabajo no planificado (sin estimación en puntos)

- Ver [`sprint-03/review.md`](../sprint-03/review.md): catálogo de colegios, buscador, fix de overflow del nombre de colegio en `AdminSchoolsScreen`, fix del ícono de contraseña duplicado en Edge, reacomodo de "Cerrar sesión" en el panel de administración.
