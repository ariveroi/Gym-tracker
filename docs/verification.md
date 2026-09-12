# Verificación del MVP

Fecha: 12 de septiembre de 2026.

## Comprobaciones automáticas

- ESLint sin errores ni advertencias.
- TypeScript estricto y generación de rutas de Next.js.
- 39 tests Vitest: 29 de dominio/timer/validación y 10 de PostgreSQL/RLS.
- Build de producción con Next.js 16.3.5 y Webpack.
- Formato Prettier y comprobación de whitespace de Git.

El SQL de producción se ejecutó realmente con PGlite. Las políticas se probaron usando el rol `authenticated` con dos identidades diferentes, y el rol `anon`. Se verificaron inicio idempotente, aislamiento, bloqueo de escrituras tras finalizar, secuencia y registros por tiempo.

## Navegador móvil

Revisión en el navegador integrado a 390 × 844. Backend aislado de `tests/browser-backend.mjs`, con PostgreSQL embebido, credenciales efímeras y las mismas migraciones y Server Actions que usa la aplicación.

Comprobado:

- Redirección a login sin autenticación e inicio de sesión.
- Pantalla Hoy: Día 1 sin historial, tarjetas y botón de inicio.
- Inicio de sesión de entrenamiento con 15 series previstas.
- Guardado de `72,5 kg × 9` y feedback visual de serie completa.
- Temporizador automático, pausa, reanudación, +30 s, reinicio y salto.
- Navegar al historial vacío conservando el descanso pausado.
- Recarga conservando la serie guardada y un borrador de `70 kg × 10`.
- Añadir y eliminar la última serie adicional.
- Error de escritura inyectado, conservación del input y reintento correcto.
- Finalización parcial: resumen de dos series, volumen de `1.352,5 kg` y detalle de todas las series pendientes.
- Progreso: peso máximo `72,5 kg`, volumen `1.352,5 kg`, 1RM estimado `94,3 kg`.
- Siguiente entrenamiento Día 2, con 17 series.
- Registro de plancha lateral con 25 segundos, sin campos de kg/reps.
- Ficha de ejercicio con instrucciones, objetivos y búsqueda de técnica configurable.
- Fin real del descanso: `00:00`, cambio visual y mensaje accesible.
- Progreso temporal con 25 s, sin gráficos de peso ni 1RM.
- Al finalizar Día 2 vuelve Día 1 y aparece el rendimiento anterior de la prensa.
- Layout a 1280 × 900 sin desbordamiento horizontal.
- Logout y redirección de rutas privadas de nuevo a login.

## Límites de esta verificación

La revisión visual usa datos de prueba. No se ha conectado un proyecto alojado de Supabase ni realizado un despliegue en Vercel. El adaptador de pruebas implementa un subconjunto de Auth/PostgREST; no prueba el servicio de autenticación real, su configuración de signup, la renovación real de tokens ni las restricciones de la infraestructura alojada. Docker no estaba arrancado.

No se ha probado en un dispositivo iOS físico. La vibración depende del navegador; no hay notificaciones push ni servicio offline.
