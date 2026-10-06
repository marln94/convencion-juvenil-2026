# Proposal

## Why

El dashboard del panel (`#/dashboard`) carga la lista completa de participantes, pero solo renderiza
los resultados del buscador: con el campo de filtro vacío la lista queda en cero elementos y sin
mensaje alguno, así que parece una vista rota. Además, aunque se renderizara, no existe forma de
ordenarla por fecha de registro: `ResumenParticipante` descarta `fechaRegistro` en el mapeo del
repositorio.

## Contexto

- El panel pide todos los participantes con paginación de 500 (`cargarParticipantes`) y los guarda en
  `todos`, pero `todos` solo alimenta las tarjetas de estadísticas; el `<ul>` mapea `resultados`.
- El efecto de búsqueda vacía `resultados` cuando el filtro está en blanco
  (`Dashboard.tsx:67-69`) y el aviso "Sin coincidencias" está condicionado a tener texto, por lo que
  sin filtro no se muestra ni un mensaje.
- `fechaRegistro` es la sort key de la tabla DynamoDB (`Participante.fechaRegistro`), pero
  `aResumen()` no lo incluye en `ResumenParticipante`, así que el cliente no puede ordenar.
- Escala esperada: hasta ~800 asistentes. El orden de un `Scan` sin filtros es arbitrario.
- La búsqueda por nombre es cliente-side sobre IndexedDB por decisión de diseño archivada
  (`2026-09-24-busqueda-participantes`); no hay parámetro `q` en el API.

## What Changes

- `ResumenParticipante` incorpora `fechaRegistro: string` y el repositorio lo pobla en cada listado.
- El dashboard muestra, sin filtrar, los **10 inscritos más recientes** (ordenados por
  `fechaRegistro` descendente) con el buscador siempre visible encima de la lista.
- El label indicativo **"Últimos inscritos"** junto al contador "Mostrando los 10 más recientes de N".
- Al escribir en el buscador se muestran **todas** las coincidencias (sin tope de 30), también
  ordenadas por fecha descendente, con el contador de coincidencias correspondiente.
- Se corrige el aviso "Sin coincidencias" para que aparezca cuando el filtro no matchea nada.
- Se agrega una guardia de obsolescencia al efecto de búsqueda (una respuesta lenta vieja no debe
  pisar una más nueva).

## Non-goals

- No se agrega ordenamiento ni paginación server-side; el `Scan` sin filtros sigue sin orden garantizado
  y no se crea ningún GSI nuevo.
- No se modifica `GET /inscripciones`: sin nuevos query params ni cambios de contrato HTTP más allá del
  campo adicional en cada ítem.
- No se cambia el comportamiento del buscador en Checkin ni en Equipos.
- No se agrega filtrado por estado de pago, check-in ni equipo en el dashboard (solo nombre).
- No se implementa virtualización ni scroll infinito: la lista acotada a 10 elementos no lo requiere.
- No se corrige el índice put-only de IndexedDB (posibles entradas fantasma), fuera de alcance.

## Capabilities

### New Capabilities

<!-- ninguna -->

### Modified Capabilities

- `busqueda-participantes`: el listado de participantes incluye `fechaRegistro` en cada ítem de modo
  que el cliente puede ordenar por fecha de registro.
- `panel`: el dashboard de administración muestra por defecto los últimos inscritos ordenados por
  fecha de registro, con buscador por nombre siempre visible y estados claros de listado,
  coincidencias y ausencia de coincidencias.

## Impact

- **`packages/shared-types`**: `ResumenParticipante` en `src/dtos.ts` gana un campo requerido
  (cambio que afecta a todo consumidor tipado: panel y tests que construyen el DTO).
- **`services/api`**: `aResumen()` en `src/repos/participantes.ts`; fixtures y expectativas `toEqual`
  en `repos/participantes.test.ts` y fixture tipado en `handlers/generar-equipos.test.ts`.
- **`apps/panel`**: `src/vistas/Dashboard.tsx` (fuente de la lista, labels, guardia de carrera).
- **Sin cambios de infraestructura**: no hay CDK, ni migración de datos, ni despliegue especial.
- **PWA / caché**: el SW sirve `/inscripciones` con `StaleWhileRevalidate`; un cliente con caché vieja
  no recibirá `fechaRegistro` hasta el primer refresco — el orden degrada a arbitrario, no rompe.
