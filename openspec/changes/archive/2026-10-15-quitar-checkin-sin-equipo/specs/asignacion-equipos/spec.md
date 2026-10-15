# Spec Delta

## MODIFIED Requirements

### Requirement: Confirmación para pagos pendientes o rechazados

El sistema SHALL pedir confirmación explícita antes de asignar equipo a un participante con
`estadoPago` distinto de `pagado`, sin bloquear el acceso ni la entrega de la banda. La
confirmación SHALL presentarse en ambos modos de check-in (escaneo de QR y búsqueda por nombre),
con las mismas opciones y el mismo comportamiento. La confirmación SHALL ofrecer únicamente
asignar el equipo y registrar la llegada, o cancelar. El sistema SHALL NO registrar la llegada
sin asignar equipo: al confirmar, asigna el equipo y registra; al cancelar, no registra la
llegada.

#### Scenario: Pago pendiente confirmado

- **WHEN** se identifica a un participante con `estadoPago = pendiente` sin equipo y el staff
  confirma que desea asignarlo
- **THEN** el sistema asigna el equipo y registra la llegada

#### Scenario: Pago pendiente omitido

- **WHEN** el staff declina la asignación de un participante con pago pendiente o rechazado
- **THEN** el sistema no asigna equipo y no registra la llegada

#### Scenario: Rechazo sin bloqueo

- **WHEN** un participante con `estadoPago = rechazado` llega al evento
- **THEN** el sistema no bloquea su registro de llegada por el estado del pago

#### Scenario: Confirmación al escanear el QR

- **WHEN** se escanea el QR de un participante con `estadoPago` distinto de `pagado` sin equipo y
  el staff usa la acción de registrar la llegada
- **THEN** el sistema muestra la confirmación con las opciones de asignar y registrar, y cancelar
- **AND** la confirmación no ofrece registrar la llegada sin equipo

#### Scenario: Confirmación al buscar por nombre

- **WHEN** el staff busca por nombre a un participante con `estadoPago` distinto de `pagado` sin
  equipo y usa la acción de registrar de su fila
- **THEN** el sistema muestra la misma confirmación que en el escaneo QR, con las mismas opciones

## ADDED Requirements

### Requirement: Toda llegada de check-in queda en un equipo

El sistema SHALL NO registrar una llegada de check-in sin equipo. Cuando el sistema no pueda
determinar un equipo para la llegada, SHALL mostrar un error y SHALL NO registrar la llegada,
para que ningún participante quede sin equipo por la vía del check-in.

#### Scenario: Sin equipo determinado al registrar

- **WHEN** el sistema intenta registrar una llegada y no puede determinar un equipo para el
  participante
- **THEN** el sistema muestra un error y no registra la llegada
- **AND** el participante no queda marcado como llegado
