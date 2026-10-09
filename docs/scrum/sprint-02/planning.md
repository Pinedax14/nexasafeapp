# Sprint 02 — Planning

**Ceremonia planificada:** 20/10/2026 · **Fecha real:** 09/10/2026 (el sprint se adelanta por decisión del equipo)
**Fechas del sprint:** planificadas 20/10 – 31/10/2026 · inicio real 09/10/2026
**Sprint Goal:** un guardián puede definir la ruta del protegido y el protegido puede iniciar un trayecto acompañado.
**Hito asociado:** H3 (31/10) — ruta definida sobre mapa y trayecto acompañado iniciado (`EN_CURSO`) con indicador de acompañamiento activo. Revisión de alcance (R6).
**Capacidad comprometida:** 26 pts · **Security Champion (Sprints 02–03):** Juan Felipe Pineda Cardona (único integrante activo; R7)

| Historia | Descripción | Responsable | Pts |
|---|---|---|---|
| E3-01a | Definir la ruta casa–colegio sobre un mapa y guardarla en el servidor | Rol Móvil — Juan Felipe Pineda Cardona | 5 |
| E3-01b | Caché local de la ruta y vista sin conexión | Rol Móvil — Juan Felipe Pineda Cardona | 3 |
| E3-02 | Configurar corredor de tolerancia en metros | Rol Móvil + Backend/Datos — Juan Felipe Pineda Cardona | 3 |
| E3-03 | Definir duración esperada del trayecto | Rol Móvil — Juan Felipe Pineda Cardona | 3 |
| E4-01 | Iniciar trayecto acompañado con un toque | Rol Móvil — Juan Felipe Pineda Cardona | 5 |
| E4-04 | Indicador permanente de acompañamiento activo | Rol Móvil — Juan Felipe Pineda Cardona | 2 |
| E2-01 | Invitar contactos de apoyo por enlace | Rol Backend/Datos — Juan Felipe Pineda Cardona | 5 |

**División de E3-01 (09/10/2026):** acción de la retro del Sprint 01 (partir las historias que necesitan migración, librería nueva y pantalla). E3-01 (8 pts en el Cronograma) se divide en E3-01a (5) y E3-01b (3). El total del sprint sigue en 26 pts.

**Orden de trabajo propuesto:** migración (PostGIS, `rutas`, `trayectos`, `contactos_apoyo`, RLS y pruebas) → E3-01a + E3-02 + E3-03 (misma pantalla, W2) → E3-01b → E4-01 → E4-04 → E2-01.

## Antes de programar

- [x] Decisiones D8–D13 del refinement (05/10/2026).
- [x] Wireframes W1–W6: [`wireframes.md`](wireframes.md).
- [x] Modelo de datos aprobado: [`modelo-datos-sprint-02.md`](../../architecture/modelo-datos-sprint-02.md) (D14–D17, 09/10/2026).
- [ ] Migración con RLS y prueba pgTAP de cada política.
- [ ] PIA actualizada: el servidor de teselas de OpenStreetMap recibe las zonas del mapa que se ven (D9).

## Criterios de aceptación (Gherkin)

### E3-01a · Ruta sobre un mapa (RF-09)
```gherkin
Dado que soy el guardián de un menor en estado ACTIVO
Cuando marco en el mapa la ruta "Casa → colegio" con al menos 2 puntos y la guardo
Entonces la ruta queda guardada en el servidor
Y queda registrado GUARDAR_RUTA en audit_log

Dado que el menor ya tiene una ruta "Casa → colegio"
Cuando guardo otra ruta en ese mismo sentido
Entonces la nueva reemplaza a la anterior
Y el menor tiene como máximo 2 rutas: "Casa → colegio" y "Colegio → casa" (D12)

Dado que envío una ruta con menos de 2 o más de 200 puntos, de más de 30 km o fuera de Colombia
Cuando la guardo
Entonces el servidor la rechaza (D15)

Dado que soy un contacto de apoyo, personal del colegio, administrador o el guardián de otro menor
Cuando intento leer o cambiar la ruta del menor
Entonces no obtengo ningún dato y el cambio es rechazado

Dado que soy el protegido
Cuando intento cambiar mi ruta
Entonces el cambio es rechazado
```

