# Pulso

Aplicación personal de seguimiento de fuerza, en español y diseñada primero para iPhone. Registra cada serie, recupera sesiones activas, alterna Día 1 / Día 2 al finalizar y permite consultar el historial exacto y la evolución por ejercicio.

## Stack

Next.js 16 (App Router), React 19, TypeScript estricto, Tailwind CSS 4, Supabase Auth/PostgreSQL/RLS, Zod, Recharts y Vitest. Versiones exactas en `package.json` y `package-lock.json`. Node.js 22 o superior; validado con Node.js 24.

`npm run build` utiliza el compilador Webpack soportado por Next.js. Turbopack en producción intentaba abrir un proceso/puerto bloqueado por el entorno de ejecución usado para construir este proyecto. El desarrollo conserva Turbopack.

## Arquitectura

```text
src/
  app/                 Rutas y carga de datos en Server Components
    (private)/         Hoy, historial, detalle de sesión, progreso y ejercicio
    login/             Acceso privado, sin registro público
  components/          Navegación, temporizador y estados reutilizables
  config/routine.ts    Rutina tipada y versionada
  features/
    auth/              Validación de identidad y acciones de acceso
    workout/           Repositorio Supabase, acciones, validación y UI
    history/           Resumen de sesión
    progress/          Modelo de métricas, selector y gráficas
  hooks/               Sesión activa y temporizador persistente
  lib/supabase/        Clientes SSR/browser y variables de entorno
  types/               Dominio y contrato tipado de la base de datos
  utils/               Secuencia, métricas, fechas y timer
supabase/
  migrations/          Esquema, índices, RLS, triggers y RPC transaccionales
  config.toml          Configuración local, con signup deshabilitado
tests/                Tests unitarios y de PostgreSQL/RLS
```

Los componentes interactivos llaman Server Actions. Las acciones validan la identidad y los inputs antes de usar el repositorio. El proxy refresca cookies y comprueba los claims; las páginas y acciones vuelven a validar al usuario. No se confía en `getSession()` para autorizar.

La creación de sesión y sus series es atómica. Un índice único parcial impide más de una sesión activa por usuario. Las funciones de inicio/finalización usan bloqueos para resolver solicitudes concurrentes; reintentar inicio o finalización es idempotente. Las escrituras de series bloquean la sesión y se rechazan una vez completada.

Cada sesión conserva `routine_version` y `routine_snapshot`. El historial usa esa copia, por lo que modificar la rutina no reescribe sesiones pasadas o en curso. Se guardan los ejercicios en código; la copia JSON es únicamente un registro histórico.

RLS aísla ambas tablas por `auth.uid()`. Una FK compuesta impide adjuntar series al entrenamiento de otro usuario. Todas las funciones son `SECURITY INVOKER`; ninguna usa privilegios administrativos.

## Puesta en marcha local

```bash
npm ci
cp .env.example .env.local
```

Rellena `.env.local` con los valores de tu proyecto de Supabase:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU-CLAVE-PUBLICA
```

La segunda variable admite la clave pública `anon` heredada o la clave publishable actual. El nombre se mantiene conforme al contrato de la aplicación. **Nunca introduzcas una service-role key ni una secret key.** No añadas `.env.local` al repositorio.

```bash
npm run dev
```

Abre [localhost:3000](http://localhost:3000). Sin configuración, se muestra `/login` con las instrucciones de conexión y el acceso deshabilitado; no se generan datos simulados en la aplicación.

## Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. En Authentication → configuración de proveedores/acceso, desactiva **Allow new users to sign up**. Mantén Email/Password activado. Desactiva también los usuarios anónimos y los proveedores que no vayas a utilizar. La configuración local de `config.toml` no modifica automáticamente el proyecto alojado.
3. En Authentication → Users → Add user → Create new user, crea manualmente tu email y contraseña. Marca **Auto Confirm User**. No se incluye formulario ni acción de signup en la aplicación.
4. Aplica la migración mediante una de las alternativas siguientes.
5. Copia Project URL y la clave pública desde el diálogo Connect/API Keys a `.env.local`.
6. En Authentication → URL Configuration, establece Site URL al dominio de producción; para desarrollo puedes usar `http://localhost:3000`.

### Aplicar la migración

Opción sencilla: abre SQL Editor y ejecuta **todo** el archivo `supabase/migrations/20260912092032_initial_workout_schema.sql` una sola vez sobre un proyecto vacío. Incluye tablas, constraints, índices, grants, RLS y funciones. No lo ejecutes parcialmente.

Opción con CLI (recomendada si seguirás evolucionando el esquema):

```bash
npx supabase login
npx supabase link --project-ref TU-PROJECT-REF
npx supabase db push
```

La CLI solicita las credenciales fuera del código. Si ya aplicaste la migración manualmente, no la vuelvas a aplicar con `db push` sin reconciliar antes el historial de migraciones.

Para usar una instancia completamente local, arranca Docker Desktop y ejecuta:

```bash
npx supabase start
```

Copia los valores públicos que muestra la CLI. En el Studio local crea el usuario manualmente. Para reconstruir **únicamente la base local y sus datos desechables**, `npx supabase db reset` vuelve a aplicar las migraciones.

## Cómo usarlo

