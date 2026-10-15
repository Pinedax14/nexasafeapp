# Sprint 03 — Refinement

**Fecha:** 15/10/2026
**Sprint que prepara:** Sprint 03 (fechas del Excel de ejecución: 05/10 – 19/10/2026; ejecución real desde el 15/10/2026), 26 pts
**Sprint Goal (Plan):** el guardián sigue el trayecto en vivo y el botón de pánico funciona de extremo a extremo con cancelación por PIN.
**Revisión de alcance (R6, 15/10/2026):** se propuso pasar E6-04, E7-02 y el gráfico de E8-01 a trabajo futuro; el equipo decidió **mantener el alcance planificado** (Sprint 03 con 26 pts y Sprint 04 con 32) y avanzar hasta donde se llegue. El riesgo R6 queda aceptado.

Modelo de amenazas: ver [`threat-model.md`](../../security/threat-model.md), secciones E3/E4 y E6/E7, ampliadas en este refinement.

## 1. Estado de la Definition of Ready

| Historia | Pts | Gherkin | Dependencias | Datos personales | Wireframe | ¿Lista? |
|---|---|---|---|---|---|---|
| E4-02 Ubicación en vivo durante el trayecto (RF-13) | 8 | Borrador (sección 3) | Librerías de ubicación (D18), tabla de posiciones (D19), difusión en vivo (D20); R1 sin investigar | Sí: ubicación del menor en tiempo real | Borrador: W7, W8 ([wireframes](wireframes.md)) | No |
| E4-03 Cierre automático al llegar (RF-14) | 5 | Borrador | E4-02; geocerca (D21) | Sí | Borrador: W7 | No |
| E6-01 Botón de pánico 3 s (RF-20) | 5 | Borrador | Tabla `alertas` (D22) | Sí: alerta del menor | Borrador: W9 | No |
| E6-03 Cancelar con PIN en 10 s (RF-22) | 3 | Borrador | E6-01; verificación del PIN (D23) | Sí | Borrador: W9 | No |
| E6-05 Ubicación cada 5–10 s en la alerta (RF-24) | 5 | Borrador | E4-02, E6-01; frecuencia (D18) | Sí | Borrador: W9 | No |

Decisiones D18–D24 y wireframes W7–W9 aprobados por el equipo el 15/10/2026. Las historias cumplen la DoR, salvo la investigación de R1, que queda pendiente hasta tener el celular prestado (R9).

## 2. Decisiones (aprobadas el 15/10/2026)

| ID | Tema | Por qué hace falta | Decisión |
|---|---|---|---|
| D18 | Captura de la ubicación (E4-02, E6-05) | El Plan nombra `expo-location` y `expo-task-manager` en el stack, pero no fija frecuencia ni cómo seguir en segundo plano | `expo-location` + `expo-task-manager` (versiones de Expo SDK 54) con **servicio en primer plano** de Android y su notificación fija "NexaSafe te está acompañando". Frecuencia: **cada 15 s o 20 m** en el trayecto (RNF-11, batería < 8 %/h) y **cada 5 s** durante una alerta (RF-24). Permisos nuevos: ubicación precisa, ubicación en segundo plano y servicio en primer plano de ubicación. La captura arranca solo con un trayecto `EN_CURSO` o una alerta activa y se detiene al cerrarse (RF-41) |
| D19 | Dónde se guardan las posiciones (E4-02, RNF-02) | El modelo del Diseño (cap. 6) no tiene tabla de posiciones y RNF-02 pide cifrar por columna la "ubicación histórica" | Tabla técnica nueva **`posiciones`** (`id`, `protegido_id`, `trayecto_id` o `alerta_id`, `ubicacion_cifrada`, `precision_m`, `capturada_en`, `recibida_en`). Latitud y longitud **cifradas** con `pgcrypto` y una llave de Vault, como el documento del menor (E1-02). Solo se escriben con la función `registrar_posicion`, que exige trayecto `EN_CURSO` o alerta activa del propio menor; nadie tiene `SELECT` directo |
| D20 | Cómo ve el guardián la posición en vivo (E4-02) | Supabase Realtime con `postgres_changes` enviaría el dato cifrado, y descifrarlo en la app expondría la llave | `registrar_posicion` publica la posición ya descifrada por **Realtime Broadcast** (`realtime.send`) en un canal **privado** `trayecto:<id>`; una política RLS sobre `realtime.messages` deja escuchar solo al guardián del menor. Al abrir el mapa, la última posición se lee con `obtener_ultima_posicion` (auditada en `audit_log`). El rol `apoyo` no ve trayectos (D8) |
| D21 | Geocerca de llegada (E4-03) | RF-14 no dice el radio ni dónde se calcula | El destino es el **último punto de la ruta**. Radio de llegada: **50 m** (RNF-10 admite error de 20 m). Se calcula **en el servidor** dentro de `registrar_posicion`: la primera posición dentro del radio pasa el trayecto a `CERRADO` con `fin_en` del servidor y registra `CERRAR_TRAYECTO`; la app deja de capturar al recibir el cierre. Sin cierre manual (no está en el alcance) |
| D22 | Tabla `alertas` (E6-01) | El Diseño trae `alertas(id, trayecto_id, tipo, estado)`, pero RF-20 permite disparar el botón sin trayecto y CU-04 necesita saber cuándo vence la ventana de 10 s | `alertas` con `id`, **`protegido_id`**, `trayecto_id` (**opcional**), `tipo` (`MANUAL_BOTON`), `estado` (`ENVIADA` al crearse; `CANCELADA` si se cancela a tiempo), `creada_en` y `cancelable_hasta` (= `creada_en` + 10 s, hora del servidor). El botón está siempre en el inicio del menor, con o sin trayecto. Se crea con la función `disparar_alerta` (rate limiting: máximo 3 alertas por menor cada 10 min, RNF-06). La notificación a los guardianes (E7-01, Sprint 04) sale solo cuando vence la ventana sin cancelación |
| D23 | Verificación del PIN para cancelar (E6-03) | RNF-05 exige que el PIN se verifique solo en la Edge Function `auth-pin` | Nueva acción **`cancelar_alerta`** en `auth-pin`: verifica el PIN con Argon2id y los límites de intentos existentes, y pasa la alerta a `CANCELADA` solo si `now() < cancelable_hasta`. Pasados los 10 s la alerta no se puede cancelar desde el teléfono (mitigación contra un agresor que fuerce la cancelación) |
| D24 | `eventos_incidente` (bitácora) | Es de E9-01 (Sprint 04), pero el disparo y la cancelación ocurren en este sprint | La tabla se crea en el **Sprint 04** con E9-01. En el Sprint 03, disparo y cancelación quedan en `audit_log` (`DISPARAR_ALERTA`, `CANCELAR_ALERTA`) |

