# Sprint 03 — Planning

**Ceremonia planificada:** 05/10/2026 según el Excel de ejecución · **Fecha real:** 15/10/2026
**Fechas del sprint:** planificadas 05/10 – 19/10/2026 (Excel de ejecución) · inicio real 15/10/2026
**Sprint Goal:** el guardián sigue el trayecto en vivo y el botón de pánico funciona de extremo a extremo con cancelación por PIN.
**Capacidad comprometida:** 26 pts (alcance planificado mantenido tras la revisión de alcance del 15/10/2026; R6 aceptado) · **Security Champion:** Juan Felipe Pineda Cardona

| Historia | Descripción | Responsable | Pts | Issue |
|---|---|---|---|---|
| E4-02 | Ubicación del protegido en vivo durante el trayecto | Rol Móvil + Backend/Datos — Juan Felipe Pineda Cardona | 8 | #66 |
| E4-03 | Cierre automático del trayecto al llegar (geocerca) | Rol Backend/Datos — Juan Felipe Pineda Cardona | 5 | #67 |
| E6-01 | Disparar alerta manteniendo presionado el botón 3 s | Rol Móvil — Juan Felipe Pineda Cardona | 5 | #68 |
| E6-03 | Cancelar la alerta con el PIN dentro de 10 s | Rol Backend/Datos — Juan Felipe Pineda Cardona | 3 | #69 |
| E6-05 | Enviar la ubicación cada 5 s durante la alerta | Rol Móvil — Juan Felipe Pineda Cardona | 5 | #70 |

Issues con las etiquetas `sprint:03`, `epic:E4` / `epic:E6` y `security`.

**Orden de trabajo:** migración (`posiciones`, `alertas`, funciones, RLS, canal privado de Realtime y pruebas pgTAP) → E6-01 → E6-03 (`auth-pin`) → E4-02 → E6-05 → E4-03.

## Antes de programar

- [x] Decisiones D18–D24 aprobadas: [`refinement.md`](refinement.md).
- [x] Wireframes W7–W9 aprobados: [`wireframes.md`](wireframes.md).
- [x] STRIDE de E4-02, E4-03 y E6 en [`threat-model.md`](../../security/threat-model.md).
- [ ] Migración con RLS y prueba pgTAP de cada política.
- [ ] Llave de cifrado de posiciones en Vault (dev y staging) y autorización de canales privados de Realtime.
- [ ] PIA: captura de ubicación en segundo plano y tabla `posiciones`.

## Criterios de aceptación (Gherkin)

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

## Riesgos del sprint

- **R1:** sin investigar; necesita el celular prestado. Si el sistema detiene el servicio en primer plano, se agrega la guía de exclusión de batería.
- **R9:** sin Android, E4-02, E4-03 y E6-05 solo se verifican con pruebas automáticas; la prueba en el celular queda pendiente.
- **R6:** el equipo mantuvo el alcance completo (26 + 32 pts) hasta el 28/10/2026.
