# NexaSafe — Plan de Proyecto
### Sistema de alerta y acompañamiento en ruta casa–colegio
**Marco ágil:** Scrum · **Modelo de entrega:** DevSecOps
**Equipo:** Juan Felipe Pineda Cardona · «integrante 2» · «integrante 3»
**Programa:** Ingeniería de Sistemas — Fundación Universitaria San Mateo
**Periodo:** 2026-2 · **Versión del documento:** 1.1

---

## Tabla de contenido

1. [Visión del producto](#1-visión-del-producto)
2. [Alcance](#2-alcance)
3. [Arquitectura y stack](#3-arquitectura-y-stack)
4. [Organización Scrum](#4-organización-scrum)
5. [Artefactos Scrum](#5-artefactos-scrum)
6. [Definition of Ready y Definition of Done](#6-definition-of-ready-y-definition-of-done)
7. [Product Backlog](#7-product-backlog)
8. [Roadmap de sprints](#8-roadmap-de-sprints)
9. [Estrategia DevSecOps](#9-estrategia-devsecops)
10. [Pipeline CI/CD con controles de seguridad](#10-pipeline-cicd-con-controles-de-seguridad)
11. [Modelado de amenazas](#11-modelado-de-amenazas)
12. [Cumplimiento normativo y privacidad](#12-cumplimiento-normativo-y-privacidad)
13. [Estrategia de pruebas](#13-estrategia-de-pruebas)
14. [Métricas](#14-métricas)
15. [Gestión de riesgos](#15-gestión-de-riesgos)
16. [Entregables académicos](#16-entregables-académicos)

---

## 1. Visión del producto

> Para **niñas, niños y mujeres de la comunidad educativa** que recorren a diario el trayecto casa–colegio en zonas con riesgo de agresión, hurto o desaparición,
> **NexaSafe** es una **aplicación móvil de alerta y acompañamiento de trayecto**
> que permite activar una alerta silenciosa con ubicación en vivo hacia la red de apoyo del usuario y el puesto de control de la institución educativa,
> a diferencia de **llamar al 123 o escribir a un grupo de WhatsApp**,
> nuestro producto **detecta desviaciones de ruta automáticamente, funciona sin conexión estable, no expone al usuario mientras transmite y deja una bitácora auditable del incidente**.

### Alineación con el tema orientador — Restitución y Reparación

| Dimensión | Aporte de NexaSafe |
|---|---|
| **Prevención** | El acompañamiento en vivo reduce la ventana de vulnerabilidad del trayecto. |
| **Restitución** | Devuelve el derecho a la libre circulación segura de menores y mujeres en su entorno cotidiano. |
| **Reparación** | La bitácora de incidentes y el mapa de calor entregan evidencia para que el colegio, la JAC y la alcaldía local intervengan los puntos críticos del barrio. |

---

## 2. Alcance

### 2.1 Dentro del alcance (MVP académico)

- Registro de acudiente (guardián) y vinculación de perfiles protegidos validados por la institución.
- Gestión de rutas seguras con corredor geográfico y horarios esperados.
- Trayecto acompañado con ubicación en vivo y cierre automático por geocerca.
- Detección automática de desvío y de trayecto vencido, con escalamiento.
- Botón de pánico con ventana de cancelación por PIN y modo discreto.
- Notificación push simultánea a guardianes, red de apoyo y puesto de control.
- Confirmación de respuesta ("voy en camino") y cierre clasificado del incidente.
- Vista institucional dentro de la misma app móvil, con alertas activas e histórico agregado.
- Operación degradada sin datos: cola local + reenvío automático al recuperar la conexión.
- Pipeline DevSecOps completo desde el Sprint 0.

### 2.2 Fuera del alcance

- Integración técnica directa con la línea 123 o con sistemas de la Policía Nacional (requiere convenio interinstitucional). En el alcance académico el escalamiento a la autoridad se **simula**: el sistema genera y registra el reporte de escalamiento, pero no lo transmite a ningún organismo real.
- Wearables o botón físico externo.
- Videollamada en vivo.
- Versión iOS publicada en App Store (se desarrolla multiplataforma pero se distribuye Android vía EAS).
- Facturación o monetización.

### 2.3 Supuestos

- El colegio designa un responsable del puesto de control con equipo y conexión.
- Los menores portan un dispositivo Android 9+ con GPS.
- Existe autorización escrita del representante legal para el tratamiento de datos del menor.

---

## 3. Arquitectura y stack

### 3.1 Vista de componentes

```
┌─────────────────────────────────────────────────┐
│            App móvil (Expo / RN / TS)           │
│   Protegido · Guardián · Puesto de control      │
└───────────────────────┬─────────────────────────┘
                        │ HTTPS + Realtime (WSS)
                        ▼
          ┌─────────────────────────────────┐
          │            Supabase             │
          │  Auth · RLS · Realtime · Audit  │
          │  Edge Functions (Deno)          │
          └───┬───────────┬───────────┬─────┘
              │           │           │
    ┌─────────▼──┐ ┌──────▼───┐ ┌─────▼──────────┐
    │ PostgreSQL │ │ Storage  │ │ Expo Push /    │
    │ + PostGIS  │ │          │ │ WhatsApp Cloud │
    └────────────┘ └──────────┘ └────────────────┘
```

### 3.2 Stack

| Capa | Tecnología | Justificación |
|---|---|---|
| Móvil | Expo SDK + React Native + TypeScript | Requisito de la asignatura; `expo-location`, `expo-task-manager`, `expo-secure-store` cubren background location y almacenamiento cifrado. |
| Arquitectura móvil | Feature-based: `src/features/<f>/{data,domain,presentation}` + `src/core` | Continuidad con la estructura ya definida en el proyecto. |
| Backend | Supabase — PostgreSQL gestionado + Auth + Realtime + Edge Functions (Deno/TypeScript) | Elimina el montaje, despliegue y mantenimiento de infraestructura propia; autenticación, autorización por RLS y tiempo real vienen resueltos. |
| Base de datos | PostgreSQL 16 con extensión PostGIS (sobre Supabase) | Consultas geoespaciales para corredor seguro y geocercas. |
| Tiempo real | Supabase Realtime (WebSocket sobre Postgres) | Difusión de posición a N guardianes sin polling ni servidor propio. |
| Persistencia local | SQLite (`expo-sqlite`) + `expo-secure-store` | Cola offline y custodia del token/PIN. |
| Notificaciones | Expo Push Notifications + WhatsApp Cloud API (Meta) | Push como canal principal; WhatsApp a los contactos de seguridad y al puesto de control mediante plantilla aprobada. |
| Infraestructura | Supabase CLI (migraciones versionadas) · GitHub Actions · EAS Build | Reproducible y suficiente para el alcance académico, sin contenedores propios que administrar. |

---

## 4. Organización Scrum

### 4.1 Roles

| Rol | Responsable | Responsabilidades |
|---|---|---|
| **Product Owner** | Docente del proyecto integrador (o representante del colegio como cliente simulado) | Prioriza el backlog, acepta o rechaza el incremento en la review, resuelve dudas de negocio. |
| **Scrum Master** | Integrante rotativo del equipo | Facilita ceremonias, retira impedimentos, protege el sprint de cambios de alcance. |
| **Development Team** | 3 integrantes: Móvil, Backend/Datos, DevSecOps/QA | Multifuncional y autoorganizado. Cada integrante rota por el rol de *Security Champion* cada dos sprints. |

> **Nota de ajuste:** el equipo es de 2–3 integrantes. Con 3 se mantiene la velocidad objetivo de 24 puntos por sprint; con 2 se ajusta a **16–18 puntos por sprint**, se combinan los roles Dev + Scrum Master y las historias `Should` se sacrifican primero.

### 4.2 Ceremonias

| Ceremonia | Duración | Frecuencia | Salida |
|---|---|---|---|
| **Sprint Planning** | 2 h | Inicio de sprint (lunes) | Sprint Goal + Sprint Backlog comprometido |
| **Daily Scrum** | 15 min | Diario (asíncrono por Discord si no hay presencialidad) | Impedimentos identificados |
| **Refinement** | 1 h | Miércoles de la semana 1 | Historias del siguiente sprint estimadas y con DoR |
| **Sprint Review** | 1 h | Fin de sprint (viernes) | Incremento demostrado y feedback del PO |
| **Sprint Retrospective** | 45 min | Fin de sprint, después de la review | 1–2 acciones de mejora con responsable |
| **Security Review** | 30 min | Fin de sprint, previa a la review | Hallazgos del pipeline triados y priorizados en backlog |

### 4.3 Cadencia

- **Duración del sprint:** 2 semanas.
- **Sprint 0** dedicado a habilitación técnica y de seguridad (no produce valor de negocio, produce plataforma).
- **Sprint Goal único por sprint**, redactado en una sola frase orientada a resultado.

---

## 5. Artefactos Scrum

| Artefacto | Herramienta | Compromiso asociado |
|---|---|---|
| **Product Backlog** | GitHub Projects (vista *Backlog*) | Product Goal |
| **Sprint Backlog** | GitHub Projects (vista *Sprint actual*, columnas To Do / In Progress / In Review / Done) | Sprint Goal |
| **Incremento** | Build firmado en EAS + proyecto Supabase de staging migrado | Definition of Done |
| **Impediment Log** | Issues con etiqueta `impediment` | — |
| **Risk & Security Register** | `/docs/security/risk-register.md` versionado en el repo | — |

**Convención de issues:** cada historia de usuario es un issue con plantilla que incluye título en formato de historia, criterios de aceptación en Gherkin, estimación y etiquetas (`epic:*`, `type:*`, `security`).

---

## 6. Definition of Ready y Definition of Done

### 6.1 Definition of Ready (para entrar al sprint)

- [ ] Historia redactada en formato *Como… quiero… para…*
- [ ] Criterios de aceptación en Gherkin (Dado/Cuando/Entonces)
- [ ] Estimada por el equipo en puntos (Fibonacci)
- [ ] Dependencias técnicas identificadas y desbloqueadas
- [ ] Impacto en datos personales evaluado (¿toca datos de menores? ¿ubicación?)
- [ ] Diseño/wireframe disponible si la historia tiene UI
- [ ] Cabe holgadamente en un sprint (≤ 8 puntos; si no, se divide)

### 6.2 Definition of Done (para cerrar una historia)

**Funcional**
- [ ] Todos los criterios de aceptación verificados
- [ ] Probada en dispositivo Android físico, no solo en emulador

**Calidad de código**
- [ ] Pull Request revisado y aprobado por al menos un par
- [ ] Cobertura de pruebas unitarias ≥ 70 % en el módulo tocado
- [ ] Lint y formateo sin errores (ESLint + Prettier)
- [ ] Sin `TODO` ni código comentado en la rama principal

**Seguridad — obligatorio, no negociable**
- [ ] SAST (Semgrep) sin hallazgos *High* o *Critical*
- [ ] SCA (`npm audit`) sin vulnerabilidades *Critical* explotables
- [ ] Escaneo de secretos (Gitleaks) limpio
- [ ] Ningún dato personal en logs (verificado manualmente en el PR)
- [ ] Tablas y Edge Functions nuevas con RLS, autorización por rol y rate limiting

**Documentación y entrega**
- [ ] `README` / `CHANGELOG` actualizados
- [ ] Tipos de Supabase regenerados y políticas RLS actualizadas si cambió el esquema
- [ ] Desplegado en el ambiente de *staging* por el pipeline
- [ ] Demostrable en la Sprint Review

---

## 7. Product Backlog

### 7.1 Épicas

| ID | Épica | Objetivo |
|---|---|---|
| **E0** | Plataforma DevSecOps | Repositorio, pipeline, ambientes y controles automáticos de seguridad. |
| **E1** | Identidad y vinculación | Registro de guardián, alta de protegido, validación institucional. |
| **E2** | Red de apoyo | Guardianes, contactos de apoyo y permisos diferenciados. |
| **E3** | Rutas seguras | Definición de ruta, corredor y ventana horaria esperada. |
| **E4** | Trayecto acompañado | Inicio, seguimiento en vivo, cierre automático. |
| **E5** | Detección automática | Desvío del corredor, trayecto vencido, escalamiento. |
| **E6** | Alerta de pánico | Disparo, cancelación por PIN, modo discreto, transmisión. |
| **E7** | Respuesta | Recepción por guardián, confirmación "voy en camino", coordinación. |
| **E8** | Vista institucional | Alertas activas, reporte de escalamiento, histórico. |
| **E9** | Incidentes y bitácora | Registro auditable, cierre clasificado, mapa de calor. |
| **E10** | Resiliencia offline | Cola local, reintentos y reenvío automático al recuperar conexión. |
| **E11** | Privacidad y cumplimiento | Consentimiento, retención, exportación y supresión de datos. |

### 7.2 Historias de usuario priorizadas

> Prioridad: **M** = Must · **S** = Should · **C** = Could (MoSCoW). Estimación en puntos de historia.

#### E0 — Plataforma DevSecOps

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E0-01 | Como equipo, quiero un monorepo con ramas protegidas y plantillas de PR, para que ningún cambio llegue a `main` sin revisión. | 3 | M |
| E0-02 | Como equipo, quiero un pipeline de CI que ejecute lint, pruebas y build en cada PR, para detectar regresiones antes del merge. | 5 | M |
| E0-03 | Como Security Champion, quiero SAST, SCA y escaneo de secretos automáticos, para que las vulnerabilidades se detecten sin depender de revisión manual. | 5 | M |
| E0-04 | Como equipo, quiero ambientes `dev` y `staging` desplegados por pipeline, para probar el incremento en condiciones reales. | 5 | M |
| E0-05 | Como equipo, quiero generación automática de SBOM en cada release, para conocer el inventario de dependencias del producto. | 3 | S |

#### E1 — Identidad y vinculación

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E1-01 | Como acudiente, quiero registrarme con correo y contraseña, para administrar los perfiles de mis hijos. | 3 | M |
| E1-02 | Como acudiente, quiero registrar a un menor y quedar vinculado como su guardián, para poder acompañar sus trayectos. | 5 | M |
| E1-03 | Como colegio, quiero validar que el menor está matriculado antes de activar su perfil, para impedir vinculaciones falsas. | 5 | M |
| E1-04 | Como protegido, quiero ingresar con un PIN corto en lugar de contraseña, para acceder rápido sin exponer credenciales. | 3 | M |
| E1-05 | Como usuario, quiero que mi sesión se guarde cifrada en el dispositivo, para no reautenticarme en cada trayecto. | 3 | M |

**Criterios de aceptación — E1-02**
```gherkin
Dado que soy un acudiente autenticado
Cuando registro un menor con nombre, documento, foto y colegio
Entonces el perfil queda en estado PENDIENTE_VALIDACION
Y no puede iniciar trayectos hasta que el colegio lo apruebe
Y queda registrada la autorización de tratamiento de datos del representante legal
```

#### E2 — Red de apoyo

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E2-01 | Como guardián, quiero invitar contactos de apoyo por enlace, para ampliar quién puede auxiliar al menor. | 5 | M |
| E2-02 | Como guardián, quiero definir qué ve cada contacto (solo alertas vs. trayectos), para no exponer la rutina del menor de más. | 5 | S |
| E2-03 | Como guardián, quiero revocar un contacto en cualquier momento, para retirar el acceso de inmediato. | 3 | M |

#### E3 — Rutas seguras

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E3-01 | Como guardián, quiero definir la ruta casa–colegio sobre un mapa, para que el sistema sepa por dónde debe ir el menor. | 8 | M |
| E3-02 | Como guardián, quiero configurar un corredor de tolerancia en metros, para evitar falsas alarmas por desvíos menores. | 3 | M |
| E3-03 | Como guardián, quiero definir la duración esperada del trayecto, para que el sistema detecte demoras anómalas. | 3 | M |

#### E4 — Trayecto acompañado

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E4-01 | Como protegido, quiero iniciar un trayecto con un toque, para activar el acompañamiento sin fricción. | 5 | M |
| E4-02 | Como guardián, quiero ver la ubicación del protegido en vivo durante el trayecto, para saber dónde va. | 8 | M |
| E4-03 | Como protegido, quiero que el trayecto se cierre solo al llegar al destino, para no depender de mi memoria. | 5 | M |
| E4-04 | Como protegido, quiero ver un indicador permanente de que estoy siendo acompañado, para saber cuándo se comparte mi ubicación. | 2 | M |

#### E5 — Detección automática

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E5-01 | Como sistema, quiero detectar cuando el protegido sale del corredor, para marcar el trayecto como DESVIADO. | 8 | M |
| E5-02 | Como protegido, quiero recibir una consulta "¿estás bien?" con 60 s de temporizador ante un desvío, para descartar una falsa alarma. | 5 | M |
| E5-03 | Como sistema, quiero escalar a ALERTA si no hay respuesta al temporizador, para no depender de que el usuario pueda reaccionar. | 5 | M |
| E5-04 | Como sistema, quiero marcar el trayecto como vencido si excede la duración esperada, para cubrir el caso de retención sin desvío. | 5 | S |

#### E6 — Alerta de pánico

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E6-01 | Como protegido, quiero disparar una alerta manteniendo presionado el botón 3 s, para pedir ayuda sin toques accidentales. | 5 | M |
| E6-02 | Como protegido, quiero disparar la alerta sacudiendo el celular durante un trayecto activo, para activarla sin mirar la pantalla. | 5 | S |
| E6-03 | Como protegido, quiero cancelar la alerta con mi PIN dentro de 10 s, para corregir un disparo involuntario. | 3 | M |
| E6-04 | Como protegido, quiero que la pantalla entre en modo discreto durante la alerta, para que un agresor no note que estoy transmitiendo. | 5 | M |
| E6-05 | Como sistema, quiero enviar ubicación cada 5–10 s durante la alerta, para dar trazabilidad al desplazamiento. | 5 | M |
| E6-06 | Como guardián, quiero autorizar la captura de audio ambiente durante alertas, para contar con evidencia si ocurre un hecho. | 8 | C |

**Criterios de aceptación — E6-03**
```gherkin
Dado que se disparó una alerta
Cuando ingreso mi PIN correcto dentro de los 10 segundos
Entonces la alerta se cancela y nadie recibe notificación
Y queda un registro local del disparo cancelado

Dado que se disparó una alerta
Cuando ingreso un PIN incorrecto o dejo vencer el temporizador
Entonces la alerta se envía de inmediato
Y no vuelve a solicitarse confirmación
```

#### E7 — Respuesta

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E7-01 | Como guardián, quiero recibir una notificación push con sonido prioritario ante una alerta, para reaccionar aunque el teléfono esté en silencio. | 5 | M |
| E7-02 | Como guardián, quiero marcar "voy en camino", para que los demás sepan que la alerta ya está siendo atendida. | 3 | M |
| E7-03 | Como guardián, quiero ver quién más respondió y a qué hora, para coordinar sin duplicar esfuerzos. | 3 | S |

#### E8 — Vista institucional (dentro de la app)

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E8-01 | Como puesto de control, quiero una vista en la app con las alertas activas sobre un mapa, para atenderlas en tiempo real. | 8 | M |
| E8-02 | Como puesto de control, quiero generar un reporte de escalamiento con los datos del incidente, para entregarlo a la autoridad (el envío a la autoridad se simula en la fase académica). | 5 | M |
| E8-03 | Como coordinador, quiero un mapa de calor de incidentes por zona y franja horaria, para sustentar intervenciones en el barrio. | 8 | S |

#### E9 — Incidentes y bitácora

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E9-01 | Como sistema, quiero registrar cada evento del incidente con marca de tiempo inmutable, para tener una bitácora auditable. | 5 | M |
| E9-02 | Como guardián o puesto de control, quiero cerrar la alerta clasificándola, para dejar constancia del desenlace. | 3 | M |
| E9-03 | Como coordinador, quiero consultar el histórico de incidentes de un protegido, para hacer seguimiento a casos reincidentes. | 5 | S |

#### E10 — Resiliencia offline

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E10-01 | Como sistema, quiero encolar la alerta localmente si no hay red, para enviarla apenas se recupere la conexión. | 8 | M |
| E10-02 | Como sistema, quiero reintentar el envío en segundo plano hasta confirmar la entrega, para no perder una alerta encolada. | 5 | S |
| E10-03 | Como guardián, quiero ver la marca "última posición hace X min", para no confundir un dato viejo con uno actual. | 3 | M |

#### E11 — Privacidad y cumplimiento

| ID | Historia | Pts | Pri |
|---|---|---|---|
| E11-01 | Como acudiente, quiero otorgar consentimiento explícito y verificable para el tratamiento de datos del menor, para cumplir la ley. | 5 | M |
| E11-02 | Como sistema, quiero eliminar automáticamente los trayectos con más de 90 días, para minimizar datos almacenados. | 5 | M |
| E11-03 | Como acudiente, quiero exportar y solicitar la supresión de los datos de mi hijo, para ejercer el derecho de habeas data. | 5 | S |
| E11-04 | Como sistema, quiero no compartir ubicación fuera de trayecto activo o alerta, para garantizar el principio de finalidad. | 3 | M |

**Total estimado del backlog:** ≈ 210 puntos

---

## 8. Roadmap de sprints

**Velocidad objetivo:** 24 pts/sprint (equipo de 3) — se recalibra tras el Sprint 1 con la velocidad real. Con equipo de 2 se ajusta a 16–18 pts y las historias `Should` se sacrifican primero.

| Sprint | Fechas (2026) | Sprint Goal | Contenido | Pts |
|---|---|---|---|---|
| **0** | 22 sep – 2 oct | *La plataforma técnica y de seguridad está lista para producir código auditable.* | E0-01, E0-02, E0-03, E0-04, modelado de amenazas inicial | 18 |
| **1** | 6 – 17 oct | *Un acudiente puede registrarse, dar de alta a un menor y el colegio validarlo.* | E1-01…E1-05, E11-01 | 24 |
| **2** | 20 – 31 oct | *Un guardián puede definir la ruta y seguir en vivo el trayecto del protegido.* | E3-01, E3-02, E3-03, E4-01, E4-04, E2-01 | 26 |
| **3** | 3 – 14 nov | *El botón de pánico funciona de extremo a extremo con cancelación y modo discreto.* | E4-02, E4-03, E6-01, E6-03, E6-05 | 26 |
| **4** | 17 – 28 nov | *El puesto de control atiende alertas desde la app y deja bitácora del incidente.* | E6-04, E7-01, E7-02, E8-01, E9-01, E9-02, E11-04 | 27 |
| **Cierre** | 24 – 28 nov (solapado) | *Producto sustentado y documentado.* | Release candidate firmado, manual, video demo, informe final | — |

### Fuera del roadmap del semestre

El backlog completo suma ≈ 210 puntos y la capacidad disponible hasta noviembre es de ≈ 121. Las siguientes historias quedan declaradas como **trabajo futuro**, no como alcance comprometido:

| Épica / historia | Motivo |
|---|---|
| **E5 completa** — detección automática de desvío y trayecto vencido | Requiere corredor geoespacial y ubicación en segundo plano estables; se pospone a una segunda fase |
| **E10 completa** — cola offline y reintentos | Depende de E4 y E6 consolidadas |
| E2-02, E2-03 — permisos diferenciados y revocación de contactos | `Should` desplazadas por capacidad |
| E6-02 — disparo por sacudida | `Should`; se implementa solo si sobra capacidad en el Sprint 4 |
| E6-06 — captura de audio ambiente | `Could` |
| E8-02, E8-03 — reporte de escalamiento y mapa de calor | `Should` |
| E9-03, E11-02, E11-03 — histórico, purga automática y exportación | `Should` |

### Hitos

| Hito | Fecha | Criterio de cumplimiento |
|---|---|---|
| **H0 — Documentación de ingeniería entregada** | 22 sep | Los cinco documentos exigidos radicados |
| **H1 — Pipeline verde** | 2 oct | Todo PR ejecuta lint + test + SAST + SCA automáticamente |
| **H2 — Primer incremento demostrable** | 17 oct | Alta de usuario funcionando en dispositivo real |
| **H3 — Núcleo funcional** | 31 oct | Trayecto acompañado con ubicación en vivo operando |
| **H4 — MVP funcional completo** | 14 nov | Flujo alerta → notificación → respuesta → cierre completo |
| **H5 — Release candidate** | 25 nov | Build firmado, sin hallazgos High/Critical abiertos |
| **H6 — Sustentación** | 28 nov | Demo en vivo + informe + repositorio entregado |

---

## 9. Estrategia DevSecOps

> **Principio rector:** *shift-left*. La seguridad no es una fase previa a la entrega; es un criterio de la Definition of Done que se ejecuta automáticamente en cada commit.

### 9.1 Controles por fase del ciclo

| Fase | Práctica | Herramienta | Cuándo se ejecuta |
|---|---|---|---|
| **Plan** | Modelado de amenazas STRIDE por épica | OWASP Threat Dragon | Refinement de cada épica nueva |
| | Historias de abuso (*abuser stories*) junto a las de usuario | Plantilla de issue | Refinement |
| **Code** | Pre-commit hooks: formato, lint, secretos | `pre-commit`, Gitleaks | Local, antes del commit |
| | Revisión de pares obligatoria | GitHub branch protection | Antes del merge |
| | Estándar de codificación segura | OWASP MASVS (móvil) + ASVS (API) | Continuo |
| **Build** | Análisis estático de código | Semgrep + CodeQL | En cada PR |
| | Análisis de composición de software | `npm audit`, Dependabot | En cada PR + semanal |
| | Generación de SBOM | Syft (CycloneDX) | En cada release |
| **Test** | Pruebas unitarias e integración | Jest + RNTL, deno test | En cada PR |
| | Pruebas E2E móviles | Maestro | Nocturno + pre-release |
| | Análisis dinámico de la API | OWASP ZAP baseline | Nightly contra staging |
| | Análisis del binario móvil | MobSF sobre el APK | Pre-release |
| **Release** | Firma del artefacto y build reproducible | EAS Build + keystore en secretos | Al taggear versión |
| | Gestión de secretos | GitHub Secrets + EAS Secrets, cero `.env` en repo | Continuo |
| **Deploy** | Verificación de políticas RLS y migraciones antes de aplicar | Supabase CLI + suite de pruebas de política | Antes del despliegue |
| | Infraestructura versionada | Migraciones y políticas RLS en `supabase/` dentro del repo | Continuo |
| **Operate** | Logs estructurados sin datos personales | JSON logging + redacción de PII | Runtime |
| | Registro de auditoría append-only | Tabla `audit_log` en PostgreSQL | Runtime |
| **Monitor** | Monitoreo de errores | Sentry (móvil + backend) | Runtime |
| | Alertas de dependencias vulnerables | Dependabot alerts | Continuo |

### 9.2 Política de tratamiento de hallazgos

| Severidad | SLA de corrección | Efecto |
|---|---|---|
| **Critical** | 24 h | Bloquea el merge y el despliegue |
| **High** | Dentro del sprint actual | Bloquea el merge |
| **Medium** | Siguiente sprint | Advertencia; entra al backlog como issue `security` |
| **Low** | Backlog priorizado | Registrado, sin bloqueo |

Toda excepción se documenta en `/docs/security/exceptions.md` con justificación, responsable y fecha de vencimiento. **No hay excepciones permanentes.**

### 9.3 Rol de Security Champion

Un integrante del Development Team asume el rol por dos sprints:
- Facilita el modelado de amenazas en el refinement.
- Tría los hallazgos del pipeline antes de la Security Review.
- Mantiene el registro de riesgos y las excepciones.
- Presenta el estado de seguridad en la Sprint Review (3 min fijos).

### 9.4 Controles de seguridad específicos del producto

| Control | Implementación |
|---|---|
| Cifrado en tránsito | TLS 1.3 obligatorio + certificate pinning en el cliente móvil |
| Cifrado en reposo | Cifrado a nivel de columna para documento, foto y ubicación histórica |
| Autenticación | JWT de vida corta (15 min) + refresh token rotativo revocable |
| Autorización | RBAC: `protegido`, `guardian`, `apoyo`, `institucion` — verificada en cada endpoint |
| Protección del PIN | Hash Argon2id, nunca en texto plano, almacenado en `expo-secure-store` |
| Anti-abuso | Rate limiting por IP y por usuario en endpoints de alerta y autenticación |
| Anti-tampering | Detección de root/emulador en modo release |
| Minimización | Solo se persiste ubicación con trayecto o alerta activos; fuera de eso no se recolecta |
| Trazabilidad | Todo acceso a datos de un menor queda en `audit_log` con actor, acción y timestamp |

---

## 10. Pipeline CI/CD con controles de seguridad

### 10.1 Flujo de ramas

```
feature/E6-01-boton-panico ──PR──► develop ──release──► main ──tag──► producción
                             │                  │
                       CI + gates          deploy staging      deploy prod + EAS build
```

- `main` protegida: sin push directo, requiere PR aprobado y CI verde.
- `develop`: integración continua, despliegue automático a staging.
- Ramas de trabajo: `feature/<ID-historia>-<slug>`, `fix/<slug>`, `sec/<slug>`.
- Commits en formato Conventional Commits para generar `CHANGELOG` automático.

### 10.2 Etapas del pipeline (GitHub Actions)

```yaml
# Resumen conceptual — .github/workflows/ci.yml

on: [pull_request, push]

jobs:
  1_secrets_scan:      # Gitleaks — falla si hay credenciales en el diff
  2_lint:              # ESLint + Prettier (móvil) · deno lint (Edge Functions)
  3_typecheck:         # tsc --noEmit
  4_unit_tests:        # Jest + RNTL · deno test — umbral de cobertura 70 %
  5_sast:              # Semgrep (reglas OWASP + react-native) · CodeQL
  6_sca:               # npm audit --audit-level=high · Dependabot
  7_build:             # expo prebuild + expo export · supabase functions build
  8_rls_policy_check:  # pruebas de políticas RLS contra base efímera de Supabase
  9_deploy_staging:    # solo en develop — supabase db push + functions deploy
  10_dast:             # OWASP ZAP baseline contra Edge Functions de staging (nightly)
  11_mobile_scan:      # MobSF sobre el APK (solo en release)
  12_sbom:             # Syft → CycloneDX adjunto al release
```

**Quality gate:** las etapas 1, 5, 6 y 8 son bloqueantes ante severidad *High* o superior. Un PR que falle cualquiera de ellas no puede mergearse, sin importar la urgencia.

---

## 11. Modelado de amenazas

Metodología **STRIDE**, ejecutada por épica durante el refinement.

| Amenaza | Escenario concreto en NexaSafe | Mitigación | Historia asociada |
|---|---|---|---|
| **S** — Spoofing | Un tercero se registra como guardián de un menor que no le corresponde. | Validación de matrícula por el colegio + invitación por enlace firmado con expiración. | E1-03, E2-01 |
| **T** — Tampering | Manipulación de coordenadas mediante GPS falso para simular que el menor llegó. | Validación de plausibilidad (velocidad, saltos imposibles) en Edge Function + detección de mock location. | E5-01 |
| **R** — Repudiation | Un guardián niega haber recibido la alerta. | Bitácora append-only con acuse de recibo por dispositivo y timestamp del servidor. | E9-01 |
| **I** — Information disclosure | Fuga del histórico de rutas de un menor: equivale a entregar su rutina diaria a un agresor. | Cifrado por columna, retención de 90 días, ubicación solo durante trayecto/alerta, RBAC estricto. | E11-02, E11-04 |
| **D** — Denial of service | Inundación de alertas falsas que satura el puesto de control. | Rate limiting por usuario, priorización por historial de veracidad, cierre clasificado. | E9-02 |
| **E** — Elevation of privilege | Un contacto de apoyo accede a funciones de guardián. | RBAC verificado del lado servidor, nunca en el cliente; pruebas de autorización en CI. | E2-02 |

### Historias de abuso

- *Como agresor, quiero forzar al menor a cancelar la alerta* → mitigación: la alerta ya salió; la ventana de 10 s con PIN es local y el modo discreto evita que el agresor sepa que se envió.
- *Como agresor, quiero apagar el celular para cortar el rastreo* → mitigación: la última posición conocida se persiste en servidor; la desconexión abrupta durante alerta genera una notificación adicional.
- *Como atacante, quiero enumerar usuarios por el endpoint de invitación* → mitigación: respuestas genéricas, tokens opacos, rate limiting.

---

## 12. Cumplimiento normativo y privacidad

| Marco | Exigencia | Implementación en NexaSafe |
|---|---|---|
| **Ley 1581 de 2012** (Protección de datos personales) | Autorización previa, expresa e informada | Pantalla de consentimiento con versionado y registro de aceptación (E11-01) |
| **Decreto 1377 de 2013** | Política de tratamiento publicada y accesible | Documento en la app y en el repositorio |
| **Sentencia C-748 de 2011** | Los datos de menores son datos sensibles; su tratamiento debe responder al interés superior del niño | Autorización otorgada por el representante legal; finalidad única de protección; minimización |
| **Principio de finalidad** | El dato solo se usa para lo autorizado | Ubicación recolectada exclusivamente durante trayecto o alerta activos (E11-04) |
| **Principio de temporalidad** | No conservar más allá de lo necesario | Purga automática de trayectos a los 90 días; incidentes conservados por 1 año (E11-02) |
| **Habeas data** | Derecho de acceso, corrección y supresión | Exportación y solicitud de supresión desde la app (E11-03) |
| **Registro Nacional de Bases de Datos (SIC)** | Inscripción si el tratamiento es real | Documentado como requisito previo a un despliegue en producción real |

**Evaluación de impacto en privacidad (PIA):** se elabora en el Sprint 1 y se actualiza cada vez que una historia nueva toque datos de menores. Vive en `/docs/privacy/pia.md`.

---

## 13. Estrategia de pruebas

### Pirámide

| Nivel | Cobertura objetivo | Herramienta | Ejecución |
|---|---|---|---|
| **Unitarias** | 70 % de lógica de dominio | Jest + RNTL, Deno test | Cada PR |
| **Integración** | Flujos críticos (alerta, trayecto, auth) | Supabase local vía CLI con base efímera; pruebas de Edge Functions y de políticas RLS | Cada PR |
| **E2E** | 5 flujos críticos | Maestro | Nightly |
| **Seguridad** | SAST/SCA/DAST/MobSF | Ver sección 10 | Cada PR / nightly / release |
| **Aceptación** | Criterios Gherkin de cada historia | Manual en dispositivo físico | Antes de la review |

### Flujos E2E obligatorios

1. Registro de guardián → alta de menor → validación del colegio → primer login del protegido.
2. Inicio de trayecto → seguimiento → llegada → cierre automático.
3. Desvío del corredor → temporizador → sin respuesta → alerta automática.
4. Botón de pánico → cancelación exitosa con PIN.
5. Botón de pánico → alerta enviada → recepción del guardián → "voy en camino" → cierre clasificado.

### Pruebas de campo

En el Sprint 6 se ejecuta una prueba real de trayecto en un recorrido de aproximadamente 1 km, midiendo: precisión del GPS, consumo de batería por hora de trayecto, latencia entre disparo y notificación recibida, y comportamiento en zonas de baja cobertura.

---

## 14. Métricas

### Métricas Scrum

| Métrica | Objetivo | Cómo se mide |
|---|---|---|
| Velocidad | Estable ±15 % entre sprints | Puntos completados por sprint |
| Cumplimiento del Sprint Goal | ≥ 85 % de los sprints | Aceptación en la review |
| Trabajo no planificado | ≤ 15 % del sprint | Puntos de issues agregados en curso |
| Burndown | Descendente sin mesetas prolongadas | GitHub Projects |

### Métricas DevOps (DORA)

| Métrica | Objetivo |
|---|---|
| Frecuencia de despliegue a staging | ≥ 1 por día hábil |
| Lead time (commit → staging) | < 30 min |
| Tasa de fallo en cambios | < 15 % |
| Tiempo de recuperación (MTTR) | < 2 h |

### Métricas de seguridad

| Métrica | Objetivo |
|---|---|
| Vulnerabilidades Critical/High abiertas al cierre del sprint | 0 |
| Tiempo medio de remediación de hallazgos High | < 5 días |
| Cobertura del pipeline de seguridad | 100 % de los PR |
| Secretos filtrados detectados en `main` | 0 |

### Métricas de producto

| Métrica | Objetivo |
|---|---|
| Latencia disparo → notificación recibida | < 5 s con red, < 30 s con reconexión |
| Precisión de posición reportada | < 20 m en zona urbana abierta |
| Consumo de batería por hora de trayecto | < 8 % |
| Tasa de falsas alarmas automáticas | < 10 % de los trayectos |

---

## 15. Gestión de riesgos

| ID | Riesgo | Prob. | Impacto | Respuesta |
|---|---|---|---|---|
| R1 | La ubicación en segundo plano se detiene por optimización de batería del fabricante (Xiaomi, Huawei) | Alta | Alto | Investigación temprana en Sprint 2; guía de exclusión de optimización para el usuario; foreground service persistente |
| R2 | Falsas alarmas frecuentes erosionan la confianza y la gente deja de atender | Media | Alto | Corredor de tolerancia configurable, temporizador de confirmación, sin sanción por falsa alarma |
| R3 | El colegio no designa responsable del puesto de control | Media | Alto | Diseñar el flujo para que funcione solo con la red de apoyo si no hay institución activa |
| R4 | Fuga de datos de menores | Baja | Crítico | Cifrado, minimización, retención corta, RBAC, auditoría, pentest interno en Sprint 6 |
| R5 | El número de prueba de WhatsApp Cloud API solo alcanza 5 destinatarios verificados | Alta | Medio | Declarado como restricción de diseño (máx. 5 contactos de seguridad por usuario); el push permanece como canal principal sin ese límite |
| R6 | Alcance excesivo para el tiempo disponible del semestre | Alta | Alto | MoSCoW estricto; las historias `Could` se sacrifican primero; revisión de alcance en el hito H3 |
| R7 | Rotación o baja disponibilidad de un integrante | Media | Medio | Propiedad colectiva del código, documentación en el repo, sin conocimiento aislado en una persona |
| R8 | Falsos positivos del disparo por sacudida (correr, bus, guardar el celular) | Alta | Medio | Umbral calibrado + ventana de cancelación por PIN; la sacudida solo se activa en modo trayecto con la app en primer plano; degradar E6-02 a `Could` si no es viable |

---

## 16. Entregables académicos

| Entregable | Formato | Fecha |
|---|---|---|
| Documento de requisitos del sistema | PDF | 22 sep |
| Plan de desarrollo de software | PDF | 22 sep |
| Cronograma y tareas del proyecto | PDF | 22 sep |
| Documento de diseño arquitectónico | PDF | 22 sep |
| Informe de pruebas de calidad y control de errores | PDF | 22 sep (v1, iteración 0) · actualizado al cierre |
| Ficha técnica del proyecto integrador | PDF | Sprint 0 |
| Evaluación de impacto en privacidad (PIA) | Markdown en repo | Sprint 1 |
| Repositorio con historial de commits y PR | GitHub | Continuo |
| Tablero Scrum con backlog, sprints y burndown | GitHub Projects | Continuo |
| Actas de retrospectiva | Markdown en repo | Cada sprint |
| APK firmado (release candidate) | Artefacto EAS | Sprint 4 |
| SBOM y reporte consolidado de seguridad | CycloneDX + PDF | Sprint 4 |
| Manual de usuario e instalación | PDF | Cierre |
| Video demostrativo (5–7 min) | MP4 | Cierre |
| Informe final y sustentación | PDF + presentación | Cierre |

---

## Anexo A — Estructura del repositorio

```
nexasafe/
├── .github/
│   ├── workflows/           # ci.yml, nightly-security.yml, release.yml
│   ├── ISSUE_TEMPLATE/      # user-story.md, bug.md, security-finding.md
│   └── pull_request_template.md
├── apps/
│   └── mobile/              # Expo + React Native + TypeScript
│       └── src/
│           ├── core/        # api, storage, permissions, theme, utils
│           └── features/
│               ├── auth/          {data,domain,presentation}
│               ├── profile/
│               ├── routes/
│               ├── tracking/
│               ├── alerts/
│               ├── network/
│               ├── institution/   # vista del puesto de control
│               └── incidents/
├── supabase/
│   ├── migrations/          # esquema versionado
│   ├── functions/           # Edge Functions (Deno): notify-push, notify-whatsapp, escalate
│   └── policies/            # políticas RLS documentadas y probadas
├── docs/
│   ├── architecture/
│   ├── security/            # threat-model.md, risk-register.md, exceptions.md
│   ├── privacy/             # pia.md, politica-tratamiento.md
│   └── scrum/               # sprint-XX/{planning,review,retro}.md
├── .pre-commit-config.yaml
├── .gitleaks.toml
├── semgrep.yml
└── README.md
```

## Anexo B — Plantilla de historia de usuario

```markdown
## Historia
Como <rol>
quiero <capacidad>
para <beneficio>

## Criterios de aceptación
```gherkin
Dado <contexto>
Cuando <acción>
Entonces <resultado esperado>
```

## Consideraciones de seguridad y privacidad
- ¿Toca datos personales de menores? Sí / No
- ¿Requiere nuevo permiso del dispositivo? ¿Cuál y con qué justificación?
- Amenazas STRIDE aplicables:
- Controles a implementar:

## Definition of Done
- [ ] Criterios de aceptación verificados
- [ ] PR revisado y aprobado
- [ ] Cobertura ≥ 70 % en el módulo
- [ ] SAST / SCA / secretos sin hallazgos High+
- [ ] Sin datos personales en logs
- [ ] Probado en dispositivo Android físico
- [ ] Desplegado en staging

**Épica:** · **Estimación:** · **Prioridad MoSCoW:**
```

---

*Documento vivo. Se actualiza al cierre de cada sprint con la velocidad real, los cambios de alcance y las acciones de mejora de la retrospectiva.*


---

## Registro de cambios

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | — | Versión inicial |
| 1.1 | 19 sep 2026 | Backend migrado de FastAPI/PostGIS/Redis/Docker a Supabase. Dashboard web eliminado: el puesto de control opera dentro de la app móvil. Canal SMS reemplazado por WhatsApp Cloud API. Disparo por botón físico reemplazado por sacudida en modo trayecto. Escalamiento a autoridad declarado como simulado. Roadmap recalendarizado al cierre de noviembre y alcance recortado con lista explícita de trabajo futuro. |