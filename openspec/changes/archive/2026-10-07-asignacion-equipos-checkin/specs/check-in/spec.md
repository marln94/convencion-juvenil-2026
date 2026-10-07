# Spec Delta

## MODIFIED Requirements

### Requirement: Registro de llegada por QR

El sistema SHALL permitir registrar la llegada de un asistente escaneando su código QR (que
codifica el `participantId`), SHALL mostrar el nombre y el estado de pago del participante,
SHALL mostrar el equipo asignado con el color de la banda cuando lo tenga y SHALL indicar
explícitamente cuando no lo tenga, y SHALL marcar la llegada con su timestamp.

#### Scenario: Escaneo exitoso

- **WHEN** se escanea un QR cuyo `participantId` existe
- **THEN** el sistema muestra al participante con su nombre, estado de pago y su equipo con el
  color de la banda y, al confirmar el registro, marca `checkIn = true` con su timestamp

#### Scenario: Escaneo de un asistente sin equipo

- **WHEN** se escanea un QR cuyo participante no tiene equipo asignado
- **THEN** el sistema indica explícitamente que no tiene equipo, en lugar de dejar el espacio
  vacío

#### Scenario: QR con código desconocido

- **WHEN** se escanea un QR cuyo `participantId` no existe
- **THEN** el sistema indica que el código no corresponde a un participante y no registra la
  llegada

#### Scenario: Llegada repetida

- **WHEN** un asistente ya registrado llega de nuevo
- **THEN** el sistema conserva la llegada original, muestra su equipo actual y la consulta
  muestra que ya llegó

### Requirement: Registro de llegada por búsqueda de nombre

El sistema SHALL permitir encontrar y registrar la llegada de un asistente buscándolo por
nombre, para cuando no se tiene el gafete a mano. Cada resultado SHALL mostrar el nombre, el
estado de pago y el equipo con el color de la banda (o la indicación explícita de que no tiene
equipo). La acción de registrar la llegada SHALL ofrecerse en cada resultado de la búsqueda
únicamente cuando el asistente aún no ha llegado, y los resultados de asistentes que ya
llegaron SHALL mostrar su estado sin ofrecer esa acción. La búsqueda no SHALL abrir un panel
de detalle aparte para registrar la llegada.

#### Scenario: Búsqueda y registro de llegada

- **WHEN** el staff busca un participante por nombre y usa la acción de registro de su fila
- **THEN** el sistema registra su llegada con el mismo comportamiento que el escaneo por QR
- **AND** la fila muestra su equipo con el color de la banda

#### Scenario: Resultado de un asistente que ya llegó

- **WHEN** la búsqueda devuelve un participante cuya llegada ya está registrada
- **THEN** su fila muestra la marca de llegada y no ofrece la acción de registrar

#### Scenario: Resultado sin equipo asignado

- **WHEN** la búsqueda devuelve un participante que aún no tiene equipo
- **THEN** la fila indica explícitamente que no tiene equipo

#### Scenario: Sin panel de detalle en la búsqueda

- **WHEN** el staff revisa los resultados de una búsqueda por nombre
- **THEN** la información del participante y la acción de llegada se muestran en cada fila,
  sin abrir un panel de detalle al final de la lista