## 3. Criterios de aceptación (borrador para el planning)

### E4-02 · Ubicación en vivo (RF-13, RF-41)
```gherkin
Dado que soy un protegido con un trayecto EN_CURSO
Cuando me desplazo con la app abierta o en segundo plano
Entonces mi posición se envía al servidor cada 15 s o cada 20 m
Y se guarda cifrada en posiciones
Y Android muestra la notificación fija "NexaSafe te está acompañando"

Dado que soy el guardián del menor y su trayecto está EN_CURSO
Cuando abro "Ver en vivo"
Entonces veo su última posición sobre el mapa con la ruta y el corredor
Y la posición se actualiza sola mientras dure el trayecto
Y la lectura queda registrada en audit_log

Dado que el menor no tiene un trayecto EN_CURSO ni una alerta activa
Cuando la app intenta enviar una posición
Entonces el servidor la rechaza y la app no captura ubicación

Dado que soy un contacto de apoyo, personal del colegio o el guardián de otro menor
Cuando intento leer o escuchar las posiciones del menor
Entonces no obtengo ningún dato
```

### E4-03 · Cierre automático al llegar (RF-14)
```gherkin
Dado que tengo un trayecto EN_CURSO
Cuando llego a menos de 50 m del último punto de la ruta
Entonces el servidor cierra el trayecto (CERRADO, fin_en con hora del servidor)
Y la app deja de capturar ubicación y quita la banda de acompañamiento
Y mi guardián ve el trayecto como cerrado
Y queda registrado CERRAR_TRAYECTO en audit_log
```

### E6-01 · Botón de pánico (RF-20, RNF-14)
```gherkin
Dado que soy un protegido ACTIVO
Cuando mantengo presionado el botón de pánico durante 3 s
Entonces se crea una alerta MANUAL_BOTON en estado ENVIADA con la hora del servidor
Y veo la cuenta regresiva de 10 s para cancelarla con mi PIN
Y queda registrado DISPARAR_ALERTA en audit_log

Dado que suelto el botón antes de 3 s
Cuando reviso el estado
Entonces no se crea ninguna alerta

Dado que disparé 3 alertas en los últimos 10 minutos
Cuando intento disparar otra
Entonces la operación es rechazada
```

### E6-03 · Cancelar con PIN (RF-22, CU-04)
```gherkin
Dado que disparé una alerta hace menos de 10 s
Cuando ingreso mi PIN correcto
Entonces la alerta pasa a CANCELADA y no se notifica a nadie
Y queda registrado CANCELAR_ALERTA en audit_log

Dado que ingreso un PIN incorrecto
Cuando intento cancelar
Entonces la alerta sigue ENVIADA y cuenta como intento fallido del PIN

Dado que pasaron 10 s desde el disparo
Cuando intento cancelar
Entonces la alerta no se cancela
```

### E6-05 · Ubicación durante la alerta (RF-24)
```gherkin
Dado que tengo una alerta ENVIADA
Cuando pasan los segundos
Entonces mi posición se envía cada 5 s vinculada a la alerta, con o sin trayecto

Dado que la alerta pasa a CANCELADA
Cuando la app recibe el cambio
Entonces deja de enviar posiciones de la alerta
```

## 4. Otros pendientes del refinement

- **R1 (sin investigar):** probar en el celular prestado si el sistema detiene el servicio en primer plano. Sin celular no hay forma de verificar E4-02, E4-03 y E6-05; se programan con pruebas automáticas y la verificación queda pendiente (R9).
- **Cifrado de `posiciones`:** crear la llave en Vault de dev y staging (como `documento_cifrado_key`) antes de aplicar la migración.
- **PIA:** declarar la captura de ubicación en segundo plano, la tabla `posiciones` y su retención (90 días, purga en la fase 2, RF-39).
- **Realtime privado:** activar la autorización de canales privados en Supabase (dev y staging).
- **Build:** la ubicación en segundo plano no funciona en el navegador ni en Expo Go; se prueba con el APK de EAS (`preview`).
