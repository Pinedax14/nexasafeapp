# Sprint 02 — Wireframes

**Fecha:** 05/10/2026 · Bocetos de baja fidelidad para la Definition of Ready (refinement del Sprint 02).
**Estado:** PENDIENTE: aprobación del equipo en el planning (20/10/2026).

Siguen el estilo de las pantallas del Sprint 01 (`formStyles`): título, subtítulo, campos y un botón principal.

## W1 · Rutas del menor (guardián) — E3-01, D12

Se abre desde "Mis menores" con un botón "Rutas ›" en cada menor ACTIVO.

```
┌──────────────────────────────┐
│ ‹ Mis menores                │
│ Rutas de Menor Uno           │
│ Hasta 2 rutas: ida y regreso │
│                              │
│ ┌──────────────────────────┐ │
│ │ Casa → colegio        ›  │ │
│ │ Corredor 50 m · 25 min   │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Colegio → casa        ›  │ │
│ │ Sin definir              │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## W2 · Editor de ruta (guardián) — E3-01, E3-02, E3-03, D9, D10

```
┌──────────────────────────────┐
│ ‹ Rutas                      │
│ Casa → colegio               │
│ ┌──────────────────────────┐ │
│ │   MAPA (OpenStreetMap)   │ │
│ │  ●━━━━━●                 │ │
│ │         ┃  ░░ corredor   │ │
│ │         ●━━━━━━● Colegio │ │
│ │ © OpenStreetMap          │ │
│ └──────────────────────────┘ │
│ Toca el mapa para agregar    │
│ puntos.        [Deshacer]    │
│                              │
│ Corredor: 50 m               │
│ 25 ●───────────────○ 200     │
│                              │
│ Duración esperada (min)      │
│ [ 25 ]                       │
│                              │
│ [      Guardar ruta      ]   │
└──────────────────────────────┘
```

- Mínimo 2 puntos para guardar. Al guardar, la ruta queda en el servidor y en la caché cifrada del teléfono (D11).
- Sin conexión, la pantalla muestra la ruta de la caché en modo lectura.

## W3 · Inicio del menor (protegido) — E4-01, D12

```
┌──────────────────────────────┐
│ Hola, Menor Uno 👋           │
│ ¿A dónde vas?                │
│                              │
│ ┌──────────────────────────┐ │
│ │  ▶  Casa → colegio       │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │  ▶  Colegio → casa       │ │
│ └──────────────────────────┘ │
│                              │
│ Un toque inicia el trayecto  │
│ y tu acudiente te acompaña.  │
│                              │
│              Cerrar sesión   │
└──────────────────────────────┘
```

- Cada botón es grande (un toque, RNF de usabilidad).
- Si el guardián no ha definido rutas: "Tu acudiente todavía no ha definido tus rutas." y no hay botones.

## W4 · Trayecto en curso (protegido) — E4-01, E4-04

```
┌──────────────────────────────┐
│▓▓ 🛡 Te estamos acompañando ▓▓│  ← banda fija, siempre visible
│                              │
│ Casa → colegio               │
│ En curso desde las 6:42 a. m.│
│                              │
│ Tu acudiente sabe que vas    │
│ en camino.                   │
└──────────────────────────────┘
```

- La banda aparece solo con un trayecto EN_CURSO y en cualquier pantalla del menor (RF-15). Sin trayecto, no hay banda ni se comparte ubicación (RF-41).
- El cierre del trayecto (E4-03) y el botón de pánico (E6) llegan en el Sprint 03.

## W5 · Contactos de apoyo (guardián) — E2-01, D8

```
┌──────────────────────────────┐
│ ‹ Mis menores                │
│ Red de apoyo de Menor Uno    │
│ Recibirán las alertas del    │
│ menor.                       │
│                              │
│ [  Invitar a un contacto  ]  │
│                              │
│ Ana Tía        · Aceptó      │
│ Invitación     · Vence 8 oct │
└──────────────────────────────┘
```

Al tocar "Invitar a un contacto" se genera el enlace y se abre el menú de compartir de Android (WhatsApp, SMS, correo). El aviso dice: "El enlace sirve una sola vez y vence en 72 horas."

## W6 · Aceptar la invitación (contacto de apoyo) — E2-01, D8

```
┌──────────────────────────────┐
│ Te invitaron a la red de     │
│ apoyo de Menor Uno           │
│                              │
│ [ Tu nombre                ] │
│ [ Correo                   ] │
│ [ Contraseña               ] │
│                              │
│ [ Crear cuenta y aceptar  ]  │
│                              │
│ Solo verás las alertas del   │
│ menor, no sus trayectos.     │
└──────────────────────────────┘
```

- Enlace usado o vencido: "Esta invitación ya no es válida. Pide una nueva." (mensaje genérico).
- La cuenta nace con rol `apoyo`. La pantalla de inicio del contacto llega con las alertas (Sprint 03); en el Sprint 02 muestra "Aún no hay alertas".
