# Sprint 03 — Review

**Ceremonia planificada:** 19/10/2026 según el Excel de ejecución · **Fecha real:** feedback del PO informado el 22/10/2026
**Sprint Goal:** el guardián sigue el trayecto en vivo y el botón de pánico funciona de extremo a extremo con cancelación por PIN.
**Sprint Goal cumplido:** Sí. Las 5 historias están integradas en `main`, con prueba en Android físico hecha el 20/10/2026 (OPPO Reno 11, Android 15, build `preview`; detalle en [`pruebas-android.md`](pruebas-android.md)).

| Historia | Pts | Estado | Feedback del PO |
|---|---|---|---|
| E4-02 Ubicación del protegido en vivo durante el trayecto | 8 | Aceptada | Confirmada por Juan Felipe Pineda Cardona el 22/10/2026, con la prueba en Android ya hecha |
| E4-03 Cierre automático del trayecto al llegar (geocerca) | 5 | Aceptada | Ídem |
| E6-01 Disparar alerta manteniendo presionado el botón 3 s | 5 | Aceptada | Ídem |
| E6-03 Cancelar la alerta con el PIN dentro de 10 s | 3 | Aceptada | Ídem |
| E6-05 Enviar la ubicación cada 5 s durante la alerta | 5 | Aceptada | Ídem |

**Velocidad:** 26 pts completados de 26 comprometidos (R6 aceptado: el equipo mantuvo el alcance completo).

## Qué se revisó

Incremento disponible en `main` (ver el detalle de commits en [`CHANGELOG.md`](../../../CHANGELOG.md), sección Sprint 03):

- Migración `sprint_03_posiciones_alertas`: tablas `alertas` y `posiciones` (coordenadas cifradas con `pgcrypto`) con RLS; funciones `disparar_alerta`, `cancelar_alerta_verificada`, `registrar_posicion` y `obtener_ultima_posicion`; canal privado de Realtime por menor. 43 pruebas pgTAP.
- El menor comparte su posición cada 15 s o 20 m mientras el trayecto está `EN_CURSO` (servicio en primer plano de Android, notificación fija), y cada 5 s durante una alerta activa. El guardián ve la posición en vivo en "Ver en vivo ›".
- El trayecto se cierra solo al llegar a menos de 50 m del destino.
- Botón "AYUDA": se dispara al mantenerlo presionado 3 s, con ventana de 10 s para cancelar con el PIN (Edge Function `auth-pin`, acción `cancelar_alerta`).

## Estado de seguridad

- **Hallazgos Critical/High abiertos sin excepción:** 0 (verificado con `npm run audit:gate` local sobre `main`).
- **Excepciones EX-001 a EX-003:** vencían el 31/10/2026; PENDIENTE renovarlas o corregirlas antes de esa fecha.
- PENDIENTE: no hay `gh` autenticado en esta sesión para confirmar los runs de CodeQL y de secret scanning de GitHub Actions; se verificó solo con las herramientas que corren localmente.

## Desviaciones frente a la Definition of Done

- **Prueba en Android físico:** hecha el 20/10/2026 (ver arriba). Queda cerrada la desviación que venía del Sprint 02.
- **Prueba E2E con Maestro:** no se hizo (sigue reemplazada por la prueba manual en Android, decisión del 09/10/2026).
- **PR aprobado por un compañero:** PENDIENTE confirmar — no se pudo verificar sin `gh` autenticado.
- **Fechas:** el Excel de ejecución planificaba el sprint del 05/10 al 19/10; el trabajo real se integró a partir del 15/10 y cerró el 22/10/2026.

## Participación del equipo

PENDIENTE: no se registraron las horas por integrante de este sprint (sí están para los Sprints 00-02).

## Trabajo no planificado (sin estimación en puntos)

- Fix de un bug real en `ControlRoomScreen` (E8-01, Sprint 04) encontrado durante las pruebas de la cuenta de `institucion`: el gráfico se caía en un colegio sin historial de alertas (`react-native-gifted-charts` leía `stacks[0]` de un arreglo vacío). Corregido y con sus 7 pruebas pasando.
- Catálogo real de los 417 colegios públicos de Bogotá (fuente: Secretaría de Educación del Distrito) cargado en `colegios`, con buscador por nombre agregado a los selectores de colegio.
- Product Backlog (Excel) y este registro de sprints puestos al día: llevaban desde el cierre del Sprint 02 sin reflejar que los Sprints 03 y 04 ya habían arrancado.
