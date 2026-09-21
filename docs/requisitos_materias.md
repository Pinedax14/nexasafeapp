# NexaSafe — Requisitos del proyecto integrador por materia

**Programa:** Ingeniería de Sistemas — Fundación Universitaria San Mateo
**Periodo:** 2026-2
**Materias:** Programación para Dispositivos Móviles · Ingeniería de Software I

---

## 1. Programación para Dispositivos Móviles

### 1.1 Aportes de la asignatura

| # | Aporte | Descripción |
|---|---|---|
| 1 | **Desarrollo de la interfaz de usuario (UI)** | Implementación de una interfaz intuitiva y adaptable para dispositivos móviles, siguiendo principios de UX/UI y diseño responsivo. |
| 2 | **Consumo de APIs y gestión de datos** | Integración de APIs para obtener datos en tiempo real y uso de bases de datos locales o en la nube para almacenamiento y procesamiento. |
| 3 | **Implementación de gráficos interactivos** | Uso de librerías como MPAndroidChart (Android), Charts (iOS) o Recharts/D3.js (React Native) para visualizar los datos de manera dinámica. |
| 4 | **Optimización del rendimiento** | Aplicación de buenas prácticas en desarrollo móvil para mejorar la eficiencia, como el uso de almacenamiento en caché y la optimización de consultas de datos. |
| 5 | **Seguridad y manejo de usuarios** | Implementación de autenticación, control de acceso y encriptación de datos para garantizar la seguridad de la aplicación. |

### 1.2 Entregables y lo que evalúa el docente

| # | Entregable | Qué se evalúa |
|---|---|---|
| 1 | **Prototipo de la interfaz (wireframes y mockups)** | Diseño preliminar de la aplicación con herramientas como Figma o Adobe XD. |
| 2 | **Código fuente de la aplicación** | Repositorio con el código documentado, incluyendo la implementación de la UI, consumo de datos y funcionalidades principales. |
| 3 | **Pruebas funcionales y de usabilidad** | Informe con pruebas realizadas en diferentes dispositivos, identificación de errores y mejoras propuestas. |
| 4 | **Demostración funcional del MVP** | Presentación de una versión mínima viable con las características básicas implementadas y funcionando. |
| 5 | **Documentación técnica** | Manual de usuario, documentación de código y guía de instalación para facilitar futuras mejoras y mantenimiento. |

---

## 2. Ingeniería de Software I

### 2.1 Aportes de la asignatura

| # | Aporte | Descripción |
|---|---|---|
| 1 | **Definición de los requisitos del sistema** | Identificación y especificación de los requisitos funcionales y no funcionales de la aplicación, asegurando que cubra las necesidades del usuario para visualizar datos. |
| 2 | **Modelo de ciclo de vida del software** | Selección de un modelo adecuado para el desarrollo del software, como el modelo ágil, para un enfoque flexible y evolutivo. |
| 3 | **Planificación del proyecto y gestión del tiempo** | Establecimiento de cronogramas, recursos y tareas necesarias para completar el desarrollo de la aplicación. |
| 4 | **Diseño de la arquitectura del software** | Diseño de la estructura del sistema, incluyendo la definición de las capas y módulos de la aplicación. |
| 5 | **Gestión de la calidad del software** | Implementación de procedimientos para garantizar que la aplicación esté libre de errores y cumpla con los estándares de calidad. |

### 2.2 Entregables y lo que evalúa el docente

> **Fecha de entrega:** martes 22 de septiembre de 2026.

| # | Entregable | Qué se evalúa |
|---|---|---|
| 1 | **Documento de requisitos del sistema** | Documento detallado que describe los requisitos funcionales y no funcionales de la aplicación, basado en el análisis de las necesidades de los usuarios. |
| 2 | **Plan de desarrollo de software** | Cronograma y recursos planificados para el desarrollo, implementando un modelo de ciclo de vida adecuado (como ágil o iterativo). |
| 3 | **Cronograma y tareas del proyecto** | Un cronograma detallado que incluya las fechas y tareas principales que deben completarse, asignando recursos a cada fase. |
| 4 | **Documento de diseño arquitectónico** | Descripción de la arquitectura del software que incluye la estructura de la aplicación, el flujo de datos y la interacción entre los diferentes módulos. |
| 5 | **Informe de pruebas de calidad y control de errores** | Resultados de las pruebas realizadas, y la verificación de que la aplicación funciona según lo esperado y sin errores críticos. |

---

## 3. Matriz de cobertura de NexaSafe

Estado: ✅ cubierto · ⚠️ parcial o pendiente de ajuste · ❌ no cubierto

### 3.1 Programación para Dispositivos Móviles

| Aporte | Cómo lo cubre NexaSafe | Estado |
|---|---|---|
| UI/UX responsiva | App única con vistas por rol: usuario, red de apoyo y colegio | ✅ |
| APIs y datos en tiempo real / nube | Supabase (Postgres + Realtime), Expo Push, WhatsApp Cloud API | ✅ |
| Gráficos interactivos | Estadísticas del colegio: alertas por franja horaria, tiempo de respuesta, tipo de cierre, mapa de calor. Librería: `react-native-gifted-charts` (Recharts no corre en React Native) | ❌ falta en el plan |
| Rendimiento: caché y consultas | Caché local de contactos, ruta e incidentes con `expo-sqlite` | ⚠️ falta en el plan |
| Seguridad y usuarios | Supabase Auth, control de acceso con RLS, `expo-secure-store` para token y PIN | ✅ |

### 3.2 Ingeniería de Software I

| Entregable | Base disponible | Estado |
|---|---|---|
| Documento de requisitos | Decisiones de diseño tomadas + backlog de historias en `PLAN_NEXASAFE.md` | ⚠️ por redactar |
| Plan de desarrollo | Secciones 4–6 y 9 de `PLAN_NEXASAFE.md` (Scrum + DevSecOps) | ⚠️ por extraer |
| Cronograma y tareas | Sección 8 de `PLAN_NEXASAFE.md` (sprints e hitos) | ⚠️ falta asignar responsables |
| Diseño arquitectónico | Sección 3 de `PLAN_NEXASAFE.md` | ⚠️ faltan flujo de datos y modelo de datos |
| Informe de pruebas | Sección 13 de `PLAN_NEXASAFE.md` (estrategia) | ❌ no hay app que probar; se entrega como iteración 0 |