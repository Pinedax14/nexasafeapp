# Guía paso a paso — Proyecto NexaSafe

**Ingeniería de Software I · FUSM · 2026-2**
Periodo: 22 sep – 28 nov 2026 · Marco: Scrum + DevSecOps · Sprints de 2 semanas

Esta guía resume **qué hacer, en qué orden y qué archivos deben existir** en cada fase. Se basa en los 5 documentos entregados (Requisitos, Plan de Desarrollo, Cronograma, Diseño Arquitectónico e Informe de Pruebas).

---

## 0. Antes de empezar: corregir inconsistencias en los documentos

Al cruzar los 5 PDF aparecen contradicciones. Si el docente las detecta en la sustentación, restan credibilidad. Corrígelas en la v1.1 de los documentos.

| # | Problema | Dónde | Cómo corregirlo |
|---|---|---|---|
| 1 | Sprint 4 dice **27 pts**, pero sus historias suman **32** (5+5+3+8+5+3+3) | Cronograma 4.5 y cap. 6 | Mover E11-04 (3) y E9-02 (3) a otro sprint, o actualizar a 32 pts y la capacidad total a ≈126 |
| 2 | El hito **H3 (31 oct)** exige "ubicación en vivo operando", pero **E4-02** está en el Sprint 3 (3–14 nov) | Cronograma 3 y 4.4 | Mover E4-02 al Sprint 2 o cambiar el criterio de H3 |
| 3 | El Sprint Goal del Sprint 3 dice "con modo discreto", pero **E6-04** está en el Sprint 4 | Cronograma 4.4 / 4.5 | Quitar "modo discreto" del goal del Sprint 3 |
| 4 | Varios requisitos **MUST** quedaron como trabajo futuro: E2-03, E5 completa, E8-02, E10-01, E10-03 y E11-02 | Requisitos 3.1 vs. Cronograma cap. 6 | Reclasificarlos como SHOULD/WON'T (esta fase) o incluirlos en el roadmap |
| 5 | La sección 6.1 de Requisitos pone "detección automática de desvío" **dentro** del alcance, pero la matriz la declara trabajo futuro | Requisitos 6.1 vs. 5 | Pasar ese punto a "Fuera del alcance de esta fase" |
| 6 | Se menciona un **Sprint 6** (pentest interno, prueba de campo), pero solo existen los Sprints 0–4 y Cierre | Plan R4, Informe cap. 7 | Aclarar que es una fase posterior al semestre |
| 7 | El Sprint 4 termina el 28 nov, el mismo día de la sustentación | Cronograma | Cerrar el desarrollo el 24 nov y dejar 25–28 nov solo para el cierre |

---

## 1. Estructura de archivos que debe existir en el repositorio

```
nexasafe/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                   # lint + test + build + SAST + SCA + secretos
│   │   ├── nightly-security.yml     # OWASP ZAP + E2E Maestro
│   │   └── release.yml              # EAS Build firmado + SBOM
│   ├── ISSUE_TEMPLATE/
│   │   ├── user-story.md
│   │   ├── bug.md
│   │   └── security-finding.md
│   └── pull_request_template.md
├── apps/mobile/                     # Expo + React Native + TypeScript
│   └── src/
│       ├── core/                    # api, storage, permissions, theme, utils
│       └── features/                # auth, profile, routes, tracking, alerts,
│                                    # network, institution, incidents
├── supabase/
│   ├── migrations/
│   ├── functions/                   # notify-push, notify-whatsapp, escalate
│   └── policies/
├── docs/
│   ├── entregables/                 # los 5 PDF oficiales (01 a 05)
│   ├── architecture/
│   ├── security/
│   │   ├── threat-model.md
│   │   ├── risk-register.md
│   │   └── exceptions.md
│   ├── privacy/
│   │   ├── pia.md
│   │   └── politica-tratamiento.md
│   ├── scrum/
│   │   └── sprint-XX/
│   │       ├── planning.md
│   │       ├── review.md
│   │       └── retro.md
│   └── manual/                      # manual de usuario e instalación (cierre)
├── .pre-commit-config.yaml
├── .gitleaks.toml
├── semgrep.yml
├── CHANGELOG.md
└── README.md
```

