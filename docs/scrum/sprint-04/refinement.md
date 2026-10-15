# Sprint 04 — Refinement

**Fecha:** 15/10/2026
**Sprint que prepara:** Sprint 04 (fechas del Excel de ejecución: 20/10 – 28/10/2026), 32 pts
**Sprint Goal (Plan):** el puesto de control atiende alertas desde la app y deja bitácora del incidente.
**Hito H4:** ubicación en vivo y flujo alerta → notificación → respuesta → cierre completo; fin del desarrollo.

Modelo de amenazas: ver [`threat-model.md`](../../security/threat-model.md), secciones E6/E7 y E8/E9, ampliadas en este refinement.

## 1. Estado de la Definition of Ready

| Historia | Pts | Gherkin | Dependencias | Datos personales | Wireframe | ¿Lista? |
|---|---|---|---|---|---|---|
| E9-01 Bitácora inmutable (RF-32) | 5 | Borrador (sección 3) | Tabla `eventos_incidente` (D27) | Sí: hechos de la alerta del menor | No aplica | No |
| E7-01 Push con sonido prioritario (RF-26) | 5 | Borrador | **Proyecto de Firebase para FCM (D25, bloqueante)**; tabla de tokens; Edge Function `notify-push` | Sí: aviso de la alerta | Borrador: W11 | No |
| E7-02 "Voy en camino" (RF-27) | 3 | Borrador | E9-01; quién responde (D28) | Sí | Borrador: W11 | No |
| E9-02 Cierre clasificado (RF-33) | 3 | Borrador | E9-01; clasificaciones (D29) | Sí | Borrador: W12 | No |
| E8-01 Puesto de control con mapa y gráfico (RF-29) | 8 | Borrador | RLS del colegio sobre alertas (D26); `react-native-gifted-charts` | Sí: alertas y posición de menores del colegio | Borrador: W13 | No |
| E6-04 Modo discreto (RF-23, RNF-16) | 5 | Borrador | E6-01; diseño de la pantalla (D30) | No | Borrador: W10 | No |
| E11-04 Sin ubicación fuera de trayecto o alerta (RF-41) | 3 | Borrador | E9-02 (el cierre detiene la captura) | Sí | No aplica | No |

Decisiones D25–D31 y wireframes W10–W13 aprobados por el equipo el 15/10/2026. Las historias cumplen la DoR, salvo E7-01, que depende del proyecto de Firebase (requisito externo).

## 2. Decisiones (aprobadas el 15/10/2026)

| ID | Tema | Por qué hace falta | Decisión |
|---|---|---|---|
| D25 | Notificación push (E7-01, RNF-09) | El Plan fija Expo Push, pero no dice quién la dispara ni cómo se espera la ventana de 10 s. En Android, Expo Push entrega por Firebase Cloud Messaging (FCM) | Librería `expo-notifications` (SDK 54). Tabla técnica **`dispositivos_push`** (`usuario_id`, `token`, `actualizado_en`), escrita solo por la función `registrar_dispositivo`. Un **trigger** en `alertas` llama con `pg_net` a la Edge Function **`notify-push`** (nombrada en el Plan), autenticada con un secreto compartido guardado en Vault y en los secretos de la función; la función espera a que venza `cancelable_hasta`, comprueba que la alerta siga `ENVIADA` y envía el push a: el guardián, los contactos de apoyo que aceptaron (D8) y el personal activo del colegio. Así el aviso no depende del teléfono del menor. Canal de Android de importancia máxima con sonido; Android no deja saltar el modo "No molestar" sin un permiso especial, así que "aunque esté en silencio" se cumple con el volumen de notificaciones, no con No molestar. **Requisito externo:** crear un proyecto gratuito de Firebase (plan Spark, sin tarjeta) y subir su credencial de FCM a EAS; sin eso el push no llega en Android |
| D26 | Alcance del puesto de control (E8-01) | `alertas` y `posiciones` hoy solo las ven el menor y su guardián | Política RLS de lectura de `alertas` para el **personal activo del colegio del menor** (`institucion`) y para los **contactos de apoyo** que aceptaron (D8). `obtener_ultima_posicion` se amplía: el personal del colegio y el contacto de apoyo ven la posición **solo de una alerta activa**, nunca la del trayecto (RF-41). Gráfico con `react-native-gifted-charts` (ya en el Plan): alertas de los últimos 14 días por día y por clasificación de cierre (D29), con la función agregada `resumen_alertas_colegio` (sin datos personales) |
| D27 | Bitácora `eventos_incidente` (E9-01, RF-32) | El Diseño trae `eventos_incidente(id, alerta_id, tipo_evento, timestamp)`; faltan el actor y el detalle | Columnas `id`, `alerta_id`, `tipo_evento`, **`actor_id`**, **`detalle`** (texto corto opcional), `creado_en` (hora del servidor). Tipos: `DISPARADA`, `CANCELADA`, `NOTIFICADA`, `VOY_EN_CAMINO`, `CERRADA`. Append-only: sin `UPDATE` ni `DELETE` para nadie y un trigger que los rechaza. Solo la escriben las funciones del servidor; la leen quienes pueden ver la alerta |
| D28 | Quién marca "voy en camino" (E7-02) | RF-27 dice "un guardián"; el contacto de apoyo también recibe la alerta | El **guardián** y el **contacto de apoyo** pueden marcar "voy en camino" (`responder_alerta`); la primera respuesta pasa la alerta a `ATENDIDA`. Ver quién más respondió (RF-28, E7-03) es de la fase 2; aquí solo se muestra la bitácora |
| D29 | Cierre clasificado (E9-02, RF-33) | No están definidas las clasificaciones ni quién cierra | Cierran el **guardián** y el **personal del colegio** (CU-05) con `cerrar_alerta`. Clasificaciones: `FALSA_ALARMA`, `SITUACION_RESUELTA`, `REMITIDA_A_AUTORIDAD`, más una nota opcional de hasta 280 caracteres. Columnas nuevas en `alertas`: `clasificacion`, `cerrada_en`, `cerrada_por`. Al cerrar, la alerta pasa a `CERRADA` y el teléfono del menor deja de enviar posiciones de la alerta |
| D30 | Modo discreto (E6-04, RF-23, RNF-16) | No está definido cómo se ve | Al vencer la ventana de 10 s, la pantalla del menor vuelve a verse como su inicio normal ("Hola, …"), sin la palabra "alerta", sin botón de pánico y sin sonido ni vibración; solo queda el escudo 🛡 pequeño del indicador (RNF-16). La notificación fija de Android cambia a un texto neutro ("NexaSafe · Servicio activo"). El modo termina cuando la alerta se cierra |
| D31 | E11-04 (RF-41) | Casi todo quedó construido en el Sprint 03 | Se completa con: el cierre de la alerta detiene la captura, al abrir la app se detiene cualquier captura sin trayecto ni alerta activos, y pruebas de extremo a extremo de RF-41 en pgTAP y Jest |

