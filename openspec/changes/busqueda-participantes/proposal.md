# Proposal

## Contexto

`@convencion/api-client` ya declara `listarParticipantes` (GET `/inscripciones`) y
`obtenerParticipante` (GET `/inscripciones/:id`), pero `services/api` no tiene handlers que los
implementen: solo existen registro, revisar-pago, equipos y checkin. La búsqueda y consulta de
participantes es el dato compartido entre el panel de administración (listar y filtrar el estado
de inscripción/pago) y la app de campo (encontrar por nombre cuando el asistente no tiene el
gafete a mano).

## Why

La consulta de participantes es un endpoint fantasma: declarado en el cliente, inexistente en el
backend. Sin él, el panel no puede listar inscritos, el admin no puede verificar el estado de una
persona por nombre (Módulo 5) y el check-in no tiene fallback cuando no hay QR que escanear.

## What Changes

- Handler `GET /inscripciones`: lista participantes con paginación y filtros opcionales por
  `estadoPago`, `tipoRegistro` y `checkIn`, ordenado por `fechaRegistro` desc (vía
  `GSI-EstadoPago`).
- Handler `GET /inscripciones/:id`: devuelve un participante por su `participantId` (ficha y
  verificación de estado).
- Búsqueda por nombre **en el cliente**: a la escala del sistema (~800 registros) `GET
  /inscripciones` devuelve la lista completa y la app filtra mientras se escribe (decisión ya
  tomada en la propuesta técnica, evita infraestructura extra de búsqueda).
- Repositorio de participantes ampliado: `listarParticipantes` (query sobre GSI) al lado del
  `crearParticipante`/`obtenerParticipante` existentes.
- DTOs de listado y detalle en `@convencion/shared-types` y métodos en `@convencion/api-client`
  alineados a los `ENDPOINTS` ya declarados.

## Capabilities

### New Capabilities

- `busqueda-participantes`: listado, filtrado por estado y consulta de un participante por id o
  por nombre.

### Modified Capabilities

- Ninguna: `registro` no cambia su comportamiento.

## Non-goals

- Motor de búsqueda full-text (OpenSearch, GSI por nombre, etc.): se filtra en memoria con el
  volumen actual.
- Endpoints de estadísticas agregadas para el dashboard: se derivan de la misma lista en el cliente.
- Búsqueda federada (encargado/participante vinculados): la ficha devuelve el registro completo.

## Impact

- **`services/api`**: handlers `listar-participantes.ts` (lista + detalle) montados en `serve.ts`,
  repositorio ampliado.
- **`packages/shared-types`**: DTOs `ListarParticipantesInput/Output`, `ObtenerParticipanteOutput`.
- **`packages/api-client`**: métodos `listarParticipantes` y `obtenerParticipante` conectados a los
  endpoints ya declarados.
- **No afecta**: el modelo de datos ni los handlers existentes.