- **Hoy** muestra el siguiente día según el último entrenamiento completado. La fecha del calendario nunca cambia el turno.
- Pulsa **Empezar entrenamiento**. Se guardan la sesión activa y las series previstas.
- Introduce kg y repeticiones; en plancha lateral, segundos. El peso admite coma o punto decimal y hasta dos decimales. Usa `0` para ejercicios sin carga externa.
- Pulsa el check: la serie se confirma en Supabase y arranca el descanso. Desmarca el check para corregir una serie. Solo las series confirmadas cuentan en las métricas.
- Los valores todavía no enviados se conservan como borradores locales, por usuario y serie. No se sincronizan entre dispositivos. Un error de guardado no marca la serie como completada y permite reintentar.
- Puedes añadir series y quitar la última serie adicional. La rutina base no se elimina desde la UI.
- Los ejercicios unilaterales registran un valor por lado: completa ambos lados antes del check.
- **Finalizar entrenamiento** requiere al menos una serie completa y pide confirmación si faltan otras. La vista de resumen incluye todos los ejercicios y todas las series, también las que quedaron sin completar.
- **Historial** pagina las sesiones de 20 en 20. **Progreso** muestra las últimas 30 sesiones que contienen el ejercicio seleccionado; la ficha de ejercicio muestra las últimas cinco.

### Convención de peso y métricas

Registra siempre la carga con la misma convención. Para mancuernas recomendamos el peso de **una mancuerna**. El volumen mostrado es estrictamente la suma de `peso registrado × repeticiones` en las series completas; no se multiplica por dos por mancuerna o por lado.

Epley: `peso × (1 + repeticiones / 30)`. El 1RM estimado se oculta en ejercicios de tiempo y en accesorios donde aporta poco. Para ejercicios de tiempo se muestra la duración máxima por serie.

### Cambiar la rutina

Edita `src/config/routine.ts`, incrementa `ROUTINE_VERSION`, verifica y despliega. Conserva los IDs estables para seguir comparando un mismo ejercicio. Si cambias de forma incompatible su unidad o su significado, usa un ID nuevo. El programa inicial se mantiene hasta que cambies la configuración; no cambia automáticamente al pasar cuatro semanas.

### Temporizador y móvil

El descanso usa un timestamp absoluto, no un contador decreciente. Permite pausar, reanudar, reiniciar, añadir 30 s y saltar. Se conserva al navegar y recargar, y se ajusta al volver del bloqueo del móvil. Vibra cuando el navegador lo permite; iOS puede no ofrecer vibración y no se garantizan avisos con la aplicación cerrada.

Incluye manifest, iconos PNG, Apple touch icon, viewport y safe areas. En Safari: **Compartir → Añadir a pantalla de inicio**. Está preparada para uso instalado; requiere conexión para cargar datos privados y guardar series. No hay service worker ni caché offline de información privada.

## Verificación

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

- Tests de secuencia (incluyendo sesiones incompletas), Epley, volumen, resumen, validación y timer.
- La suite SQL ejecuta la migración real sobre PostgreSQL embebido (PGlite) y comprueba RLS con dos usuarios y un rol anónimo, constraints, inicio idempotente, finalización, inmutabilidad y series por tiempo. No necesita credenciales ni Docker.
- CI ejecuta lint, typecheck, tests y build en cada PR.
- El test de PostgreSQL no sustituye una comprobación final contra el servicio Supabase real, su configuración Auth y su Data API.

### Entorno aislado para revisar el navegador

`tests/browser-backend.mjs` implementa solo el subconjunto de Auth/PostgREST utilizado por los tests visuales, con PGlite y la migración real. No se importa desde `src`, no se despliega ni desactiva la autenticación de producción. Se enlaza exclusivamente a loopback y crea credenciales efímeras.

En una terminal:

```bash
node tests/browser-backend.mjs
```

En otra terminal, sin modificar `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=local-test-public-key \
npm run dev -- --hostname 127.0.0.1
```

Abre `http://127.0.0.1:3000`. Las credenciales efímeras están en `pulso-browser-fixture.json` dentro del directorio temporal del sistema (`os.tmpdir()`). La base de prueba vive solo en memoria. Detén ambos procesos cuando acabes y arranca el desarrollo normal para conectar al proyecto real.

## Despliegue en Vercel

1. Publica la rama `feat/mvp` en tu repositorio Git cuando estés listo y abre una PR contra `main`.
2. En Vercel → Add New → Project, importa el repositorio. Framework: **Next.js**; raíz: este directorio; instalación: `npm ci`; build: `npm run build`. Usa Node.js 24.
3. Añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en Environment Variables para los entornos necesarios. Una preview conectada a producción modifica tus datos reales; usa un proyecto Supabase separado si quieres pruebas aisladas.
4. Aplica la migración y configura Auth en Supabase **antes** de usar el despliegue.
5. Despliega y establece Site URL en Supabase al dominio HTTPS de Vercel. Si cambias variables `NEXT_PUBLIC_`, crea otro despliegue para incorporarlas al bundle.
6. Comprueba: visita privada sin sesión → `/login`; acceso con tu usuario; guarda una serie; recarga; finaliza; verifica Día 2, historial, progreso y logout.
7. En iPhone añade el sitio a la pantalla de inicio.

No se ha publicado ni desplegado automáticamente. Este directorio no tenía repositorio Git ni remoto al iniciar el trabajo; configura el remoto de tu elección antes de publicar la rama.

## Alcance y límites

Aplicación privada para el único usuario creado manualmente. El aislamiento RLS también protege los datos si un administrador crea más usuarios. No hay edición de rutina desde la UI, registro público, notificaciones push, sincronización offline ni edición de sesiones finalizadas. No se almacenan vídeos: los enlaces no configurados abren una búsqueda de técnica en YouTube.

Los tests y la revisión móvil usan datos locales desechables. Para validar la infraestructura alojada quedan por aportar las dos variables públicas, aplicar la migración y crear el usuario en tu propio proyecto. Las credenciales reales nunca se incluyen en el código.
