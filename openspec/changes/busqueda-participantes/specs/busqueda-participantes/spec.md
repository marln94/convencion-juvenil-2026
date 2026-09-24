# Spec Delta

## Purpose

Permite consultar los participantes registrados: listado con paginación y filtros para el panel
de administración, detalle por id para la ficha y búsqueda por nombre desde la app de campo
cuando no hay código QR disponible.

## ADDED Requirements

### Requirement: Listado de participantes

El sistema SHALL devolver la lista completa de participantes paginada, con filtros opcionales por
`estadoPago`, `tipoRegistro` y `checkIn`, y SHALL devolver los participantes de un `estadoPago`
dado ordenados por fecha de registro (descendente).

#### Scenario: Listado sin filtros

- **WHEN** se solicita el listado sin filtros
- **THEN** el sistema devuelve la lista completa paginada con metadatos de paginación

#### Scenario: Filtrado por estado de pago

- **WHEN** se solicita el listado con filtro `estadoPago = pendiente`
- **THEN** el sistema devuelve únicamente los participantes con ese estado, ordenados por fecha
  de registro (descendente)

#### Scenario: Paginación

- **WHEN** se solicita una página posterior a la primera
- **THEN** el sistema devuelve la página correspondiente sin repetir ni omitir registros

### Requirement: Detalle de participante

El sistema SHALL devolver el participante completo dado su `participantId`.

#### Scenario: Participante encontrado

- **WHEN** se solicita el detalle de un `participantId` existente
- **THEN** el sistema devuelve el participante con todos sus datos

#### Scenario: Participante inexistente

- **WHEN** se solicita el detalle de un `participantId` desconocido
- **THEN** el sistema responde 404 indicando que el participante no existe

### Requirement: Búsqueda por nombre

El sistema SHALL permitir localizar participantes por nombre a partir de la lista que devuelve el
listado, de modo que el staff encuentre asistentes sin escanear su código QR.

#### Scenario: Búsqueda por fragmento de nombre

- **WHEN** se busca un participante escribiendo parte de su nombre
- **THEN** el sistema permite encontrar los participantes cuyo nombre coincide con lo escrito

#### Scenario: Sin coincidencias

- **WHEN** ningún participante tiene un nombre que coincida con lo buscado
- **THEN** el sistema muestra un resultado vacío sin devolver error