### Archivos de información obligatorios

| Archivo | Contenido | Cuándo se crea |
|---|---|---|
| `README.md` | Qué es NexaSafe, cómo instalar, correr y probar | Sprint 0; se actualiza siempre |
| `CHANGELOG.md` | Cambios por versión o sprint | Sprint 0; se actualiza en cada historia |
| `docs/security/threat-model.md` | Modelado de amenazas STRIDE por épica | Sprint 0; se amplía en cada refinement |
| `docs/security/risk-register.md` | Riesgos R1–R8 con estado actualizado | Sprint 0; se revisa en cada Security Review |
| `docs/security/exceptions.md` | Excepciones de seguridad con responsable y vencimiento | Sprint 0 (vacío); se llena si hace falta |
| `docs/privacy/pia.md` | Evaluación de impacto en privacidad | Sprint 1 (antes de tocar datos de menores) |
| `docs/privacy/politica-tratamiento.md` | Política de datos según la Ley 1581 | Sprint 1 |
| `docs/scrum/sprint-XX/planning.md` | Sprint Goal, historias comprometidas y capacidad | Inicio de cada sprint |
| `docs/scrum/sprint-XX/review.md` | Qué se demostró, feedback del PO y aceptado/rechazado | Fin de cada sprint |
| `docs/scrum/sprint-XX/retro.md` | Qué salió bien, qué mejorar y 1–2 acciones con responsable | Fin de cada sprint |
| `docs/entregables/05-informe-pruebas-calidad.md` | Informe de pruebas actualizado con resultados reales | Cierre de cada sprint y consolidado en H5 |

---

## 2. Rutina fija de cada sprint

Repite este ciclo en **todos** los sprints:

1. **Sprint Planning (lunes, 2 h)**
   - Elegir historias del backlog que cumplan la Definition of Ready.
   - Redactar el Sprint Goal en una frase.
   - Crear `docs/scrum/sprint-XX/planning.md`.
2. **Daily Scrum (diario, 15 min, por Discord)**
   - Cada uno responde qué hizo, qué hará y qué lo bloquea.
   - Los bloqueos se registran como issue con etiqueta `impediment`.
3. **Refinement (miércoles de la semana 1, 1 h)**
   - Estimar las historias del siguiente sprint.
   - Modelar amenazas STRIDE de la épica que viene y actualizar `threat-model.md`.
4. **Desarrollo**
   - Una rama por historia: `feature/E1-01-registro-acudiente`.
   - Abrir un PR, conseguir revisión de un compañero y un pipeline verde, y hacer merge.
5. **Security Review (viernes, 30 min, antes de la review)**
   - El Security Champion revisa los hallazgos del pipeline y actualiza `risk-register.md`.
6. **Sprint Review (viernes, 1 h)**
   - Demo en un **Android físico**.
   - El PO acepta o rechaza cada historia.
   - Crear `review.md`.
7. **Retrospective (45 min después de la review)**
   - Definir 1–2 acciones de mejora con responsable.
   - Crear `retro.md`.
8. **Actualizar el Informe de Pruebas** con cobertura, hallazgos y bugs del sprint.

### Checklist de Definition of Done (copiar en cada PR)

```markdown
- [ ] Criterios de aceptación Gherkin verificados
- [ ] Probado en Android físico
- [ ] PR aprobado por al menos un compañero
- [ ] Cobertura unitaria ≥ 70 % en el módulo tocado
- [ ] ESLint + Prettier sin errores
- [ ] Sin TODO ni código comentado
- [ ] Semgrep sin High/Critical
- [ ] npm audit sin Critical explotables
- [ ] Gitleaks limpio
- [ ] Sin datos personales en logs
- [ ] Tablas/Edge Functions nuevas con RLS + rol + rate limiting
- [ ] README / CHANGELOG actualizados
- [ ] Tipos de Supabase regenerados si cambió el esquema
- [ ] Desplegado en staging por el pipeline
```

