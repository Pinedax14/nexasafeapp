# Sprint 04 — Wireframes

**Fecha:** 15/10/2026 · Bocetos de baja fidelidad para la Definition of Ready (refinement del Sprint 04).
**Estado:** PENDIENTE: aprobación del equipo.

Siguen el estilo de los sprints anteriores (`formStyles`) y el mapa de OpenStreetMap (D9).

## W10 · Modo discreto (menor) — E6-04, D30

Al vencer los 10 s de la ventana de cancelación.

```
┌──────────────────────────────┐
│ 🛡                           │
│ Hola, Menor 👋               │
│                              │
│                              │
│                              │
│                              │
│ Cerrar sesión                │
└──────────────────────────────┘
```

Sin la palabra "alerta", sin botón de pánico, sin sonido ni vibración. La notificación fija de Android dice "NexaSafe · Servicio activo".

## W11 · Alerta recibida (guardián y contacto de apoyo) — E7-01, E7-02, E9-01, D25, D28

La notificación push abre esta pantalla. También se llega desde "Mis menores" (guardián) o desde "Alertas" (contacto de apoyo).

```
┌──────────────────────────────┐
│ ‹ Volver                     │
│ 🚨 Alerta de Menor Uno       │
│ Enviada a las 6:51 a. m.     │
│ ┌──────────────────────────┐ │
│ │   mapa · ● posición      │ │
│ └──────────────────────────┘ │
│ Última posición: hace 4 s    │
│ [      Voy en camino       ] │
│ [      Cerrar alerta       ] │  ← solo guardián
│ Bitácora                     │
│ 6:51 Disparada               │
│ 6:51 Notificada              │
│ 6:53 Voy en camino · Ana     │
└──────────────────────────────┘
```

## W12 · Cerrar alerta (guardián y puesto de control) — E9-02, D29

```
┌──────────────────────────────┐
│ ‹ Alerta de Menor Uno        │
│ ¿Cómo terminó?               │
│ ( ) Falsa alarma             │
│ ( ) Situación resuelta       │
│ ( ) Remitida a la autoridad  │
│ Nota (opcional, 280)         │
│ [                          ] │
│ [      Cerrar alerta       ] │
└──────────────────────────────┘
```

## W13 · Puesto de control (personal del colegio) — E8-01, D26

Pestaña nueva en el inicio del personal, junto a "Matrículas pendientes".

```
┌──────────────────────────────┐
│ Puesto de control            │
│ [Alertas activas][Matrículas]│
│ ┌──────────────────────────┐ │
│ │ mapa · ● ● alertas       │ │
│ └──────────────────────────┘ │
│ Menor Uno · 6:51 · Enviada › │
│ Menor Tres · 7:02 · Atendida›│
│ Alertas de los últimos 14 días│
│ ▇ ▅ ▂ ▇ ▃  (toque = detalle) │
│ ■ Falsa alarma ■ Resuelta …  │
└──────────────────────────────┘
```

Cada alerta abre W11 sin "Voy en camino" y con "Cerrar alerta".