## 3. Criterios de aceptación (borrador para el planning)

### E9-01 · Bitácora inmutable (RF-32)
```gherkin
Dado que ocurre un hecho de una alerta (disparo, cancelación, notificación, "voy en camino" o cierre)
Cuando el servidor lo procesa
Entonces queda una fila en eventos_incidente con el actor y la hora del servidor

Dado que soy cualquier usuario, incluso el administrador
Cuando intento modificar o borrar un evento
Entonces la operación es rechazada
```

### E7-01 · Push con sonido prioritario (RF-26, RNF-09)
```gherkin
Dado que soy guardián, contacto de apoyo o personal del colegio del menor y abrí la app en mi teléfono
Cuando el menor dispara una alerta y no la cancela en 10 s
Entonces recibo una notificación push con sonido en menos de 5 s después de la ventana
Y queda registrado NOTIFICADA en la bitácora

Dado que el menor cancela la alerta con su PIN dentro de los 10 s
Cuando vence la ventana
Entonces nadie recibe notificación
```

### E7-02 · "Voy en camino" (RF-27)
```gherkin
Dado que soy el guardián o un contacto de apoyo y abro la alerta
Cuando toco "Voy en camino"
Entonces la alerta pasa a ATENDIDA
Y queda registrado VOY_EN_CAMINO con mi nombre y la hora en la bitácora
```

### E9-02 · Cierre clasificado (RF-33)
```gherkin
Dado que soy el guardián o personal del colegio del menor
Cuando cierro la alerta eligiendo una clasificación
Entonces la alerta pasa a CERRADA con la clasificación, la hora y quién la cerró
Y queda registrado CERRADA en la bitácora
Y el teléfono del menor deja de enviar posiciones de esa alerta

Dado que soy un contacto de apoyo
Cuando intento cerrar la alerta
Entonces la operación es rechazada
```

### E8-01 · Puesto de control (RF-29)
```gherkin
Dado que soy personal activo de un colegio
Cuando abro el puesto de control
Entonces veo las alertas activas de los menores de mi colegio sobre un mapa, con su última posición
Y veo un gráfico interactivo de alertas por día y por clasificación de cierre

Dado que soy personal de otro colegio
Cuando abro el puesto de control
Entonces no veo alertas de menores que no son de mi colegio

Dado que un menor de mi colegio va en un trayecto sin alerta
Cuando abro el puesto de control
Entonces no veo su ubicación (RF-41)
```

### E6-04 · Modo discreto (RF-23, RNF-16)
```gherkin
Dado que disparé una alerta y pasaron los 10 s de la ventana
Cuando miro la pantalla
Entonces se ve como mi inicio normal, sin la palabra "alerta" ni el botón de pánico
Y solo queda el escudo pequeño del indicador
Y la notificación fija de Android muestra un texto neutro
```

### E11-04 · Sin ubicación fuera de trayecto o alerta (RF-41)
```gherkin
Dado que mi alerta se cerró y no tengo trayecto en curso
Cuando pasa el tiempo
Entonces la app no captura ni envía mi ubicación
Y el servidor rechaza cualquier posición
```

## 4. Otros pendientes del refinement

- **Firebase (bloqueante de E7-01):** crear el proyecto, registrar la app `com.nexasafe.app`, descargar `google-services.json` y subir la credencial de FCM V1 a EAS. Te guío paso a paso; no requiere tarjeta.
- **Secreto de `notify-push`:** se genera y guarda en Vault y en los secretos de la función (nunca en el repo).
- **Prueba en Android:** el push solo llega en el APK de EAS en un celular o emulador con Google Play (R9).
- **Capacidad (R6):** 32 pts entre el 20/10 y el 28/10 con un integrante; el equipo decidió mantener el alcance (15/10/2026).
