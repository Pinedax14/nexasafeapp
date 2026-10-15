# Sprint 02 — Review

**Ceremonia planificada:** 31/10/2026 según el Cronograma (03); el Excel de ejecución la reacomodó al 02/10/2026 · **Fecha real:** feedback del PO informado el 15/10/2026 (documento escrito el 15/10/2026)
**Sprint Goal:** un guardián puede definir la ruta del protegido y el protegido puede iniciar un trayecto acompañado.
**Sprint Goal cumplido:** Sí en el código: las 7 historias están integradas en `main` con el CI en verde. **Falta verificarlo en un Android físico**, así que el hito H3 (ruta sobre el mapa y trayecto `EN_CURSO` con indicador, en un dispositivo) queda pendiente de esa prueba.

| Historia | Pts | Estado | Feedback del PO |
|---|---|---|---|
| E3-01a Definir la ruta casa–colegio sobre un mapa y guardarla en el servidor | 5 | Aceptada, prueba en Android pendiente | "Quedó muy bien; falta revisar el funcionamiento en Android, pero en general excelente" (aplica a todo el incremento) |
| E3-01b Caché local de la ruta y vista sin conexión | 3 | Aceptada, prueba en Android pendiente | Ídem |
| E3-02 Configurar corredor de tolerancia en metros | 3 | Aceptada, prueba en Android pendiente | Ídem |
| E3-03 Definir duración esperada del trayecto | 3 | Aceptada, prueba en Android pendiente | Ídem |
| E4-01 Iniciar trayecto acompañado con un toque | 5 | Aceptada, prueba en Android pendiente | Ídem |
| E4-04 Indicador permanente de acompañamiento activo | 2 | Aceptada, prueba en Android pendiente | Ídem |
| E2-01 Invitar contactos de apoyo por enlace | 5 | Aceptada, prueba en Android pendiente | Ídem |

**Velocidad:** 26 pts completados de 26 comprometidos, con el punto de la DoD "probado en Android físico" abierto en las 7 historias (issues #45 a #51 abiertos hasta hacerlo).

## Qué se revisó

El PO revisó el incremento del Sprint 02, dijo que quedó muy bien y pidió revisar el funcionamiento en Android. No pidió cambios de alcance.

Incremento disponible en `main` (PR #40, #42 y #56 a #59):

- Esquema del sprint: `rutas`, `trayectos` y `contactos_apoyo` con PostGIS, RLS y 46 pruebas pgTAP.
- El guardián dibuja hasta 2 rutas (ida y regreso) sobre un mapa de OpenStreetMap, con corredor de 25 a 200 m y duración esperada de 5 a 120 min, validados en la app y en el servidor.
- Las rutas quedan cifradas en el teléfono para verlas sin conexión y se borran al cerrar sesión.
- El menor inicia un trayecto `EN_CURSO` con un toque y ve la banda "🛡 Te estamos acompañando"; el acudiente lo ve "En trayecto".
- El guardián invita contactos de apoyo con un enlace de un solo uso (72 h); el contacto crea su cuenta con rol `apoyo` y solo ve alertas.

## Estado de seguridad

Security Review del 15/10/2026 (detalle en [`risk-register.md`](../../security/risk-register.md)):

- **Hallazgos Critical/High abiertos sin excepción:** 0. CodeQL y secret scanning: 0 alertas abiertas.
- **Excepciones vigentes:** EX-001 (`image-size`), EX-002 (`node-forge`) y EX-003 (`braces`), revisadas el 15/10/2026; **vencen el 31/10/2026** y hay que renovarlas o corregirlas antes.
- **Hallazgos nuevos (Low):** SEC-05, alertas de Dependabot desactivadas (#62); SEC-06, enlace de invitación con esquema propio `nexasafe://`, riesgo aceptado en la fase 1 (#63). SEC-04 suma `sprintf-js` (#61).
- **Riesgos:** R9 (sin Android físico) pasa a materializado; R1 (ubicación en segundo plano) sigue sin investigar y bloquea E4-02 en el Sprint 03.

## Desviaciones frente a la Definition of Done

- **Prueba en Android físico:** no se hizo. El 15/10/2026 el equipo decidió dejarla pendiente porque no hay un Android disponible. La lista está lista en [`pruebas-android.md`](pruebas-android.md). El mapa (WebView + Leaflet) no funciona en el navegador, así que E3-01a, E3-02 y E3-03 solo se han verificado con pruebas automáticas.
- **Prueba E2E con Maestro:** no se hizo (igual que en el Sprint 01).
- **PR aprobado por un compañero:** no se cumplió. Los PR del sprint se integraron con los controles automáticos obligatorios en verde y sin aprobación de par.
- **Fechas:** el sprint estaba planificado del 20/10 al 31/10 según el Cronograma. Se adelantó al 09/10 y las historias se integraron entre el 09/10 y el 12/10.

## Participación del equipo

Informada por Juan Felipe Pineda Cardona el 12/10/2026 (también en `Ejecucion del Sprint 02.xls`, hoja Scrum Team):

- **Juan Felipe Pineda Cardona:** desarrollo de las 7 historias, 5 h por día (todos los commits y PR del sprint).
- **David Alejandro del Prado Camargo:** documentación del sprint, 2 h por día, y las ceremonias.
- **Ingrith Yuliana García Galvis:** documentación del sprint, 2 h por día, y las ceremonias.

## Trabajo no planificado (sin estimación en puntos)

- Plantillas Excel del docente con los datos del proyecto (PR #54) y tiempos fijos de las ceremonias.
- Dependabot ajustado para respetar las versiones de Expo SDK 54 (PR #43) y actualización de 6 dependencias menores (PR #53).
- Lista de pruebas manuales en Android del Sprint 01 (PR #38 y #39) y del Sprint 02.
