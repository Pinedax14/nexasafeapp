# Guion de exposición — NexaSafe (10 minutos)

Para estudiar antes de la sustentación. Enfoque pedido por el docente: **vender el aplicativo** (como un pitch de producto), pero mostrando en el camino que cada parte cumple los requisitos de **Ingeniería de Software I** y de **Programación para Dispositivos Móviles**.

Tiempo total: **10 minutos**. Los minutos son guía, no cronómetro exacto — practica en voz alta y ajusta.

---

## 0. Antes de entrar: qué llevar listo

- Celular con el APK `preview` instalado (o `eas build` más reciente) con **dos cuentas abiertas**: una de acudiente/menor y otra institucional, para no perder tiempo iniciando sesión en vivo.
- Un trayecto ya configurado (ruta casa→colegio) para no dibujar el mapa en vivo.
- Si algo falla en el celular: tener listo el navegador (`w` de Expo) como respaldo para las pantallas que no dependen de GPS.

---

## 1. Gancho de venta (0:00 – 1:00)

> No abras con "vamos a mostrarles nuestro proyecto de software". Abre con el problema.

**Guion sugerido:**

"Todos los días, miles de niños en Bogotá hacen solos el camino entre la casa y el colegio. Para un acudiente, esos 20-30 minutos son un vacío: no sabe si su hijo va bien, y si pasa algo, no hay un botón de pánico pensado para eso — solo WhatsApp, que limita a 5 contactos y no avisa a nadie si el niño no puede escribir.

**NexaSafe** es la app que acompaña ese trayecto en tiempo real y, si algo pasa, avisa en segundos a quien debe saberlo: la red de apoyo del menor y el colegio."

---

## 2. Qué es (1:00 – 2:00)

Una sola app, **tres experiencias según el rol** (esto es clave para la parte de "arquitectura" más adelante):

| Rol | Quién es | Qué hace en la app |
|---|---|---|
| **Protegido** | El menor | Inicia el trayecto con un toque, botón de pánico |
| **Guardián** | El acudiente | Ve el trayecto en vivo, recibe alertas, cierra el caso |
| **Apoyo / Institución** | Red de apoyo y colegio | Reciben la alerta, responden, llevan el puesto de control |

"No es una app, es una app con **tres puertas de entrada distintas** según quién la abre."

---

## 3. Demo en vivo (2:00 – 6:30) — el corazón del pitch

Narra la demo como un caso real, no como un recorrido de pantallas. Ejemplo de hilo narrativo:

1. **Registro y PIN (RF-01, RF-02, RF-04):** "María registra a su hijo Juan. Juan no necesita contraseña — entra con su documento y un PIN corto, pensado para que un niño lo use fácil."
2. **Inicio del trayecto (RF-12, RF-15):** "Juan toca 'Casa → Colegio' una sola vez. Aparece el escudo que le confirma que está acompañado."
3. **Ubicación en vivo (RF-13):** "Mientras camina, María ve el punto de Juan moverse en el mapa en tiempo real, sin que Juan tenga que hacer nada más."
4. **Botón de pánico (E6):** "Si algo pasa, Juan mantiene presionado 'AYUDA' 3 segundos. Tiene 10 segundos para cancelarla con su PIN si fue un error — así evitamos falsas alarmas."
5. **Alerta y red de apoyo (E7):** "La alerta llega por notificación push a la red de apoyo. Uno de ellos toca 'Voy en camino' — María lo ve al instante en la bitácora."
6. **Cierre y bitácora (E9, E11):** "Cuando todo se resuelve, se cierra la alerta con una nota, y queda un registro completo: quién, cuándo y qué pasó."
7. **Puesto de control del colegio (E8):** "Del otro lado, el colegio tiene su propia vista: alertas activas en un mapa, y un gráfico interactivo de cuántas alertas hubo por día y cómo se cerraron."

**Cierre de la demo (una frase):** "Todo esto en menos de 15 segundos desde que se dispara la alerta hasta que alguien de la red de apoyo la ve."

---

## 4. Por qué es distinto (6:30 – 7:30)

- No es un grupo de WhatsApp: **push ilimitado**, no 5 contactos.
- No es solo un rastreador de ubicación: tiene **bitácora, roles y cierre formal del caso**.
- Pensado para quien no tiene cómo escribir un mensaje en una emergencia: **un botón, no un formulario**.
- Seguridad real por debajo: nada se guarda "por si acaso" — la ubicación solo se transmite durante un trayecto o una alerta activa.

---

## 5. Cómo se construyó — aquí conectas con las dos materias (7:30 – 9:15)

Esta es la parte que el docente evalúa como aporte de cada materia. No la separes en "ahora hablo de la otra materia" — enláza con lo que ya mostraste en la demo.

