# Spec Delta

## MODIFIED Requirements

### Requirement: Listado de participantes

El sistema SHALL devolver la lista completa de participantes paginada, con filtros opcionales por
`estadoPago`, `tipoRegistro` y `checkIn`, y SHALL devolver los participantes de un `estadoPago`
dado ordenados por fecha de registro (descendente). Cada ítem del listado SHALL incluir la
`fechaRegistro` del participante, de modo que el cliente pueda ordenar la lista completa por fecha
de registro incluso cuando no se aplica ningún filtro.

#### Scenario: Listado sin filtros

- **WHEN** se solicita el listado sin filtros
- **THEN** el sistema devuelve la lista completa paginada con metadatos de paginación

#### Scenario: Filtrado por estado de pago

- **WHEN** se solicita el listado con filtro `estadoPago = pendiente`
- **THEN** el sistema devuelve únicamente los participantes de ese estado, ordenados por fecha
  de registro (descendente)

#### Scenario: Paginación

- **WHEN** se solicita una página posterior a la primera
- **THEN** el sistema devuelve la página correspondiente sin repetir ni omitir registros

#### Scenario: Fecha de registro en cada ítem

- **WHEN** se solicita el listado con o sin filtros
- **THEN** cada ítem devuelto incluye su `fechaRegistro`
