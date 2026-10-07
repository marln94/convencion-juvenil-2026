# Proposal

## Why

La mecánica actual de equipos —un botón admin que sortea de una sola vez a todos los pagados y
un bloqueo posterior— no coincide con cómo opera el evento: los 13 grupos ya tienen nombre y
color fijo (Daniel #FFD130 … Nehemías #FFFFFF) y la persona se le asigna **en la puerta, al
llegar**, no semanas antes desde un escritorio. Además, con el sorteo por lotes un equipo
temprano podía quedarse vacío si el sorteo corría antes de que hubiera suficientes pagados.

## Contexto

- La lista definitiva de los 13 equipos con sus colores hexadecimales ya fue entregada por la
  iglesia y **no va a cambiar más**; se fija como valor por defecto en código.
- **No se han generado equipos todavía**: no existe ninguna asignación previa en producción,
  por lo que no hay migración de datos que hacer.
- El check-in es el momento en que el staff entrega la banda física coloreada: es el único
  lugar donde el equipo es información operativa. El check-in y el registro in situ son
  operativos en el campo con tolerancia a pérdida de conexión (cola local persistente).
- Los campos `equipoColor` (participante, GSI) y `colores` (configuración) **se conservan con
  su nombre actual** aunque el valor pase a ser el nombre del equipo: renombrar tocaría el
  GSI en infraestructura sin beneficio para el evento.

## Non-goals

- **No** mostrar el equipo ni el color en el sitio público de registro ni en el gafete/QR:
  se asigna después del pago y hasta la llegada, así que ahí no existe aún.
- **No** renombrar `equipoColor`, `colores` ni el GSI `GSI-Equipo`.
- **No** editar la lista de equipos desde la UI del panel: el default en código basta
  (la ruta `POST /equipos/config` queda como está, sin vista que la use).
- **No** introducir contadores de equipo en DynamoDB ni cambiar la infraestructura.
- **No** añadir paginación, filtros ni estadísticas nuevas a la vista de Equipos más allá del
  progreso de asignación y la reasignación manual.
- **No** incluir equipos en los comprobantes de pago ni en la revisión de pagos.

## What Changes

- **BREAKING**: se elimina la generación por lotes: `POST /equipos/generar` y
  `POST /equipos/bloquear`, sus métodos de api-client, los botones **Generar** y **Bloquear**
  de la vista de Equipos, y los estados `bloqueado`/`fechaGeneracion` de la configuración.
- Nueva mecánica de asignación **incremental en el check-in**: con pago verificado se asigna
  automáticamente; con pago pendiente o rechazado se pide confirmación antes de asignar.
- Nueva regla de equidad: se elige siempre el equipo con menos integrantes, con desempate
  aleatorio (diferencia máxima de 1 entre el mayor y el menor, con asignaciones en línea).
- El registro in situ equivale a hacer check-in al terminar: asigna equipo automáticamente y
  marca `checkIn = true`, y muestra el equipo/banda en la pantalla de confirmación.
- Nuevas rutas: `GET /equipos/conteos` (conteos por equipo, disponible para staff) y
  `POST /equipos/asignar` (asignación o **reasignación manual**, solo admin).
- `POST /checkin` acepta `equipoColor` opcional y lo aplica solo si el participante aún no
  tiene equipo (idempotente ante reescaneos).
- La vista de Equipos pasa a ser de **seguimiento**: progreso de asignación, tarjetas con
  nombre y color real (hex), exportación CSV con columna de color e impresión legible, más
  la acción **Mover** de reasignación manual.
- La vista de Check-in muestra el equipo y el color de la banda en la ficha de escaneo y en
  cada resultado de búsqueda; si se omite la asignación, lo dice explícitamente.
- El índice local del panel se carga completo al iniciar sesión para **todos** los roles
  (hoy solo el admin lo carga desde el dashboard), lo que habilita los conteos offline y
  arregla la búsqueda por nombre en dispositivos staff nuevos.
- Renombre de capacidad: `generacion-equipos` se retira y sus requisitos se reemplazan por
  la nueva capacidad `asignacion-equipos`.

## Capabilities

### New Capabilities

- `asignacion-equipos`: asignación incremental, aleatoria y equitativa de los 13 equipos
  (nombre + color) al momento de la llegada: automática con pago verificado, con
  confirmación para pagos pendientes o rechazados, en registro in situ, con reasignación
  manual de solo-admin y funcionamiento con conexión degradada.

### Modified Capabilities

- `generacion-equipos`: se retiran todos sus requisitos (generación por lotes, bloqueo de la
  asignación, configuración de colores y consulta por color), reemplazados por
  `asignacion-equipos` (retiro de capacidad completa).
- `check-in`: el check-in además asigna equipo (automático o confirmado) y muestra el equipo
  y el color de la banda; conserva la no-bloqueo del acceso por estado de pago.
- `registro`: el registro in situ además asigna equipo y marca la llegada (`checkIn`).
- `panel`: la vista de Equipos muestra progreso y permite reasignación manual; desaparecen
  las acciones de generar y bloquear; el índice local se carga al iniciar sesión.
- `autenticacion`: cambia la matriz de rutas por rol — desaparecen generar/bloquear equipos
  y aparecen `GET /equipos/conteos` (campo) y `POST /equipos/asignar` (solo admin).

## Impact

- **API** (`services/api`): `handlers/generar-equipos.ts` se reescribe (consulta, conteos,
  asignación); `handlers/checkin.ts` aplica `equipoColor`; `handlers/registro.ts` aplica
  equipo y `checkIn` en in situ; `lib/roles.ts` cambia la allow-list; `lib/sorteo.ts` pierde
  el sorteo por lotes y gana `elegirEquipo`; `repos/configuracion.ts` pierde
  `reclamarGeneracion`/`bloquearEquipos`; zod gana schemas de asignación/conteos.
- **Panel** (`apps/panel`): `vistas/Checkin.tsx`, `vistas/Equipos.tsx`,
  `vistas/RegistroInsitu.tsx`, `lib/cola.ts` (payload del checkin), `lib/indice.ts` y
  `lib/participantes.ts` (carga de sesión); nuevo `lib/equipos.ts`.
- **Compartido**: `shared-types` gana la lista canónica de los 13 equipos y los DTOs nuevos,
  y pierde `GenerarEquiposOutput`/`BloquearEquiposOutput`; `api-client` pierde
  `generarEquipos`/`bloquearEquipos` y gana `asignarEquipo`/`obtenerConteos`.
- **Datos**: sin cambios de infraestructura; el GSI sigue sobre `equipoColor` y solo cambia
  el valor guardado (nombre del equipo en vez de palabra de color).
- **Tests**: `sorteo.test.ts` y `generar-equipos.test.ts` se reescriben para la asignación
  incremental; fixtures con palabras de color pasan a nombres reales de equipo.
- **Specs**: nueva capacidad `asignacion-equipos`, retiro de `generacion-equipos` y deltas
  en `check-in`, `registro`, `panel` y `autenticacion`.
