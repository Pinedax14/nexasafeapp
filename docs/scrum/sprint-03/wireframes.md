# Sprint 03 — Wireframes

**Fecha:** 15/10/2026 · Bocetos de baja fidelidad para la Definition of Ready (refinement del Sprint 03).
**Estado:** aprobados por el equipo el 15/10/2026.

Siguen el estilo de las pantallas de los Sprints 01 y 02 (`formStyles`) y el mapa de OpenStreetMap del Sprint 02 (D9).

## W7 · Trayecto en vivo (guardián) — E4-02, E4-03, D20, D21

Se abre desde "Mis menores" con "Ver en vivo ›", que aparece solo cuando el menor tiene un trayecto `EN_CURSO`.

```
┌──────────────────────────────┐
│ ‹ Mis menores                │
│ Menor Uno · Casa → colegio   │
│ En curso desde las 6:42 a.m. │
│ ┌──────────────────────────┐ │
│ │   mapa OpenStreetMap     │ │
│ │   ── ruta  ░ corredor    │ │
│ │        ● posición        │ │
│ │                  ⚑ colegio│ │
│ └──────────────────────────┘ │
│ Última posición: hace 12 s   │
└──────────────────────────────┘
```

Cuando el trayecto se cierra al llegar: "Llegó a las 7:05 a. m." y el mapa deja de actualizarse.

## W8 · Permiso de ubicación (menor) — E4-02, D18

Aparece la primera vez que el menor inicia un trayecto, antes de los diálogos de permiso de Android.

```
┌──────────────────────────────┐
│ Para acompañarte necesitamos │
│ tu ubicación                 │
│                              │
│ Solo la compartimos mientras │
│ vas en un trayecto o pides   │
│ ayuda. En la siguiente       │
│ pantalla elige "Permitir     │
│ todo el tiempo".             │
│                              │
│ [        Continuar         ] │
└──────────────────────────────┘
```

Si el menor no da el permiso, el trayecto no se inicia y ve: "Sin permiso de ubicación tu acudiente no puede acompañarte."

## W9 · Botón de pánico y cancelación (menor) — E6-01, E6-03, E6-05, D22, D23

En el inicio del menor (W3/W4 del Sprint 02), siempre visible, con o sin trayecto.

```
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ 🛡 Te estamos acompañando    │       │ Alerta enviada               │
│ ...                          │       │                              │
│                              │ 3 s → │ ¿Fue un error? Escribe tu    │
│        ┌──────────┐          │       │ PIN para cancelar            │
│        │  AYUDA   │          │       │          8 s                 │
│        └──────────┘          │       │ [ PIN ••••              ]    │
│ Mantén presionado 3 segundos │       │ [        Cancelar          ] │
└──────────────────────────────┘       └──────────────────────────────┘
```

- Mientras se mantiene presionado, un anillo se llena en 3 s; al soltar antes no pasa nada.
- Al llegar a 0 s desaparece la opción de cancelar y queda: "Tu alerta está activa. Tus acudientes van a ser avisados."
- Si se cancela a tiempo: "Alerta cancelada."