### E3-01b · Caché local de la ruta (RF-09, D11)
```gherkin
Dado que guardé o consulté las rutas de mi menor
Cuando la app termina de sincronizar con el servidor
Entonces las rutas quedan en expo-secure-store del teléfono, reemplazando la copia anterior

Dado que no tengo conexión
Cuando entro a las rutas de mi menor
Entonces las veo desde la caché en modo lectura

Dado que cierro sesión
Cuando vuelvo a abrir la app
Entonces la caché de rutas ya no existe
```

### E3-02 · Corredor de tolerancia (RF-10)
```gherkin
Dado que estoy configurando la ruta de mi menor
Cuando muevo el control del corredor
Entonces veo el corredor dibujado sobre el mapa con el ancho elegido
Y solo puedo elegir valores entre 25 y 200 metros, con 50 por defecto (D10)

Dado que alguien envía al servidor un corredor fuera de 25–200 metros
Cuando se guarda la ruta
Entonces el servidor la rechaza
```

### E3-03 · Duración esperada (RF-11)
```gherkin
Dado que estoy configurando la ruta de mi menor
Cuando indico la duración esperada en minutos
Entonces queda guardada con la ruta

Dado que indico una duración menor de 5 o mayor de 120 minutos
Cuando intento guardar la ruta
Entonces la app y el servidor la rechazan (D10)
```

### E4-01 · Iniciar trayecto con un toque (RF-12)
```gherkin
Dado que soy un protegido ACTIVO y mi guardián definió mis rutas
Cuando toco "Casa → colegio"
Entonces se crea un trayecto EN_CURSO con la hora del servidor
Y queda registrado INICIAR_TRAYECTO en audit_log

Dado que ya tengo un trayecto EN_CURSO
Cuando intento iniciar otro
Entonces la app no crea un segundo trayecto

Dado que mi guardián todavía no definió una ruta
Cuando abro la app
Entonces veo "Tu acudiente todavía no ha definido tus rutas." y no puedo iniciar un trayecto

Dado que soy el guardián del menor
Cuando el menor inicia un trayecto
Entonces puedo ver que tiene un trayecto EN_CURSO
```

### E4-04 · Indicador de acompañamiento (RF-15, RF-41)
```gherkin
Dado que tengo un trayecto EN_CURSO
Cuando uso la app en cualquier pantalla
Entonces veo siempre la banda "Te estamos acompañando"

Dado que no tengo un trayecto EN_CURSO
Cuando uso la app
Entonces la banda no aparece y la app no captura mi ubicación
```

### E2-01 · Invitar contactos de apoyo (RF-06, D8, D14, D17)
```gherkin
Dado que soy guardián de un menor ACTIVO
Cuando toco "Invitar a un contacto"
Entonces obtengo un enlace y un código de un solo uso que vencen en 72 horas
Y se abre el menú de compartir de Android
Y queda registrado CREAR_INVITACION en audit_log

Dado que creé 10 invitaciones en la última hora
Cuando intento crear otra
Entonces la operación es rechazada

Dado que recibí una invitación válida
Cuando la abro desde el enlace o pego el código en "Tengo una invitación"
Entonces veo el primer nombre del menor y el nombre del guardián
Y al crear mi cuenta quedo con el rol apoyo, vinculado al menor
Y el guardián me ve como "Aceptó"

Dado que la invitación ya se usó o venció
Cuando alguien la abre o intenta registrarse con ella
Entonces ve "Esta invitación ya no es válida. Pide una nueva." y no queda vinculado

Dado que soy un contacto de apoyo
Cuando intento ver las rutas o los trayectos del menor
Entonces no obtengo ningún dato
```

## Riesgos del sprint

- **R1:** investigar si ColorOS (el OPPO prestado) detiene la app en segundo plano, antes de E4-02 (Sprint 03). PENDIENTE: fecha de la prueba con el celular.
- **R6:** el mapa (WebView + Leaflet) es la parte más nueva y la más grande. Si E3-01a se atrasa, se mueve primero E2-01, que no depende del mapa.
- **R9:** el mapa no funciona en el navegador (D9). E3-01a, E3-02 y E4-04 solo se pueden verificar en el Android prestado.
- **D16:** sin E4-03, un trayecto iniciado no se cierra en este sprint. En dev se cierra a mano para volver a probar.

## Tablero

PENDIENTE: crear los issues con las etiquetas `sprint:02`, `epic:E2` / `epic:E3` / `epic:E4` y `security` (requiere GitHub CLI: `winget install GitHub.cli` y `gh auth login`).
