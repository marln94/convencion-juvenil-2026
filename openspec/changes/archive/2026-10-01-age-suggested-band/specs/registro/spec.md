# Spec Delta

## MODIFIED Requirements

### Requirement: Registro online de participante

El sistema SHALL permitir registrar a un participante a través de la API con `estadoPago = pendiente` cuando recibe un payload con `tipoRegistro = online`, **nombre, contacto opcional, correo opcional, localidad, region, edad, diasAsistencia, rol** y una referencia al comprobante de pago cargado. La `edad` SHALL ser un entero dentro del rango permitido para el `rol` enviado: 15 a 30 años para `joven`, y 15 a 99 años para `encargado` y `nexo`. Los límites y el criterio por rol SHALL ser los mismos que aplican los formularios, con fuente única en `@convencion/shared-types`. Al completar el registro, el sistema SHALL generar un `participantId` único y devolverlo junto con el código QR del participante. **Cualquier edad fuera del rango permitido SHALL rechazarse con 400 y el mensaje `Edad no permitida`.**

#### Scenario: Registro online exitoso
- **WHEN** se envía un registro con `tipoRegistro = online`, nombre y apellido (sin números), **contacto opcional** (correo válido o teléfono `8877-9955`), correo opcional válido, **localidad no vacía, region en `'1'`–`'13'`, edad entera dentro del rango del rol, diasAsistencia array con ≥1 valor de `{jueves-24, viernes-25, sabado-26, domingo-27}`, rol en `{joven, encargado, nexo}`**, y `comprobante.s3Key` válido
- **THEN** el sistema crea el participante con `estadoPago = pendiente` y `tipoRegistro = online`
- **AND** el sistema genera un `participantId` único y lo devuelve en la respuesta con `codigoQr`
- **AND** el participante queda recuperable por su `participantId`
- **AND** el participante incluye los campos `localidad`, `region`, `edad`, `diasAsistencia`, `rol` con los valores enviados

#### Scenario: Registro online sin comprobante
- **WHEN** se envía un registro con `tipoRegistro = online` que no incluye `comprobante`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el comprobante de pago es obligatorio

#### Scenario: Registro online sin campos extendidos obligatorios
- **WHEN** se envía un registro con `tipoRegistro = online` faltando alguno de: `localidad`, `region`, `edad`, `diasAsistencia`, `rol`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando el campo faltante

#### Scenario: Registro online con region inválida
- **WHEN** se envía un registro con `region` fuera del conjunto `'1'`–`'13'`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando región inválida

#### Scenario: Registro online con edad no positiva
- **WHEN** se envía un registro con `edad` = 0 o negativa
- **THEN** el sistema rechaza la solicitud con un error 400 indicando `Edad no permitida`

#### Scenario: Registro online con edad por debajo del mínimo
- **WHEN** se envía un registro con `edad` = 14
- **THEN** el sistema rechaza la solicitud con un error 400 indicando `Edad no permitida`

#### Scenario: Registro online con edad mayor a 99
- **WHEN** se envía un registro con `edad` = 100
- **THEN** el sistema rechaza la solicitud con un error 400 indicando `Edad no permitida`

#### Scenario: Registro online con edad decimal
- **WHEN** se envía un registro con `edad` = 25.5
- **THEN** el sistema rechaza la solicitud con un error 400 indicando `Edad no permitida`

#### Scenario: Registro online con edad de joven fuera de banda
- **WHEN** se envía un registro con `rol = joven` y `edad` = 32, con el resto de campos válidos
- **THEN** el sistema rechaza la solicitud con un error 400 indicando `Edad no permitida`

#### Scenario: Registro online con edad de joven en el borde de banda
- **WHEN** se envía un registro con `rol = joven` y `edad` = 30
- **THEN** el sistema acepta la solicitud y registra al participante

#### Scenario: Registro online con edad fuera de banda para un rol no joven
- **WHEN** se envía un registro con `rol = encargado` y `edad` = 45
- **THEN** el sistema acepta la solicitud, porque la banda de joven no aplica a ese rol

#### Scenario: Registro online sin días de asistencia
- **WHEN** se envía un registro con `diasAsistencia` vacío o array vacío
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que debe seleccionar al menos un día

#### Scenario: Registro online con rol inválido
- **WHEN** se envía un registro con `rol` fuera de `{joven, encargado, nexo}`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando rol inválido