---

## 3. Fases del proyecto

### FASE H0 — Entrega de documentación (22 sep) ✅

- [x] 01 Documento de Requisitos
- [x] 02 Plan de Desarrollo
- [x] 03 Cronograma y Tareas
- [x] 04 Diseño Arquitectónico
- [x] 05 Informe de Pruebas (iteración 0)
- [ ] Corregir las inconsistencias de la sección 0 → v1.1
- [ ] Subir los PDF a `docs/entregables/`

---

### SPRINT 0 — 22 sep a 2 oct · 18 pts

**Sprint Goal:** la plataforma técnica y de seguridad está lista para producir código auditable.
**Hito H1 (2 oct):** todo PR ejecuta lint + test + SAST + SCA automáticamente.

**E0-01 · Monorepo, ramas protegidas y plantillas (3 pts)**
1. Crear el repo `nexasafe` en GitHub.
2. Mover el prototipo SanMateoApp a `apps/mobile/` conservando la estructura feature-based.
3. En Settings → Branches, proteger `main`: exigir PR, 1 aprobación y checks en verde.
4. Crear `pull_request_template.md` con el checklist de DoD y las 3 plantillas de issue.
5. Configurar GitHub Projects con las vistas *Backlog* y *Sprint actual* (To Do / In Progress / In Review / Done).
6. Cargar todas las historias como issues con etiquetas `epic:*`, `type:*` y `security`.

**E0-02 · Pipeline de CI (5 pts)**
1. Instalar ESLint, Prettier y Jest con React Native Testing Library en `apps/mobile`.
2. Escribir la primera prueba sobre el login del prototipo (`AuthenticateUser`), que es el caso piloto del Informe de Pruebas.
3. Crear `.github/workflows/ci.yml` con los pasos `npm ci` → `lint` → `test --coverage` → build.

**E0-03 · SAST, SCA y secretos (5 pts)**
1. Agregar `semgrep.yml` y el paso de Semgrep en el CI; activar CodeQL.
2. Agregar `npm audit --audit-level=critical` al CI y activar Dependabot.
3. Crear `.gitleaks.toml` y `.pre-commit-config.yaml` con Gitleaks; agregar Gitleaks al CI.
4. Configurar que un hallazgo High o Critical **bloquee el merge**.

**E0-04 · Ambientes dev y staging (5 pts)**
1. Crear 2 proyectos en Supabase: `nexasafe-dev` y `nexasafe-staging`.
2. Ejecutar `supabase init` y `supabase link` en el repo; crear la primera migración vacía.
3. Guardar las llaves en GitHub Secrets. **Nunca** en el código.
4. Hacer que el pipeline aplique las migraciones a staging al hacer merge en `main`.
5. Configurar EAS (`eas.json`) con los perfiles `development`, `preview` y `production`.

**Tareas del equipo completo**
- [ ] Crear `threat-model.md` con STRIDE inicial por épica.
- [ ] Crear `risk-register.md` con R1–R8.
- [ ] Crear `exceptions.md` (vacío).
- [ ] Nombrar al Security Champion de los Sprints 0–1.

**Entregables del sprint:** pipeline verde, repo organizado, `docs/scrum/sprint-00/{planning,review,retro}.md` e Informe de Pruebas actualizado con el estado de H1.

---

### SPRINT 1 — 6 a 17 oct · 24 pts

**Sprint Goal:** un acudiente puede registrarse, dar de alta a un menor y el colegio validarlo.
**Hito H2 (17 oct):** alta de usuario funcionando en un dispositivo real.

**Antes de programar**
- [ ] Crear `pia.md` y `politica-tratamiento.md`, porque este sprint ya toca datos de menores.
- [ ] Crear la migración con las tablas `colegios`, `guardianes`, `protegidos`, `audit_log` y `consentimientos`, **con RLS** en todas.

