# Spec Delta

## Purpose

Registra la llegada de los asistentes al evento mediante código QR o búsqueda por nombre, y
muestra su estado de pago vigente al momento de la entrada, permitiendo siempre el acceso.

## ADDED Requirements

### Requirement: Registro de llegada por QR

El sistema SHALL permitir registrar la llegada de un asistente escaneando su código QR (que
codifica el `participantId`), SHALL mostrar el nombre y el estado de pago del participante y SHALL
marcar la llegada con su timestamp.

#### Scenario: Escaneo exitoso

- **WHEN** se escanea un QR cuyo `participantId` existe
- **THEN** el sistema muestra al participante con su nombre y estado de pago y, al confirmar el
  registro, marca `checkIn = true` con su timestamp

#### Scenario: QR con código desconocido

- **WHEN** se escanea un QR cuyo `participantId` no existe
- **THEN** el sistema indica que el código no corresponde a un participante y no registra la
  llegada

#### Scenario: Llegada repetida

- **WHEN** un asistente ya registrado llega de nuevo
- **THEN** el sistema conserva la llegada original y la consulta muestra que ya llegó

### Requirement: Registro de llegada por búsqueda de nombre

El sistema SHALL permitir encontrar y registrar la llegada de un asistente buscándolo por nombre,
para cuando no se tiene el gafete a mano.

#### Scenario: Búsqueda y registro de llegada

- **WHEN** el staff busca un participante por nombre y selecciona el resultado
- **THEN** el sistema permite registrar su llegada con el mismo comportamiento que el escaneo por
  QR

### Requirement: Estado de pago visible sin bloquear el acceso

El sistema SHALL registrar la llegada de todo asistente identificado e SHALL mostrar el estado de
pago vigente al momento de la llegada, sin impedir el acceso ni la entrega de la banda por estar
el pago pendiente o rechazado.

#### Scenario: Llegada con pago pendiente

- **WHEN** un asistente con `estadoPago = pendiente` llega al evento
- **THEN** el sistema registra su llegada y muestra que el pago estaba pendiente
- **AND** la entrega de la banda no se bloquea

#### Scenario: Estado visible en el registro

- **WHEN** se registra la llegada de un asistente
- **THEN** el sistema muestra el estado de pago vigente del participante junto con la marca de
  llegada