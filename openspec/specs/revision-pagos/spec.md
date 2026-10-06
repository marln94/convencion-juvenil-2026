# Revision-pagos

## Purpose

Permite al equipo administrador revisar manualmente los comprobantes de pago por transferencia,
aprobar o rechazar cada uno y mantener la constancia del estado de pago del participante.

## Requirements

### Requirement: Bandeja de comprobantes por estado

El sistema SHALL listar los participantes con comprobante pendiente de revisión (y permitir
filtrar por cualquier estado de pago), ordenados por fecha de registro, para que el administrador
decida qué aprobar. Cada item de la bandeja SHALL incluir el motivo de rechazo cuando el
participante lo tenga registrado.

#### Scenario: Bandeja de pendientes

- **WHEN** un admin solicita la bandeja de comprobantes pendientes
- **THEN** el sistema devuelve los participantes con `estadoPago = pendiente` ordenados por fecha

#### Scenario: Filtro por otro estado

- **WHEN** el admin filtra la bandeja por un estado distinto de pendiente (pagado o rechazado)
- **THEN** el sistema devuelve los participantes de ese estado

#### Scenario: Motivo de rechazo en la bandeja

- **WHEN** el admin filtra la bandeja por el estado rechazado
- **THEN** cada item incluye el motivo de rechazo registrado para ese participante
- **AND** los items sin motivo no incluyen ese campo

### Requirement: Bandeja en fila compacta

La bandeja de revisión SHALL presentar a cada participante en una fila única y compacta que
componga el nombre, la fecha de registro y las acciones de la fila en la misma línea cuando el
ancho lo permita, SIN incluir el correo del participante, de modo que un administrador pueda
recorrer varios participantes en un laptop sin desplazamiento. En anchos donde la composición
no quepa, la fila SHALL envolver a la siguiente línea sin que los controles se encimen ni
cambien de tamaño. La fecha de registro SHALL mostrarse en formato corto con hora y sin segundos.

#### Scenario: Composición de la fila

- **WHEN** la bandeja renderiza un participante
- **THEN** la fila muestra el nombre y la fecha de registro corta del participante, seguidos de
  las acciones que correspondan a su estado, sin mostrar el correo
- **AND** la fecha usa un formato corto que incluye hora y omite segundos

#### Scenario: Densidad en laptop

- **WHEN** un admin abre la bandeja en un viewport de laptop
- **THEN** se muestran al menos ocho filas de participantes sin necesidad de desplazamiento

#### Scenario: Envoltura en ancho reducido

- **WHEN** el ancho disponible no alcanza para componer la fila completa
- **THEN** las acciones envuelven a una siguiente línea y cada control conserva su altura
  táctil mínima

#### Scenario: Fila con motivo de rechazo

- **WHEN** la bandeja muestra un participante rechazado que tiene motivo de rechazo
- **THEN** el motivo se muestra como línea adicional bajo la fila, y sólo ese participante
  ocupa dos líneas

### Requirement: Previsualización del comprobante

El sistema SHALL entregar una URL firmada temporal para previsualizar el comprobante (imagen o
PDF) sin exponer el bucket privado, y SHALL exponer en la bandeja si el participante tiene
comprobante para abrirlo.

#### Scenario: Ver el comprobante

- **WHEN** el admin solicita la previsualización del comprobante de un participante
- **THEN** el sistema devuelve una URL firmada de lectura del archivo en S3 con vencimiento

#### Scenario: Participante sin comprobante

- **WHEN** el participante no tiene comprobante (p. ej. registro in situ)
- **THEN** la acción de apertura del comprobante se muestra deshabilitada con el texto
  "Sin comprobante"
- **AND** activarla no produce ninguna navegación ni acción

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