### 5.1 Ingeniería de Software I — el "cómo lo planeamos y lo construimos bien"

| Lo que viste en la demo | Cómo lo cubrimos en Ingeniería de Software I |
|---|---|
| Cada pantalla que mostré | Viene de un **requisito funcional documentado** (RF-01 a RF-44) antes de escribir una línea de código |
| El flujo completo funciona sin romperse | **Arquitectura en capas**: cada función separa datos (Supabase), lógica de negocio (dominio) y pantalla (presentación) — así un bug en una pantalla no rompe la lógica |
| El proyecto no se hizo todo de una vez | **Scrum**: 4 sprints cerrados (de 7 planeados), con historias de usuario, planning, review y retro documentados en cada uno |
| Confiamos en que no hay errores críticos | **Calidad automatizada en cada cambio**: pruebas unitarias con cobertura mínima 70%, análisis de seguridad (Semgrep, Gitleaks, CodeQL) y revisión de dependencias en cada Pull Request antes de integrarse |

Frase puente: "Esto no se armó a prueba y error. Cada pantalla que acaban de ver viene de un requisito que documentamos primero, se construyó dentro de un sprint planeado, y pasa un conjunto de pruebas automáticas antes de llegar a producción."

### 5.2 Programación para Dispositivos Móviles — el "cómo se ve y responde en el celular"

| Aporte de la materia | Dónde se vio en la demo |
|---|---|
| **UI/UX responsiva** | Las tres vistas por rol (protegido, guardián, institución), todas en una sola app Expo/React Native |
| **Consumo de APIs y datos en tiempo real** | Supabase Realtime transmitiendo la posición en vivo; notificaciones push de Expo para la alerta |
| **Gráficos interactivos** | El gráfico de alertas por día en el puesto de control, hecho con `react-native-gifted-charts` (tocas una barra y ves el detalle del día) |
| **Optimización de rendimiento** | La ruta casa-colegio se guarda en caché local del celular (`expo-secure-store`) para no tener que pedirla al servidor cada vez que se abre la app |
| **Seguridad y manejo de usuarios** | PIN con cifrado Argon2id verificado en el servidor (nunca en el celular), permisos de ubicación solo durante el trayecto, control de acceso por rol |

Frase puente: "Todo lo que vieron corriendo en el celular — el mapa en vivo, el gráfico, que la app no se demore en abrir — es exactamente lo que esta materia nos pidió optimizar."

---

## 6. Cierre (9:15 – 10:00)

- Estado real, sin inflar: "Llevamos 4 sprints cerrados de los 7 planeados, con la base completa de registro, trayectos, alertas y puesto de control funcionando de punta a punta."
- Qué falta (fase 2, para que no parezca que se esconde): desvío automático de ruta, sacudida para alertar, huella digital, WhatsApp como canal adicional.
- Cierre de venta: "Imaginen esto no en un celular de prueba, sino en cada colegio de Bogotá: una red de cuidado activa en tiempo real, sin depender de que alguien tenga tiempo de escribir un mensaje en el peor momento."

---

## 7. Preguntas que pueden hacer (para tener la respuesta lista)

| Pregunta probable | Respuesta corta |
|---|---|
| ¿Por qué Supabase y no un backend propio? | Decisión de arquitectura (Diseño 04): evita mantener servidores propios, da Auth + RLS + Realtime integrados, y encaja con el alcance de un equipo de 3 para un semestre |
| ¿Por qué PIN y no contraseña para el menor? | RF-04: un menor no debe manejar una contraseña compleja; el PIN se verifica en el servidor con Argon2id, nunca se guarda en el celular |
| ¿Qué pasa si no hay internet? | Fase 1 depende de conexión; la cola offline (`expo-sqlite`) es un ítem explícito de fase 2, no se construyó aún |
| ¿Cómo garantizan que la ubicación no se filtra? | RLS en todas las tablas, ubicación solo se transmite durante trayecto/alerta activos, y cada acceso a datos de un menor queda en `audit_log` |
| ¿Qué pruebas reales se hicieron? | Pruebas en Android físico por sprint (dos sesiones: Samsung Remote Test Lab y un OPPO Reno 11 con Android 15), más pruebas automáticas (unitarias, RLS con pgTAP) en cada Pull Request |

---

## 8. Checklist de práctica

- [ ] Ensayar en voz alta con cronómetro — ajustar si el bloque 3 (demo) se alarga, es el que más se estira en la práctica.
- [ ] Tener un plan B si el celular no conecta a internet en el salón (datos móviles o hotspot).
- [ ] Decidir quién de los 3 habla en cada bloque (venta / demo / materias / cierre) para que no se note que es un guion leído.
- [ ] No leer las tablas de este archivo en la exposición — son para memorizar la idea, no para recitar.
