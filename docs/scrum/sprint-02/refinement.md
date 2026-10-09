# Sprint 02 — Refinement

**Fecha:** 05/10/2026 (durante el Sprint 01)
**Sprint que prepara:** Sprint 02 (20/10 – 31/10/2026, 26 pts)
**Sprint Goal (Cronograma):** un guardián puede definir la ruta del protegido y el protegido puede iniciar un trayecto acompañado.
**Hito H3 (31/10):** ruta definida sobre mapa y trayecto acompañado iniciado (`EN_CURSO`) con indicador activo.

Modelo de amenazas: ver [`threat-model.md`](../../security/threat-model.md), secciones E2 y E3/E4, ampliadas en este refinement.

## 1. Estado de la Definition of Ready

| Historia | Pts | Gherkin | Estimada | Dependencias | Datos personales | Wireframe | ¿Lista? |
|---|---|---|---|---|---|---|---|
| E3-01 Ruta sobre mapa + caché local | 8 | Borrador (sección 3) | 8 (Cronograma). PENDIENTE: reestimar con la caché incluida (R6) | PostGIS; librería de mapa (D9); mecanismo de caché (D11) | Sí: la ruta revela casa y colegio | Borrador: W1, W2 ([wireframes](wireframes.md)) | No |
| E3-02 Corredor en metros | 3 | Borrador | 3 | E3-01; rango del corredor (D10) | Sí (configuración de la ruta) | Borrador: W2 ([wireframes](wireframes.md)) | No |
| E3-03 Duración esperada | 3 | Borrador | 3 | E3-01; columna nueva (D10) | No | Borrador: W2 ([wireframes](wireframes.md)) | No |
| E4-01 Iniciar trayecto con un toque | 5 | Borrador | 5 | E3-01; qué ruta se usa (D12) | Sí: inicio del acompañamiento | Borrador: W3, W4 ([wireframes](wireframes.md)) | No |
| E4-04 Indicador de acompañamiento | 2 | Borrador | 2 | E4-01 | Sí: avisa cuándo se comparte la ubicación (RF-15, RF-41) | Borrador: W4 ([wireframes](wireframes.md)) | No |
| E2-01 Invitar contactos por enlace | 5 | Borrador | 5 | Columnas de invitación y rol del contacto (D8) | Sí: datos del contacto y acceso a alertas del menor | Borrador: W5, W6 ([wireframes](wireframes.md)) | No |

Ninguna historia cumple todavía la DoR: faltan la aprobación de los criterios y de los wireframes en el planning.

## 2. Decisiones (05/10/2026)

| ID | Tema | Por qué hace falta | Decisión |
|---|---|---|---|
| D8 | Invitación y cuenta del contacto de apoyo (E2-01) | El modelo del Diseño (cap. 6) solo trae `contactos_apoyo(id, guardian_id, alcance_visibilidad)`: no dice a qué menor se vincula el contacto, cómo se guarda el enlace ni con qué cuenta entra. Además, toda cuenta registrada desde la app nace como `guardian` y una cuenta tiene un solo rol | **Aprobada:** el contacto se registra desde el enlace con una cuenta nueva de rol `apoyo` (una cuenta, un rol). Quien ya es acudiente usa otro correo para ser contacto. La invitación se vincula a un menor, guarda el hash del token, vence y es de un solo uso; sin E2-02, el contacto ve solo alertas |
| D9 | Librería y proveedor del mapa (E3-01) | Ningún documento nombra la librería de mapa y no se agregan librerías sin aprobación | **Aprobada (cambiada el 05/10/2026):** OpenStreetMap con Leaflet dentro de un WebView (`react-native-webview`). No necesita cuenta, tarjeta ni llave. Leaflet va empaquetado en la app (no se carga de un CDN) y el mapa muestra la atribución que exige OpenStreetMap. Se descartó Google Maps porque Google Cloud rechazó el registro de la tarjeta (OR-CBAT-14) y la cuenta quedó en revisión. El mapa no funciona en el navegador: E3-01 se prueba en Android físico. El servidor de teselas de OpenStreetMap ve las zonas del mapa que se cargan: declararlo en la PIA |
| D10 | Duración esperada y rango del corredor (E3-02, E3-03) | `rutas` solo trae `geometria` y `corredor_m`; la duración esperada no tiene columna | **Aprobada:** columna `rutas.duracion_esperada_min` (entero, 5–120). Corredor entre 25 y 200 m, 50 m por defecto |
| D11 | Mecanismo y cifrado de la caché de la ruta (E3-01) | El Cronograma pide definirlos en este refinement | **Aprobada:** `expo-secure-store` (Keystore de Android), partida en trozos como la sesión (E1-05); se reemplaza al sincronizar con el servidor y se borra al cerrar sesión |
| D12 | Qué ruta usa el trayecto (E4-01) | El modelo permite varias rutas por menor (`protegidos 1:N rutas`) y E4-01 pide iniciar "con un toque" | **Aprobada:** hasta 2 rutas por menor, "Casa → colegio" y "Colegio → casa"; al iniciar, el menor elige una con un toque |
| D13 | Cifrado de `rutas.geometria` (RNF-02) | RNF-02 pide cifrar la "ubicación histórica"; la geometría de la ruta debe quedar legible para PostGIS (corredor y geocerca) | **Aprobada:** la ruta es configuración y no ubicación histórica: sin cifrado por columna, protegida con RLS y auditoría. Las posiciones del trayecto (Sprint 03) se deciden en su refinement |

