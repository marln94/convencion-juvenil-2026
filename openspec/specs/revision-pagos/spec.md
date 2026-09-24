# Revision-pagos

## Purpose

Permite al equipo administrador revisar manualmente los comprobantes de pago por transferencia,
aprobar o rechazar cada uno y mantener la constancia del estado de pago del participante.

## Requirements

### Requirement: Bandeja de comprobantes por estado

El sistema SHALL listar los participantes con comprobante pendiente de revisión (y permitir
filtrar por cualquier estado de pago), ordenados por fecha de registro, para que el administrador
decida qué aprobar.

#### Scenario: Bandeja de pendientes

- **WHEN** un admin solicita la bandeja de comprobantes pendientes
- **THEN** el sistema devuelve los participantes con `estadoPago = pendiente` ordenados por fecha

#### Scenario: Filtro por otro estado

- **WHEN** el admin filtra la bandeja por un estado distinto de pendiente (pagado o rechazado)
- **THEN** el sistema devuelve los participantes de ese estado

### Requirement: Previsualización del comprobante

El sistema SHALL entregar una URL firmada temporal para previsualizar el comprobante (imagen o
PDF) sin exponer el bucket privado.

#### Scenario: Ver el comprobante

- **WHEN** el admin solicita la previsualización del comprobante de un participante
- **THEN** el sistema devuelve una URL firmada de lectura del archivo en S3 con vencimiento

#### Scenario: Participante sin comprobante

- **WHEN** el participante no tiene comprobante (p. ej. registro in situ)
- **THEN** la bandeja indica que no hay comprobante que previsualizar

### Requirement: Aprobación o rechazo del comprobante

El sistema SHALL actualizar el `estadoPago` del participante a `pagado` o `rechazado` al aprobar o
rechazar su comprobante, sin alterar su `participantId` ni el código QR.

#### Scenario: Aprobar un comprobante

- **WHEN** el admin aprueba el comprobante de un participante
- **THEN** el `estadoPago` del participante pasa a `pagado`
- **AND** el `participantId` y el QR se mantienen iguales

#### Scenario: Rechazar un comprobante

- **WHEN** el admin rechaza el comprobante de un participante (con motivo opcional)
- **THEN** el `estadoPago` pasa a `rechazado` y el motivo queda asociado al registro

#### Scenario: Re-aprobar un comprobante rechazado

- **WHEN** el admin aprueba el comprobante de un participante cuyo estado es `rechazado`
- **THEN** el `estadoPago` pasa a `pagado` conservando el mismo `participantId`

#### Scenario: Transición inválida

- **WHEN** el admin intenta revisar un pago con una transición no permitida (p. ej. rechazar un
  `pagado` directo a `rechazado` sin pasar por la revisión)
- **THEN** el sistema rechaza la operación con un error 409 indicando la transición inválida