# Design

## Context

Ver proposal.md - Why. Los endpoints `listarParticipantes` y `obtenerParticipante` ya están
declarados en `@convencion/api-client` pero no existen handlers. DynamoDB es la única base; la
tabla `Participantes` define `GSI-EstadoPago` (`estadoPago` → `fechaRegistro`). A la escala del
sistema (~800 registros) la búsqueda por nombre se hace en el cliente sobre la lista descargada.

## Goals / Non-Goals

**Goals:**
- `GET /inscripciones` con paginación y filtros (especialmente `estadoPago`).
- `GET /inscripciones/:id` por llave primaria.
- Lista liviana apta para filtrado client-side en panel y campo.

**Non-Goals:**
- Búsqueda full-text ni GSI por nombre.
- Estadísticas agregadas (se derivan de la misma lista en el cliente).

## Decisions

### 1. Listado por GSI-EstadoPago o Scan paginado según haya filtro

Con filtro de `estadoPago` se usa `Query` sobre `GSI-EstadoPago` (ordenado por fecha, paginación
con `LastEvaluatedKey`). Sin filtro se usa `Scan` paginado: a 800 ítems es barato y más simple.

- **Por qué**: query = rápido y ya ordenado; scan paginado = cero infraestructura extra para el
  caso general.
- **Alternativa considerada**: tabla o GSI adicionales por listado — innecesario a este volumen.

### 2. La búsqueda por nombre es client-side

El panel y la vista de campo cargan la lista (o la ficha por id al escanear) y filtran en memoria
mientras se escribe.

- **Por qué**: decisión tomada en la propuesta técnica; evita infraestructura de búsqueda.

### 3. Lista liviana con resumen tipado

`ListarParticipantesOutput: { items: ResumenParticipante[], pagination: { nextToken?, total } }`
donde `ResumenParticipante` incluye lo que necesitan panel y campo (id, nombre, `estadoPago`,
`equipoColor`, `checkIn`); el detalle completo llega por `GET /inscripciones/:id`.

## Risks / Trade-offs

- [Scan sin filtro en cada carga de pantalla] → Mitigación: paginación + caché del cliente; a 800
  ítems el costo es despreciable.
- [Filtros client-side y paginación se contradicen] → Mitigación: la búsqueda por nombre recorre
  la lista completa descargada (sin paginar) a este volumen; la paginación se usa solo para las
  bandejas de administración.

## Migration Plan

Sin despliegue previo; rollback = revert del commit. No hay cambios de datos.