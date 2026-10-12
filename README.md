# NexaSafe

Aplicación móvil de alerta y acompañamiento en la ruta casa–colegio para niñas, niños y mujeres de la comunidad educativa. Proyecto integrador de Ingeniería de Software I y Programación para Dispositivos Móviles — Fundación Universitaria San Mateo, 2026-2.

**Equipo:** Juan Felipe Pineda Cardona · David Alejandro del Prado Camargo · Ingrith Yuliana García Galvis

- Móvil: Expo SDK 54 + React Native + TypeScript (`apps/mobile/`)
- Backend: Supabase (PostgreSQL + PostGIS, Auth, Realtime, Edge Functions) (`supabase/`)
- Proceso: Scrum + DevSecOps, sprints de 2 semanas

## Documentación

| Documento | Ubicación |
|---|---|
| Entregables oficiales v1.1 (requisitos, plan, cronograma, diseño, pruebas) | [`docs/entregables/ing-software-1/`](docs/entregables/ing-software-1/) |
| Versión interactiva de los 5 entregables | [`documentacion-interactiva.html`](docs/entregables/ing-software-1/documentacion-interactiva.html) |
| Plan del proyecto (documento base) | [`docs/PLAN_NEXASAFE.md`](docs/PLAN_NEXASAFE.md) |
| Guía paso a paso por sprint | [`docs/GUIA_PROYECTO_NEXASAFE.md`](docs/GUIA_PROYECTO_NEXASAFE.md) |
| Registro de sprints | [`docs/scrum/`](docs/scrum/) |
| Seguridad (amenazas, riesgos, excepciones) | [`docs/security/`](docs/security/) |
| Cambios por versión | [`CHANGELOG.md`](CHANGELOG.md) |

## Estructura

```
nexasafeapp/
├── .github/        # CI, plantillas de PR e issues
├── apps/mobile/    # App Expo (src/core + src/features/<feature>/{data,domain,presentation})
├── supabase/       # migraciones, Edge Functions y políticas RLS
└── docs/           # entregables, scrum, seguridad, privacidad
```

## Cómo correr la app

### 1. Instalar Node.js (solo la primera vez)

```powershell
winget install OpenJS.NodeJS.LTS
```

Cierra y vuelve a abrir VS Code. Comprueba la instalación:

```powershell
node -v
npm -v
```

Si PowerShell dice que *la ejecución de scripts está deshabilitada*, ejecuta una vez:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 2. Instalar dependencias

```powershell
cd apps/mobile
npm install
```

### 3. Configurar la conexión con Supabase (solo la primera vez)

Copia `apps/mobile/.env.example` como `apps/mobile/.env` y completa la URL y la llave **Publishable** de `nexasafe-dev` (Supabase → Project Settings → API Keys). El archivo `.env` no se sube a GitHub.

```powershell
cd apps/mobile
copy .env.example .env
```

### 4. Arrancar la app

```powershell
npm start
```

Escanea el QR con **Expo Go** (celular en la misma red Wi-Fi) o presiona `w` para abrirla en el navegador. Si el celular no conecta, usa `npm start -- --tunnel`.

La sesión queda guardada cifrada en el teléfono (`expo-secure-store`): al volver a abrir la app no hace falta iniciar sesión. En el navegador (`w`) la sesión no se guarda.

`npm start` fuerza el modo Expo Go. Cuando el equipo instale un *development build* (perfil `development` de EAS), usa `npm run start:dev-client`.

## Calidad: lint, pruebas y build

Desde `apps/mobile`. Son los mismos pasos que ejecuta el CI en cada PR ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

| Comando | Qué hace |
|---|---|
| `npm run lint` | ESLint (`eslint-config-expo` + Prettier) |
| `npm run format:check` | Verifica el formato con Prettier (`npx prettier --write .` lo corrige) |
| `npm run typecheck` | TypeScript sin emitir archivos |
| `npm test` | Pruebas unitarias con Jest + React Native Testing Library |
| `npm run test:coverage` | Pruebas con cobertura; falla si `domain` + `data` bajan del 70 % |
| `npm run build` | `expo export` para Android |
| `npm run audit:gate` | `npm audit`: falla ante High/Critical sin excepción vigente en [`docs/security/exceptions.md`](docs/security/exceptions.md) |
| `npm run map:leaflet` | Copia Leaflet de `node_modules` a `leafletBundle.generated.ts` (mapa sin CDN, D9). Hay que correrlo después de actualizar `leaflet`; una prueba falla si la copia no coincide |

El mapa de las rutas (E3-01a) usa OpenStreetMap dentro de un WebView y **no funciona en el navegador**: se prueba en Android (APK de EAS o Expo Go).

### Controles de seguridad del pipeline

Cada PR ejecuta, además, estos controles bloqueantes:

