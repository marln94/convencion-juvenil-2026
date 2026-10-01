# campos-extendidos Specification

## Purpose
Define los campos extendidos obligatorios de inscripción (localidad, región, edad, días de asistencia y rol) que se capturan tanto en el formulario online como en el registro in situ, y sus reglas de validación compartidas.

## Requirements

### Requirement: Captura de localidad


El sistema SHALL solicitar la localidad (ciudad/pueblo) del participante como campo de texto libre obligatorio en ambos formularios de registro (online e in situ).

#### Scenario: Localidad requerida
- **WHEN** el usuario deja vacío el campo localidad e intenta avanzar
- **THEN** el sistema muestra un error indicando que la localidad es obligatoria y no permite continuar

#### Scenario: Localidad aceptada
- **WHEN** el usuario ingresa cualquier texto no vacío en localidad
- **THEN** el sistema acepta el valor y permite continuar

### Requirement: Captura de región


El sistema SHALL solicitar la región del participante mediante un selector (select) con 13 opciones predefinidas, almacenando el valor como cadena numérica `'1'` a `'13'`. El campo es obligatorio en ambos formularios.

#### Scenario: Región seleccionada
- **WHEN** el usuario elige una opción válida del selector de región
- **THEN** el sistema almacena el código numérico correspondiente (`'1'`–`'13'`)

#### Scenario: Región obligatoria
- **WHEN** el usuario no selecciona ninguna región e intenta avanzar
- **THEN** el sistema muestra un error indicando que debe seleccionar una región válida

#### Scenario: Valor de región inválido
- **WHEN** se envía un valor de región que no está en el conjunto `'1'`–`'13'`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando región inválida

### Requirement: Captura de edad

El sistema SHALL solicitar la edad del participante como número entero obligatorio en ambos formularios, para cualquier rol, y SHALL rechazar todo valor que no sea un entero entre 15 y 99 años. El campo SHALL tener un rango por rol: para `joven` el rango aceptable es de 15 a 30 años, y para `encargado` y `nexo` es de 15 a 99 años. El backend SHALL aplicar exactamente el mismo rango por rol que los formularios, de modo que ninguna edad rechazada en el cliente pueda llegar a persistirse. El mensaje de error para cualquier edad fuera del rango permitido de su rol SHALL ser `Edad no permitida`; la edad vacía SHALL reportarse por separado como `La edad es obligatoria`.

#### Scenario: Edad válida
- **WHEN** el usuario ingresa un número entero dentro del rango permitido de su rol
- **THEN** el sistema acepta el valor

#### Scenario: Edad obligatoria
- **WHEN** el usuario deja vacío el campo edad e intenta avanzar
- **THEN** el sistema muestra un error indicando que la edad es obligatoria

#### Scenario: Edad no positiva
- **WHEN** el usuario ingresa 0 o un número negativo
- **THEN** el sistema muestra `Edad no permitida`

#### Scenario: Edad por debajo del mínimo
- **WHEN** el usuario ingresa un número entero menor a 15
- **THEN** el sistema muestra `Edad no permitida` y no permite continuar

#### Scenario: Edad por encima del máximo
- **WHEN** el usuario ingresa un número entero mayor a 99
- **THEN** el sistema muestra `Edad no permitida` y no permite continuar

#### Scenario: Edad no entera
- **WHEN** el usuario ingresa un valor decimal
- **THEN** el sistema muestra `Edad no permitida`

#### Scenario: Edad inválida en payload
- **WHEN** se envía un payload con `edad` fuera del rango permitido del rol enviado
- **THEN** el sistema rechaza la solicitud con un error 400 indicando `Edad no permitida`

#### Scenario: La edad es obligatoria para cualquier rol
- **WHEN** el usuario selecciona el rol `encargado` o `nexo`
- **THEN** el sistema sigue mostrando el campo edad como obligatorio y lo exige antes de permitir continuar

#### Scenario: El mismo rango se aplica en cliente y servidor
- **WHEN** una edad es rechazada por el formulario de un rol
- **THEN** la API rechaza con el mismo mensaje y el mismo criterio, sin registros existentes que Write-through modificados

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

### Requirement: Captura de rol


El sistema SHALL solicitar el rol del participante mediante un selector con tres opciones: `joven`, `encargado`, `nexo`. El campo es obligatorio en ambos formularios.

#### Scenario: Rol seleccionado
- **WHEN** el usuario elige una opción válida del selector de rol
- **THEN** el sistema almacena el valor correspondiente (`'joven'` | `'encargado'` | `'nexo'`)

#### Scenario: Rol obligatorio
- **WHEN** el usuario no selecciona ningún rol e intenta avanzar
- **THEN** el sistema muestra un error indicando que debe seleccionar un rol válido

#### Scenario: Valor de rol inválido
- **WHEN** se envía un valor de rol que no está en el conjunto `'joven'`, `'encargado'`, `'nexo'`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando rol inválido

### Requirement: Almacenamiento de campos extendidos en el participante


El sistema SHALL persistir los cinco nuevos campos (`localidad`, `region`, `edad`, `diasAsistencia`, `rol`) en el registro del participante en DynamoDB, disponibles para consulta posterior por módulos de pagos, equipos y check-in.

#### Scenario: Participante con campos extendidos
- **WHEN** se completa un registro (online o in situ) con todos los campos extendidos
- **THEN** el participante guardado incluye `localidad`, `region`, `edad`, `diasAsistencia` y `rol` con los valores enviados
### Requirement: Banda de edad permitida para jóvenes

Cuando el rol seleccionado es `joven`, el sistema SHALL presentar la edad con una banda de 15 a 30 años visible en el control, y esa banda SHALL ser un límite de aceptación, no una sugerencia: el sistema SHALL impedir avanzar y SHALL rechazar el envío cuando el valor capturado quede fuera de ella. Cuando el rol NO es `joven`, el sistema SHALL mostrar la banda de 15 a 99 años, el rango completo de ese rol. El sistema SHALL NOT omitir el control deslizante para roles que no son `joven`.

#### Scenario: Banda visible para jóvenes
- **WHEN** el rol seleccionado es `joven`
- **THEN** el sistema muestra el control de edad con la banda de 15 a 30 años marcada como zona permitida

#### Scenario: Banda visible para otros roles
- **WHEN** el rol seleccionado es `encargado` o `nexo`
- **THEN** el sistema muestra el control de edad con la banda de 15 a 99 años, que abarca el track completo

#### Scenario: Error bloqueante al salir de la banda
- **WHEN** el rol es `joven` y la edad capturada es menor a 15 o mayor a 30
- **THEN** el sistema muestra `Edad no permitida` y no permite avanzar de paso

#### Scenario: La banda bloquea el envío
- **WHEN** el rol es `joven` y la edad capturada es 32, con el resto de los datos obligatorios completos
- **THEN** el sistema impide enviar el registro

#### Scenario: El backend rechaza fuera de banda
- **WHEN** se envía un registro con `rol = joven` y `edad = 32`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando `Edad no permitida`

#### Scenario: La banda cambia al cambiar de rol
- **WHEN** el usuario pasa de `joven` a `encargado` y luego vuelve a `joven`
- **THEN** el valor de edad capturado se conserva y la banda vuelve al rango de 15 a 30 años
