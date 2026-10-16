# Sprint 04 — Planning

**Ceremonia planificada:** 20/10/2026 según el Excel de ejecución · **Fecha real:** 15/10/2026 (el sprint se adelanta)
**Fechas del sprint:** planificadas 20/10 – 28/10/2026 (Excel de ejecución) · inicio real 15/10/2026
**Sprint Goal:** el puesto de control atiende alertas desde la app y deja bitácora del incidente.
**Hito H4:** ubicación en vivo y flujo alerta → notificación → respuesta → cierre completo; fin del desarrollo.
**Capacidad comprometida:** 32 pts (alcance mantenido el 15/10/2026; R6 aceptado) · **Security Champion:** Juan Felipe Pineda Cardona

| Historia | Descripción | Responsable | Pts | Issue |
|---|---|---|---|---|
| E9-01 | Bitácora inmutable de cada evento del incidente | Rol Backend/Datos — Juan Felipe Pineda Cardona | 5 | #77 |
| E7-01 | Notificación push con sonido prioritario ante una alerta | Rol Backend/Datos + Móvil — Juan Felipe Pineda Cardona | 5 | #78 |
| E7-02 | Marcar "voy en camino" sobre una alerta | Rol Móvil — Juan Felipe Pineda Cardona | 3 | #79 |
| E9-02 | Cerrar la alerta clasificándola | Rol Móvil + Backend/Datos — Juan Felipe Pineda Cardona | 3 | #80 |
| E8-01 | Puesto de control con alertas en el mapa y gráfico interactivo | Rol Móvil — Juan Felipe Pineda Cardona | 8 | #81 |
| E6-04 | Modo discreto de la pantalla durante la alerta | Rol Móvil — Juan Felipe Pineda Cardona | 5 | #82 |
| E11-04 | No compartir la ubicación fuera de trayecto o alerta | Rol DevSecOps/QA — Juan Felipe Pineda Cardona | 3 | #83 |

Issues con las etiquetas `sprint:04`, `epic:E6` / `epic:E7` / `epic:E8` / `epic:E9` / `epic:E11` y `security`.

**Orden de trabajo:** migración (bitácora, cierre, respuesta, permisos del colegio y del contacto de apoyo, tokens push, trigger de aviso y pruebas pgTAP) → E9-01 → E7-02 + E9-02 (W11, W12) → E8-01 (W13) → E6-04 (W10) → E7-01 (`notify-push` + `expo-notifications`, cuando exista Firebase) → E11-04.

## Antes de programar

- [x] Decisiones D25–D31 aprobadas: [`refinement.md`](refinement.md).
- [x] Wireframes W10–W13 aprobados: [`wireframes.md`](wireframes.md).
- [x] STRIDE de E6/E7 y E8/E9 en [`threat-model.md`](../../security/threat-model.md).
- [x] Migración con RLS y prueba pgTAP de cada política (#85, 46 pruebas).
- [x] Proyecto de Firebase y credencial de FCM V1 en EAS (16/10/2026).
- [x] PIA: tokens push, bitácora y acceso del colegio y del contacto de apoyo a las alertas (16/10/2026).

## Criterios de aceptación (Gherkin)

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

## Riesgos del sprint

- **R6:** 32 pts con un integrante hasta el 28/10/2026.
- **Firebase:** sin el proyecto, E7-01 no puede verificarse en Android.
- **R9:** el push, el modo discreto y la ubicación solo se verifican en el APK de EAS en un Android físico.