| Control | Herramienta | Configuración |
|---|---|---|
| Secretos | Gitleaks | [`.gitleaks.toml`](.gitleaks.toml) |
| SAST | Semgrep (bloquea `ERROR` = High) + CodeQL | [`semgrep.yml`](semgrep.yml), [`codeql.yml`](.github/workflows/codeql.yml) |
| SCA | `npm audit --audit-level=high` + Dependabot | [`audit-allowlist.json`](docs/security/audit-allowlist.json), [`dependabot.yml`](.github/dependabot.yml) |

Para revisar secretos antes de cada commit en tu equipo: `pip install pre-commit` y luego `pre-commit install` (usa [`.pre-commit-config.yaml`](.pre-commit-config.yaml)).

## Compilar el APK (EAS)

1. Crear una cuenta en https://expo.dev/signup.
2. Instalar EAS CLI y comprobarlo:
   ```powershell
   npm install -g eas-cli
   eas --version
   ```
3. Iniciar sesión: `eas login`
4. Compilar desde `apps/mobile`:
   ```powershell
   cd apps/mobile
   eas build -p android --profile preview
   ```

| Perfil | Para qué | Resultado |
|---|---|---|
| `development` | Desarrollo con `expo-dev-client` (necesario para ubicación en segundo plano) | APK interno |
| `preview` | Probar el incremento en celulares del equipo | APK interno |
| `production` | Release candidate firmado (`v1.0.0-rc`) | APK firmado |

## Backend (Supabase)

| Ambiente | Proyecto | Cómo se actualiza |
|---|---|---|
| dev | `nexasafe-dev` | Manual, desde cada equipo (`npx supabase db push`) |
| staging | `nexasafe-staging` | Automático en cada merge a `main` ([`deploy-staging.yml`](.github/workflows/deploy-staging.yml)) |

- Migraciones versionadas en [`supabase/migrations/`](supabase/migrations/); políticas RLS documentadas en [`supabase/policies/`](supabase/policies/).
- Crear una migración: `npx supabase migration new <nombre>` (desde la raíz del repo).
- Aplicarla en dev: `npx supabase db push` (pide la contraseña de dev).
- Regenerar los tipos de la app después de cambiar el esquema (DoD): `npx supabase gen types typescript --linked --schema public > apps/mobile/src/core/api/database.types.ts` y luego `npx prettier --write` sobre ese archivo.
- Pruebas de políticas RLS: `supabase/tests/database/`; se ejecutan en el CI sobre una base efímera.
- Las llaves **nunca** van en el código. El pipeline usa los secretos `SUPABASE_ACCESS_TOKEN`, `SUPABASE_STAGING_PROJECT_REF` y `SUPABASE_STAGING_DB_PASSWORD` del ambiente `staging` de GitHub.

### Edge Functions

Viven en [`supabase/functions/`](supabase/functions/) (Deno). El CI ejecuta lint, verificación de tipos y pruebas en cada PR, y `deploy-staging.yml` las despliega a staging al hacer merge en `main`.

| Comando (desde `supabase/functions`) | Qué hace |
|---|---|
| `npx deno test` | Pruebas de las funciones |
| `npx deno lint` | Lint |

| Función | Para qué |
|---|---|
| `admin-personal` | El administrador crea y activa personal institucional (E1-06) |
| `auth-pin` | El acudiente asigna el PIN del menor y el menor entra con documento + PIN (E1-04) |

Desplegar una función en dev (desde la raíz): `npx supabase functions deploy <nombre> --use-api`.

### Crear el primer administrador (una sola vez por ambiente)

El rol `admin` no se puede obtener desde la app. Para crear el primero:

1. Supabase → **Authentication → Users → Add user → Create new user**: correo, contraseña de al menos 8 caracteres y **Auto Confirm User** activado.
2. Supabase → **SQL Editor**, reemplazando el correo:
   ```sql
   update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"rol": "admin"}'
   where email = 'admin@ejemplo.com';
   delete from public.guardianes where email = 'admin@ejemplo.com';
   ```
3. Inicia sesión en la app con esa cuenta: verás la pantalla de **Administración**.

El trigger de registro convierte toda cuenta nueva en guardián; el paso 2 la cambia a administrador y borra su fila de `guardianes`. Es la única operación de datos que se hace a mano.

## Cómo contribuir (GitHub Flow)

`main` está protegida: nada entra sin PR aprobado y pipeline verde. **No se hace push directo a `main`.**

```powershell
git checkout main
git pull
git checkout -b feature/E1-01-registro-acudiente   # una rama por historia
# ...cambios...
git status
git add <archivos>
git commit -m "feat(auth): registro de acudiente con correo y contraseña"
git push -u origin feature/E1-01-registro-acudiente
```

Luego abre el Pull Request en GitHub, completa el checklist de la Definition of Done y pide revisión a un compañero.
