# Spec Delta

## MODIFIED Requirements

### Requirement: Registro de llegada por búsqueda de nombre

El sistema SHALL permitir encontrar y registrar la llegada de un asistente buscándolo por
nombre, para cuando no se tiene el gafete a mano. La acción de registrar la llegada SHALL
ofrecerse en cada resultado de la búsqueda únicamente cuando el asistente aún no ha
llegado, y los resultados de asistentes que ya llegaron SHALL mostrar su estado sin ofrecer
esa acción. La búsqueda no SHALL abrir un panel de detalle aparte para registrar la llegada.

#### Scenario: Búsqueda y registro de llegada

- **WHEN** el staff busca un participante por nombre y usa la acción de registro de su fila
- **THEN** el sistema registra su llegada con el mismo comportamiento que el escaneo por QR

#### Scenario: Resultado de un asistente que ya llegó

- **WHEN** la búsqueda devuelve un participante cuya llegada ya está registrada
- **THEN** su fila muestra la marca de llegada y no ofrece la acción de registrar

#### Scenario: Sin panel de detalle en la búsqueda

- **WHEN** el staff revisa los resultados de una búsqueda por nombre
- **THEN** la información del participante y la acción de llegada se muestran en cada fila,
  sin abrir un panel de detalle al final de la lista

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

#### Scenario: Aviso de pago en búsqueda y en escaneo

- **WHEN** se muestra un participante con pago pendiente o rechazado, tanto en los resultados
  de la búsqueda por nombre como en el resultado del escaneo QR
- **THEN** el sistema muestra un aviso de que la banda se puede entregar y de que el pago
  seguirá pendiente o rechazado, según el caso

## ADDED Requirements

### Requirement: Reporte del resultado del registro de llegada

El sistema SHALL informar al usuario el resultado de registrar una llegada: en escaneo QR
mediante un mensaje de éxito, en búsqueda por nombre mediante el cambio de la propia fila, y
ante un fallo de almacenamiento local mediante un mensaje de error. Un fallo de sincronización
con el servidor SHALL NO tratarse como un error del registro, porque la operación ya quedó
guardada localmente.

#### Scenario: Éxito en escaneo QR

- **WHEN** se registra una llegada desde el modo escaneo
- **THEN** el sistema muestra un mensaje de éxito y la ficha del participante queda marcada
  como llegada

#### Scenario: Éxito en búsqueda por nombre

- **WHEN** se registra una llegada desde los resultados de búsqueda
- **THEN** la fila del participante pasa a mostrar que llegó, como feedback visible del
  registro

#### Scenario: Fallo de almacenamiento local

- **WHEN** no se puede guardar localmente la operación de llegada
- **THEN** el sistema muestra un mensaje de error y el estado del participante no cambia

#### Scenario: Fallo de sincronización con el servidor

- **WHEN** la operación quedó guardada localmente pero la sincronización con el servidor
  falla
- **THEN** el sistema no muestra un error por el registro y la operación permanece pendiente
  de sincronización
