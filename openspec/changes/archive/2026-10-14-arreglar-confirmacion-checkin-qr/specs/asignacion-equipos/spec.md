# Spec Delta

## MODIFIED Requirements

### Requirement: Confirmación para pagos pendientes o rechazados

El sistema SHALL pedir confirmación explícita antes de asignar equipo a un participante con
`estadoPago` distinto de `pagado`, y SHALL registrar la llegada en ambos casos, sin bloquear el
acceso ni la entrega de la banda. La confirmación SHALL presentarse en ambos modos de check-in
(escaneo de QR y búsqueda por nombre), con las mismas opciones y el mismo comportamiento. Si el
staff omite la asignación, el participante SHALL quedar sin equipo y la interfaz SHALL indicarlo
de forma explícita para que la omisión no pase desapercibida.

#### Scenario: Pago pendiente confirmado

- **WHEN** se identifica a un participante con `estadoPago = pendiente` sin equipo y el staff
  confirma que desea asignarlo
- **THEN** el sistema asigna el equipo y registra la llegada

#### Scenario: Pago pendiente omitido

- **WHEN** el staff declina la asignación de un participante con pago pendiente o rechazado
- **THEN** el sistema registra la llegada igualmente
- **AND** la ficha indica explícitamente que el participante queda sin equipo

#### Scenario: Rechazo sin bloqueo

- **WHEN** un participante con `estadoPago = rechazado` llega al evento
- **THEN** el sistema no bloquea su registro de llegada por el estado del pago

#### Scenario: Confirmación al escanear el QR

- **WHEN** se escanea el QR de un participante con `estadoPago` distinto de `pagado` sin equipo y
  el staff usa la acción de registrar la llegada
- **THEN** el sistema muestra la confirmación con las opciones de asignar y registrar, registrar
  sin equipo y cancelar
- **AND** al confirmar la asignación el sistema asigna el equipo y registra la llegada

#### Scenario: Confirmación al buscar por nombre

- **WHEN** el staff busca por nombre a un participante con `estadoPago` distinto de `pagado` sin
  equipo y usa la acción de registrar de su fila
- **THEN** el sistema muestra la misma confirmación que en el escaneo QR, con las mismas opciones