| Historia | Qué construir | Responsable | Pts |
|---|---|---|---|
| E1-01 | Pantalla de registro con Supabase Auth (correo + contraseña) | Móvil | 3 |
| E1-02 | Formulario de alta del menor → estado `PENDIENTE_VALIDACION` | Móvil + Backend | 5 |
| E1-03 | Vista del colegio para validar la matrícula → estado `ACTIVO` (solo el rol `institucion`) | Backend | 5 |
| E1-04 | Login del protegido con PIN (hash Argon2id) | Móvil | 3 |
| E1-05 | Sesión en `expo-secure-store` | Móvil | 3 |
| E11-01 | Pantalla de consentimiento + registro con fecha, versión y actor | Backend + Móvil | 5 |

**Prueba E2E del flujo 1 (Maestro):** registro → alta → validación → login con PIN.
**Al cerrar:** medir la cobertura real y **recalibrar la velocidad** con los puntos completados.

---

### SPRINT 2 — 20 a 31 oct · 26 pts

**Sprint Goal:** un guardián puede definir la ruta y seguir en vivo el trayecto del protegido.
**Hito H3 (31 oct):** trayecto acompañado con ubicación en vivo operando (ver la inconsistencia #2).

**Antes de programar**
- [ ] Activar la extensión **PostGIS** y migrar las tablas `rutas`, `trayectos` y `contactos_apoyo`.
- [ ] **Investigar el riesgo R1** (ubicación en segundo plano en Xiaomi y Huawei) durante la **primera semana**.

| Historia | Qué construir | Responsable | Pts |
|---|---|---|---|
| E3-01 | Dibujar la ruta sobre un mapa y guardarla como geometría PostGIS | Móvil | 8 |
| E3-02 | Slider de corredor en metros | Móvil + Backend | 3 |
| E3-03 | Duración esperada del trayecto | Móvil | 3 |
| E4-01 | Botón "Iniciar trayecto" (un toque) → estado `EN_CURSO` | Móvil | 5 |
| E4-04 | Indicador permanente de "acompañamiento activo" | Móvil | 2 |
| E2-01 | Invitación de contactos de apoyo por enlace | Backend | 5 |

**Revisión de alcance en H3:** si la velocidad real es baja, decidir qué SHOULD o COULD se sacrifican (riesgo R6).

---

### SPRINT 3 — 3 a 14 nov · 26 pts

**Sprint Goal:** el botón de pánico funciona de extremo a extremo con cancelación.

**Antes de programar**
- [ ] Migrar las tablas `alertas` y `eventos_incidente` (append-only: sin UPDATE ni DELETE en RLS).

| Historia | Qué construir | Responsable | Pts |
|---|---|---|---|
| E4-02 | Posición en vivo por Supabase Realtime hacia el guardián | Backend | 8 |
| E4-03 | Geocerca de llegada → cierre automático (`CERRADO`) | Backend | 5 |
| E6-01 | Botón de pánico: mantener presionado 3 s | Móvil | 5 |
| E6-03 | Ventana de 10 s para cancelar con PIN (criterio Gherkin de RF-22) | Móvil | 3 |
| E6-05 | Envío de ubicación cada 5–10 s durante la alerta | Backend | 5 |

**Pruebas E2E:** flujo 2 (trayecto → llegada → cierre) y flujo 4 (pánico → cancelación con PIN).
**Rate limiting** obligatorio en el endpoint de alerta.

---

### SPRINT 4 — 17 a 28 nov · 27 pts (ver la inconsistencia #1: suma 32)

**Sprint Goal:** el puesto de control atiende alertas desde la app y deja bitácora del incidente.
**Hito H4 (14 nov):** flujo completo alerta → notificación → respuesta → cierre.
**Hito H5 (25 nov):** release candidate firmado, sin hallazgos High o Critical.

| Historia | Qué construir | Responsable | Pts |
|---|---|---|---|
| E6-04 | Modo discreto (pantalla sin indicios de alerta) | Móvil | 5 |
| E7-01 | Edge Function `notify-push` con sonido prioritario | Backend | 5 |
| E7-02 | Botón "voy en camino" | Móvil | 3 |
| E8-01 | Vista institucional con mapa de alertas activas | Móvil + Backend | 8 |
| E9-01 | Bitácora con timestamp de servidor inmutable | Backend | 5 |
| E9-02 | Cierre clasificado de la alerta | Móvil | 3 |
| E11-04 | No enviar ubicación fuera de un trayecto o alerta activos | Backend | 3 |

**Prueba E2E del flujo 5:** pánico → alerta → recepción → "voy en camino" → cierre clasificado.

**Nota de fechas:** H4 (14 nov) cae al final del Sprint 3, pero sus historias están en el Sprint 4. Ajusta H4 al 24 nov o adelanta E7-01 y E7-02.

---

### CIERRE — 24 a 28 nov

| Entregable | Responsable | Cómo |
|---|---|---|
| Release candidate firmado | DevSecOps/QA | `eas build --profile production` + tag `v1.0.0-rc` |
| SBOM + reporte consolidado de seguridad | Security Champion | Syft para el SBOM; MobSF sobre el APK; resumen de hallazgos |
| Informe de Pruebas final | DevSecOps/QA | Actualizar el doc 05 con resultados reales de todos los sprints |
| Manual de usuario e instalación | Equipo | `docs/manual/`, con capturas de cada rol |
| Video demostrativo (5–7 min) | Equipo | Mostrar los flujos 1, 2, 4 y 5 en un celular real |
| Informe final y sustentación (H6 · 28 nov) | Equipo | Demo en vivo + repositorio + documentos v final |

**Checklist final antes de la sustentación**
- [ ] `main` con pipeline verde
- [ ] 0 hallazgos Critical o High abiertos
- [ ] APK firmado instalado en al menos 2 celulares
- [ ] Todos los `planning`, `review` y `retro` de los sprints en `docs/scrum/`
- [ ] Informe de Pruebas actualizado
- [ ] README con instrucciones para correr el proyecto desde cero
- [ ] Video subido y enlazado en el README

---

## 4. Trabajo futuro (fuera del semestre)

Se deja documentado y no se construye:

- **E5:** detección automática de desvío (CU-03, flujo E2E 3).
- **E10:** resiliencia offline completa.
- **Historias sueltas:** E2-02, E2-03, E6-02, E6-06, E8-02, E8-03, E9-03, E11-02 y E11-03.
- **"Sprint 6":** pentest interno y prueba de campo de 1 km.

---

## 5. Plantillas rápidas

### `docs/scrum/sprint-XX/planning.md`
```markdown
# Sprint XX — Planning
**Fechas:** dd/mm – dd/mm
**Sprint Goal:** ...
**Capacidad:** XX pts · **Security Champion:** ...

| Historia | Responsable | Pts |
|---|---|---|
|  |  |  |

**Riesgos del sprint:** ...
```

### `docs/scrum/sprint-XX/review.md`
```markdown
# Sprint XX — Review
**Fecha:** ...
**Sprint Goal cumplido:** Sí / No / Parcial

| Historia | Estado (Aceptada/Rechazada) | Feedback del PO |
|---|---|---|

**Estado de seguridad (3 min):** hallazgos abiertos, cerrados y excepciones.
**Velocidad:** XX pts completados de XX comprometidos.
```

### `docs/scrum/sprint-XX/retro.md`
```markdown
# Sprint XX — Retrospectiva
**Qué salió bien:**
**Qué mejorar:**
**Acciones:**
| Acción | Responsable | Para cuándo |
|---|---|---|
```

---

## 6. Instrucciones para el agente de IA (registro automático de sprints)

> Copia esta sección en un archivo `AGENTS.md` (o `CLAUDE.md` si usan Claude Code) en la raíz del repo. Así la IA la lee siempre antes de trabajar.

### 6.1 Regla principal

La IA **genera y actualiza** los documentos de registro, pero **solo con datos reales** del repositorio y de lo que el equipo le informe. Nunca inventa feedback del PO, velocidades, resultados de pruebas ni hallazgos. Si le falta un dato, deja `PENDIENTE: <qué falta>` y pregunta al equipo.

### 6.2 Fuentes de datos que debe consultar

| Dato | Comando o fuente |
|---|---|
| Historias del sprint y su estado | `gh issue list --label "sprint:XX" --state all` |
| PRs fusionados en el sprint | `gh pr list --state merged --search "merged:AAAA-MM-DD..AAAA-MM-DD"` |
| Commits del sprint | `git log --since="AAAA-MM-DD" --until="AAAA-MM-DD" --oneline` |
| Resultado del pipeline | `gh run list --branch main --limit 20` |
| Cobertura de pruebas | `npm test -- --coverage` (salida de `coverage/coverage-summary.json`) |
| Hallazgos de seguridad | Salidas de Semgrep, npm audit y Gitleaks del último run |
| Feedback del PO, acuerdos de la retro | **Lo informa el equipo**; la IA no lo supone |

**Convención obligatoria:** cada issue de historia lleva la etiqueta `sprint:XX` (por ejemplo `sprint:01`) para que la IA pueda filtrarla.

### 6.3 Qué debe generar la IA en cada momento del sprint

| Momento | Orden que le das a la IA | Archivos que crea o actualiza |
|---|---|---|
| **Inicio (Planning)** | "Inicia el sprint XX" | Crea `docs/scrum/sprint-XX/planning.md` · asigna la etiqueta `sprint:XX` a las historias · crea el tag de inicio en el tablero |
| **Refinement** | "Refinement del sprint XX, épica EY" | Actualiza `docs/security/threat-model.md` con STRIDE de la épica · marca las historias listas (DoR) |
| **Cada PR** | "Revisa el PR #N contra la DoD" | Comenta en el PR el checklist de DoD marcado · agrega la entrada en `CHANGELOG.md` |
| **Security Review** | "Security Review del sprint XX" | Actualiza `docs/security/risk-register.md` · registra excepciones en `exceptions.md` si las hay · crea issues `security` para hallazgos Medium/Low |
| **Sprint Review** | "Cierra la review del sprint XX" + feedback del PO | Crea `docs/scrum/sprint-XX/review.md` con velocidad real y estado de cada historia |
| **Retrospectiva** | "Retro del sprint XX" + lo que dijo el equipo | Crea `docs/scrum/sprint-XX/retro.md` |
| **Cierre del sprint** | "Cierra el sprint XX" | Actualiza la sección del sprint en el Informe de Pruebas · crea el tag `v0.X.0-sprintXX` · genera `docs/scrum/sprint-XX/resumen.md` |
| **Cierre del proyecto** | "Genera el cierre del proyecto" | Informe de Pruebas consolidado (H5) · `docs/scrum/resumen-proyecto.md` con la velocidad de todos los sprints |

### 6.4 Registro completo por sprint (lo que debe quedar al final)

```
docs/scrum/sprint-XX/
├── planning.md
├── review.md
├── retro.md
└── resumen.md        # 1 página: goal, velocidad, historias, hallazgos, acciones
```

Y además, actualizados: `CHANGELOG.md`, `risk-register.md`, `threat-model.md`, `exceptions.md` (si aplica) y la sección del sprint en el Informe de Pruebas.

### 6.5 Plantillas adicionales

#### `docs/scrum/sprint-XX/resumen.md`
```markdown
# Sprint XX — Resumen
**Fechas:** dd/mm – dd/mm · **Sprint Goal:** ... · **Cumplido:** Sí / No / Parcial

| Métrica | Valor |
|---|---|
| Puntos comprometidos | |
| Puntos completados (velocidad) | |
| Trabajo no planificado | % |
| Cobertura unitaria | % |
| Hallazgos Critical/High abiertos | |
| Bugs abiertos / cerrados | / |
| Runs del pipeline (verde / rojo) | / |

**Historias completadas:** ...
**Historias que pasan al siguiente sprint:** ...
**Acciones de la retro:** ...
```

#### `docs/security/risk-register.md`
```markdown
# Registro de riesgos — NexaSafe
Última actualización: Sprint XX (dd/mm/aaaa)

| ID | Riesgo | Prob. | Impacto | Respuesta | Estado | Responsable | Última revisión |
|---|---|---|---|---|---|---|---|
| R1 | Ubicación en 2º plano detenida por batería | Alta | Alto | Foreground service + guía | Abierto | | Sprint XX |
| R2 | Falsas alarmas | Media | Alto | Corredor configurable + PIN | Abierto | | |
| R3 | Colegio sin responsable del puesto | Media | Alto | Flujo solo con red de apoyo | Abierto | | |
| R4 | Fuga de datos de menores | Baja | Crítico | Cifrado, RLS, auditoría | Abierto | | |
| R5 | WhatsApp limitado a 5 destinatarios | Alta | Medio | Push como canal principal | Mitigado | | |
| R6 | Alcance excesivo | Alta | Alto | MoSCoW + revisión en H3 | Abierto | | |
| R7 | Baja disponibilidad de un integrante | Media | Medio | Propiedad colectiva | Abierto | | |
| R8 | Falsos positivos por sacudida | Alta | Medio | Umbral + PIN | Abierto | | |

## Historial de cambios
| Sprint | Cambio |
|---|---|
```

#### `docs/security/threat-model.md`
```markdown
# Modelo de amenazas (STRIDE) — NexaSafe

## Épica EX — Nombre
| Categoría | Amenaza | Componente | Control | Estado |
|---|---|---|---|---|
| Spoofing | | | | |
| Tampering | | | | |
| Repudiation | | | | |
| Information disclosure | | | | |
| Denial of service | | | | |
| Elevation of privilege | | | | |
```

#### `docs/security/exceptions.md`
```markdown
# Excepciones de seguridad
> No hay excepciones permanentes. Toda excepción vence.

| ID | Hallazgo | Severidad | Justificación | Responsable | Fecha de vencimiento | Estado |
|---|---|---|---|---|---|---|
```

#### Entrada de `CHANGELOG.md`
```markdown
## [0.X.0] — Sprint XX — dd/mm/aaaa
### Agregado
- E1-01 Registro de acudiente con correo y contraseña (#PR)
### Corregido
- ...
### Seguridad
- ...
```

#### Sección por sprint del Informe de Pruebas
```markdown
## Resultados Sprint XX (dd/mm/aaaa)
| Elemento | Resultado |
|---|---|
| Cobertura unitaria | % |
| Pruebas de integración | pasan / total |
| Flujos E2E ejecutados | |
| SAST (Semgrep/CodeQL) | Critical: · High: · Medium: · Low: |
| SCA (npm audit) | |
| Secretos (Gitleaks) | |
| Bugs abiertos / cerrados | |

**Defectos relevantes:** ...
**Acciones para el siguiente sprint:** ...
```

### 6.6 Ejemplo de uso con la IA

1. Lunes: *"Inicia el sprint 01. Historias: E1-01 a E1-05 y E11-01. Security Champion: Juan Felipe."*
2. Durante el sprint: *"Revisa el PR #12 contra la DoD."*
3. Viernes: *"Security Review del sprint 01."* → luego *"Cierra la review del sprint 01. El PO aceptó todo menos E1-03, pidió que el colegio vea la foto del menor."* → luego *"Retro del sprint 01: bien la comunicación; mejorar estimación; acción: dividir historias de 8 pts, responsable Integrante 2."*
4. *"Cierra el sprint 01."*
