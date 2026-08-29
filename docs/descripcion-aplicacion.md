# SanMateoApp - Descripción técnica del estado actual

## 1. ¿Qué es esta aplicación?

SanMateoApp es una aplicación móvil construida con React Native y Expo, cuyo objetivo principal por ahora es demostrar un flujo básico de autenticación y una estructura modular de proyecto para continuar desarrollando funcionalidades de catálogo o módulos académicos.

En su estado actual, la app tiene estas capacidades principales:

- Pantalla de bienvenida o splash inicial.
- Pantalla de login con correo y contraseña.
- Validación de credenciales usando datos locales.
- Cambio de estado cuando el usuario inicia sesión correctamente.
- Vista principal simple que muestra un mensaje de bienvenida.

No es todavía una app completa de negocio; se encuentra en una etapa inicial y con una base arquitectónica preparada para crecer.

---

## 2. Stack tecnológico actual

La aplicación está construida con las siguientes tecnologías:

### Frontend móvil
- React Native
- Expo
- TypeScript

### Librerías principales
- expo
- react
- react-native
- expo-splash-screen
- expo-status-bar

### Configuración general
- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript 5.x
- Soporte para web mediante react-native-web

### Herramientas de ejecución
- scripts de Expo para Android, iOS y web:
  - npm start
  - npm run android
  - npm run ios
  - npm run web

---

## 3. Arquitectura y estructura del proyecto

El proyecto sigue una organización orientada por features, con una separación clara entre capas lógicas:

```text
SanMateoApp/
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
├── assets/
├── src/
│   ├── app/
│   │   └── AppContent.tsx
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── local/
│   │   │   │   │   └── users.json
│   │   │   │   └── repositories/
│   │   │   │       └── LocalAuthRepository.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── User.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   └── AuthRepository.ts
│   │   │   │   └── useCases/
│   │   │   │       └── AuthenticateUser.ts
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   └── AuthScreen.tsx
│   │   │       └── viewModels/
│   │   │           └── useAuthViewModel.ts
│   │   ├── splash/
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   └── SplashScreen.tsx
│   │   │       └── viewModels/
│   │   │           └── useSplashViewModel.ts
│   │   └── catalog/
│   │       └── ...
│   └── shared/
```

### Patrón observado
La estructura sugiere una aproximación a Clean Architecture / MVVM:

- domain: entidades y contratos del negocio.
- data: acceso a datos y repositorios concretos.
- presentation: pantallas y viewModels.
- app: composición de la aplicación y navegación básica.

---

## 4. Flujo de la aplicación actual

### Inicio
Cuando la app se ejecuta, el componente principal en `App.tsx` carga `AppContent`.

### Splash
`AppContent` inicia con un estado `isSplashVisible = true`.

- Muestra `SplashScreen`.
- Cuando termina, se ejecuta `handleSplashFinish`.
- El splash desaparece y la app entra al flujo de autenticación.

### Login
Si el usuario no está autenticado, se renderiza `AuthScreen`.

En la pantalla se muestran:
- campo de correo
- campo de contraseña
- botón de ingreso
- mensajes de error si la información no es válida

### Validación
El flujo usa:

- `useAuthViewModel` para manejar estados y eventos
- `AuthenticateUser` como caso de uso del dominio
- `LocalAuthRepository` para consultar usuarios locales

El repositorio valida si existe un usuario con:
- correo coincidente
- contraseña coincidente
- usuario activo (`isActive !== false`)

Si coincide, devuelve un usuario seguro sin incluir la contraseña.

### Estado autenticado
Cuando el login tiene éxito:
- se guarda el usuario en `loggedUser`
- la app deja de mostrar el login
- muestra un mensaje de bienvenida con el nombre del usuario

---

## 5. Autenticación actual: cómo funciona

El punto principal está en `LocalAuthRepository.ts`.

### Repositorio local
Importa un JSON local:

- `src/features/auth/data/local/users.json`

Este archivo contiene usuarios simulados para pruebas.

### Lógica principal
La validación compara:

- el email ingresado, convertido a minúsculas y sin espacios
- la contraseña ingresada
- el usuario identificado como activo

Código conceptual:

```ts
const user = users.find((item) => {
  return (
    item.isActive !== false &&
    item.email.trim().toLowerCase() === normalizedEmail &&
    item.password === password.trim()
  );
});
```

Si encuentra coincidencia, retorna el usuario sin la contraseña.

---

## 6. Datos de usuarios que existen actualmente

El archivo `users.json` contiene dos usuarios de prueba:

1. Usuario 1
   - Nombre: `admin`
   - Email: `admin`
   - Contraseña: `admin`
   - Rol: `student`
   - Estado: activo

2. Usuario 2
   - Nombre: `Carlos Salas`
   - Email: `casalass@sanmateo.edu.co`
   - Contraseña: `abc123`
   - Rol: `student`
   - Estado: activo

### Nota importante
Actualmente hay una inconsistencia en los datos:
- el primer usuario del JSON tiene email `admin`, pero la pantalla de ayuda mostraba anteriormente `ana@ejemplo.com`.

Esto es un detalle relevante para ingeniería, porque puede generar confusión en el login si los usuarios se usan como datos de prueba y la interfaz no refleja exactamente lo que está en el JSON.

---

## 7. Componentes principales del flujo

### `App.tsx`
Es el punto de entrada principal de la aplicación. Monta `AppContent` y `StatusBar`.

### `AppContent.tsx`
Controla el estado global de la sesión:
- splash visible o no
- usuario autenticado o no

### `AuthScreen.tsx`
Muestra la pantalla de login. Requiere:
- correo
- contraseña
- feedback visual de error

### `useAuthViewModel.ts`
Encapsula la lógica del formulario y del login.

### `AuthenticateUser.ts`
Representa el caso de uso del negocio. Permite abstraer la lógica de autenticación del repositorio concreto.

### `LocalAuthRepository.ts`
Implementa la autenticaición usando datos locales, sin backend ni base de datos.

---

## 8. Fortalezas actuales de la app

- Arquitectura organizada por features.
- Separación de responsabilidades por capas.
- Uso de TypeScript para reducir errores.
- Configuración moderna con Expo.
- Base lista para continuar con más pantallas y módulos.
- Facilidad para pruebas de UI y lógica de autenticación.

---

## 9. Limitaciones actuales

- No hay backend real ni API.
- La autenticación es local y simulada.
- Los datos de usuarios están hardcodeados en JSON.
- No existe persistencia real entre sesiones.
- La app todavía no implementa navegación compleja ni un catálogo funcional real.
- Hay un detalle de inconsistencia en algunos datos de prueba que debe normalizarse.

---

## 10. Estado mental del proyecto

La aplicación en este momento se encuentra en una etapa de:

- prototipo funcional
- demostración de arquitectura
- validación de flujo de autenticación
- preparación para ampliar módulos de negocio

Es una base sólida para continuar construyendo un sistema más completo, pero aún no representa una solución productiva final.

---

## 11. Conclusión

SanMateoApp es una aplicación móvil inicial, desarrollada con Expo y React Native, con una estructura modular orientada a features y una capa de autenticación local basada en JSON.

Su propósito actual es demostrar cómo se organiza un proyecto, cómo se valida login, y cómo se puede avanzar hacia una app más completa con arquitectura limpia.

Para un ingeniero de sistemas, esta app es un buen ejemplo de:
- front-end móvil moderno
- separación por capas
- manejo de estados y formularios
- validación local de autenticación
- base para evolución hacia backend, persistencia y módulos del negocio
