# Spec Delta

## MODIFIED Requirements

### Requirement: Captura de días de asistencia

El sistema SHALL solicitar los días de asistencia mediante un selector visual de tipo calendario que permita seleccionar múltiples días. Cada opción SHALL mostrar un número de día grande con el nombre del día debajo y SHALL conservar los códigos estables `jueves-24`, `viernes-25`, `sabado-26` y `domingo-27`. El participante DEBE seleccionar al menos un día. El campo es obligatorio y se almacena como array de códigos de día.

#### Scenario: Al menos un día seleccionado

- **WHEN** el usuario selecciona una o más tarjetas de día e intenta avanzar
- **THEN** el sistema acepta la selección y permite continuar

#### Scenario: Ningún día seleccionado

- **WHEN** el usuario no selecciona ninguna tarjeta de día e intenta avanzar
- **THEN** el sistema muestra un error indicando que debe seleccionar al menos un día de asistencia

#### Scenario: Códigos de día conservados

- **WHEN** el usuario completa la selección en el registro online o in situ
- **THEN** el sistema almacena únicamente los códigos `jueves-24`, `viernes-25`, `sabado-26` y `domingo-27` seleccionados

#### Scenario: Día inválido en payload

- **WHEN** se envía un array `diasAsistencia` que contiene valores fuera del conjunto permitido
- **THEN** el sistema rechaza la solicitud con un error 400 indicando día de asistencia inválido
