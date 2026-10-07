# Tasks

## 1. Modelo compartido y regla de elección

- [x] 1.1 Crear `packages/shared-types/src/equipos.ts` con `EQUIPOS: { nombre, hex }[]` (13, en
  orden) y helpers (`nombresEquipos`, `equipoPorNombre`); exportar desde `index.ts`. Verificar con
  `pnpm --filter @convencion/shared-types typecheck` y un test que los 13 nombres y hexes coinciden
  con la lista acordada (Daniel #FFD130 … Nehemías #FFFFFF).
- [x] 1.2 Reescribir `services/api/src/lib/sorteo.ts`: `COLORES_EQUIPO_POR_DEFECTO` derivado de
  `nombresEquipos` y nueva función `elegirEquipo(conteos, rng?)` (mínimo + desempate aleatorio con
  `barajar`/`crearGeneradorAleatorio`); eliminar `sortearEquipos`. Verificar con tests: 800
  asignaciones secuenciales dan `max − min ≤ 1` y el desempate es aleatorio y estable con semilla.
- [x] 1.3 Crear `apps/panel/src/lib/equipos.ts`: `hexPorNombre`, `textoSobreColor(hex)` (luminancia
  WCAG), `elegirEquipoLocalDesdeIndice()` y la caché de conteos (`obtenerConteos()` que usa
  `GET /equipos/conteos` si hay red y el índice si no). Verificar con tests unitarios de contraste
  (#FFD130→texto oscuro, #2048FF→texto claro) y de elección con conteos dados.

## 2. API de asignación y conteos

- [x] 2.1 Extender `checkInSchema` y `services/api/src/handlers/checkin.ts` para aceptar
  `equipoColor` opcional y aplicarlo con condición `attribute_not_exists(equipoColor)` en la misma
  escritura del check-in. Verificar en `checkin.test.ts` (o test análogo): participante sin equipo
  lo recibe, participante con equipo no se sobrescribe, equipo inválido → 400.
- [x] 2.2 Añadir `GET /equipos/conteos` al handler de equipos: 13 consultas `Select=COUNT` sobre
  `GSI-Equipo` y respuesta `{ Daniel: n, … }`. Verificar con test de repos/handler y que queda en
  la allow-list de **campo** en `roles.ts`.
- [x] 2.3 Añadir `POST /equipos/asignar { participantId, equipoColor }` solo-admin (en
  `RUTAS_ADMIN`): valida pertenencia a la lista (zod), sobrescribe la asignación, devuelve el
  participante actualizado. Verificar en el test del handler: admin → 200 y persiste, staff → 403,
  equipo inexistente → 400.
- [x] 2.4 Eliminar `POST /equipos/generar` y `POST /equipos/bloquear`, `reclamarGeneracion` y
  `bloquearEquipos` de `repos/configuracion.ts`, y sus rutas de `roles.ts`; dejar fuera del handler
  los DTOs de generación/bloqueo. Verificar que `pnpm --filter @convencion/api test && typecheck`
  pasan y que no queda ninguna referencia en el paquete.
- [x] 2.5 Reescribir/ajustar `services/api/src/handlers/generar-equipos.test.ts` para la nueva
  superficie (conteos, asignación, checkin con equipo) y pasar fixtures de palabras de color a
  nombres reales de equipo (`'rojo'` → `'Daniel'`, etc.) en repos/handlers. Verificar con el suite
  completa de `@convencion/api`.

## 3. DTOs y cliente de API

- [x] 3.1 En `packages/shared-types/src/dtos.ts`: quitar `GenerarEquiposOutput`, `BloquearEquiposOutput`
  y `bloqueado`/`fechaGeneracion` de `ConfiguracionEquipos` (coordinar con `configuracion.ts`);
  añadir `AsignarEquipoInput`, `ConteosEquiposOutput`, `equipoColor?` en `CheckInInput` y en
  `RegistrarParticipanteInput`. Verificar `typecheck` de shared-types y que `api` compila.
- [x] 3.2 En `packages/api-client`: añadir `asignarEquipo` y `obtenerConteos`, eliminar
  `generarEquipos`/`bloquearEquipos`, y actualizar endpoint `listarIntegrantesDeEquipo` si aplica.
  Verificar `pnpm --filter @convencion/api-client test` (incluye `client.test.ts`) y typecheck.

## 4. Check-in del panel

- [x] 4.1 Cargar el índice local completo al iniciar sesión para todos los roles (llamar
  `cargarParticipantes` en el montaje de `App`, no solo en Dashboard) y refrescar equipos tras cada
  sincronización exitosa. Verificar manualmente: sesión staff en dispositivo limpio encuentra por
  nombre y muestra conteos locales sin red.
- [x] 4.2 En `apps/panel/src/vistas/Checkin.tsx`: mostrar el chip de equipo (swatch hex + nombre,
  con `textoSobreColor`) en cada fila de búsqueda y en la ficha de escaneo; si no hay equipo,
  mostrar "Sin equipo" de forma explícita. Verificar con el flujo de escaneo/búsqueda de un
  participante con y sin equipo.
- [x] 4.3 Implementar la decisión de asignación en `registrarLlegada`: pago verificado → asignar
  sin confirmar; pendiente/rechazado → confirmación (`confirm`/diálogo) antes de asignar; tras
  decidir, obtener conteos (servidor si hay red, índice si no), elegir equipo y adjuntarlo al
  payload encolado; ante declinación, encolar sin `equipoColor`. Verificar el comportamiento en
  línea y con red cortada (DevTools offline): el payload de la cola lleva o no el equipo según el
  caso.

## 5. Registro in situ

- [x] 5.1 Incluir `equipoColor` en el payload de `registro_insitu` (elegido con la misma regla y
  conteos) y, online, verificar que el servidor crea el participante `pagado` con
  `checkIn = true` y `equipoColor`. Actualizar `RegistroInsitu.tsx` `enviar()` y el índice local.
  Verificar registro in situ online y offline (op encolada) en el panel.
- [x] 5.2 Mostrar el equipo y el color de la banda en la pantalla de confirmación del registro
  in situ (junto al QR y al estado "pago pagado"). Verificar visualmente en móvil y desktop.

## 6. Vista de Equipos

- [x] 6.1 En `apps/panel/src/vistas/Equipos.tsx`: eliminar los botones **Generar** y **Bloquear** y
  los avisos de bloqueo; añadir el encabezado de progreso (asignados / pagados sin equipo) usando
  `GET /equipos`. Verificar que la vista carga sin acciones de lotes y con el progreso correcto.
- [x] 6.2 Renderizar cada tarjeta con el nombre del equipo y el swatch con su hex (borde si es muy
  claro) y `textoSobreColor` cuando el color sea fondo. Verificar que las 13 tarjetas muestran
  nombre, color y conteo, incluso #FFFFFF (Nehemías).
- [x] 6.3 Añadir la acción **Mover** por integrante (solo admin) que llama a
  `POST /equipos/asignar`, actualiza el índice local y refresca la vista. Verificar: mover a un
  participante cambia ambas listas y los conteos; staff no ve la acción.
- [x] 6.4 Actualizar la exportación CSV a `nombre,equipo,color` (hex) y revisar la impresión para
  que el nombre sea legible sin color. Verificar el CSV descargado y una prueba de impresión.

## 7. Verificación integral

- [x] 7.1 Correr `pnpm typecheck` y `pnpm test` en los paquetes afectados
  (shared-types, api, api-client, panel) y `pnpm build`; correr `scripts/verify-design-system.mjs`
  si aplica. Todos verdes.
- [x] 7.2 Revisar la cola offline (`cola.ts`): confirmar que las operaciones con `equipoColor`
  respetan `RESPUESTAS_DEFINITIVAS` (400 equipo inválido, 404 participante inexistente, 409 ya
  asignado → se descartan; el resto reintenta en orden). Cubrir con un test o verificación manual
  del flujo de descartadas.
- [x] 7.3 Verificación manual end-to-end en local (docker/local DynamoDB): registrar online + pagar,
  registrar in situ, check-in con pago verificado (auto-asigna), con pago pendiente (confirma u
  omite), reasignar desde Equipos y consultar conteos. Observar que ningún equipo excede en más
  de 1 al menor durante una tanda de llegadas en línea.