## 3. Criterios de aceptación (borrador para el planning)

### E3-01 · Ruta casa–colegio sobre un mapa (RF-09)
```gherkin
Dado que soy el guardián de un menor en estado ACTIVO
Cuando dibujo la ruta casa–colegio sobre el mapa y la guardo
Entonces la ruta queda guardada como geometría en el servidor
Y queda en la caché cifrada del teléfono

Dado que ya guardé la ruta y abro la app sin conexión
Cuando entro a la ruta del menor
Entonces la veo desde la caché local

Dado que soy un contacto de apoyo o el guardián de otro menor
Cuando intento leer la ruta del menor
Entonces no obtengo ningún dato
```

### E3-02 · Corredor de tolerancia (RF-10)
```gherkin
Dado que estoy configurando la ruta de mi menor
Cuando muevo el slider del corredor
Entonces veo el corredor dibujado sobre el mapa con el ancho elegido
Y solo puedo elegir valores dentro del rango permitido (D10)
```

### E3-03 · Duración esperada (RF-11)
```gherkin
Dado que estoy configurando la ruta de mi menor
Cuando indico la duración esperada del trayecto en minutos
Entonces queda guardada con la ruta
Y no se aceptan valores fuera del rango permitido (D10)
```

### E4-01 · Iniciar trayecto con un toque (RF-12)
```gherkin
Dado que soy un protegido ACTIVO y mi guardián definió mi ruta
Cuando toco "Iniciar trayecto"
Entonces se crea un trayecto EN_CURSO con la hora del servidor

Dado que ya tengo un trayecto EN_CURSO
Cuando intento iniciar otro
Entonces la app no crea un segundo trayecto

Dado que mi guardián todavía no definió una ruta
Cuando abro la app
Entonces no puedo iniciar un trayecto y veo por qué
```

### E4-04 · Indicador de acompañamiento activo (RF-15)
```gherkin
Dado que tengo un trayecto EN_CURSO
Cuando uso la app
Entonces veo siempre el indicador de que estoy siendo acompañado

Dado que no tengo un trayecto EN_CURSO
Cuando uso la app
Entonces el indicador no aparece y no se comparte mi ubicación
```

### E2-01 · Invitar contactos de apoyo por enlace (RF-06)
```gherkin
Dado que soy guardián
Cuando invito a un contacto de apoyo
Entonces obtengo un enlace de un solo uso que vence

Dado que recibí un enlace de invitación válido
Cuando lo abro e inicio sesión
Entonces quedo como contacto de apoyo del menor y el guardián lo ve

Dado que el enlace ya se usó o venció
Cuando alguien lo abre
Entonces ve un mensaje genérico y no queda vinculado
```

## 4. Otros pendientes del refinement

- **R1 (ubicación en segundo plano en Xiaomi y Huawei):** la investigación está planeada para la primera semana del Sprint 02 (20–24/10). PENDIENTE: conseguir un equipo de esas marcas o documentar la prueba con el OPPO usado en el Sprint 01 (ColorOS también restringe procesos en segundo plano).
- **Wireframes:** bocetos W1–W6 en [`wireframes.md`](wireframes.md). PENDIENTE: aprobación en el planning. Incluyen la propuesta de que la invitación venza a las 72 horas.
- **Estimación:** los puntos son los del Cronograma. PENDIENTE: confirmarlos o reestimarlos en equipo, en especial E3-01 con la caché (registro de riesgos, decisión del 03/10/2026). Si E3-01 supera 8 pts debe dividirse.
- **Cambios de esquema** (PostGIS, `rutas`, `trayectos`, `contactos_apoyo` y lo que resulte de D8, D10 y D12): se presentan para aprobación antes de programar, como en el Sprint 01. Propuesta del 09/10/2026: [`modelo-datos-sprint-02.md`](../../architecture/modelo-datos-sprint-02.md), con las decisiones nuevas D14–D17.
