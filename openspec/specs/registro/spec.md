# Registro

## Purpose

Permite dar de alta a los asistentes de la convención por vía online o in situ, generar su
código QR al momento del registro y cargar el comprobante de pago, para que los módulos
posteriores (revisión de pagos, equipos, check-in) trabajen sobre participantes ya
registrados y con QR disponible.

## Requirements

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
- **THEN** el sistema rechaza la solicitud con un error 400 indicando rol inválido### Requirement: Registro por encargado


Cuando el participante es inscrito por un encargado (por ejemplo un padre inscribiendo a su hijo), el sistema SHALL capturar los datos del participante y los del encargado, y SHALL devolverlos vinculados en el mismo registro para identificar quién responde por el participante durante el evento. Los datos del encargado SHALL validarse con las mismas reglas que los del participante: `encargadoNombre` sin números y con al menos dos palabras, y `encargadoContacto` como correo válido o teléfono `8877-9955`. **Los campos extendidos (localidad, region, edad, diasAsistencia, rol) pertenecen al participante y son obligatorios independientemente de si es registro por encargado**.

#### Scenario: Registro realizado por un encargado
- **WHEN** se envía un registro con `esRegistroPorEncargado = true`, nombre y contacto del participante, `encargadoNombre` y `encargadoContacto`, **y los campos extendidos del participante (localidad, region, edad, diasAsistencia, rol)**
- **THEN** el sistema crea el participante con sus datos y los datos del encargado en el mismo registro
- **AND** la respuesta devuelve `participante` con `encargadoNombre` y `encargadoContacto` poblados
- **AND** el participante incluye los campos extendidos con los valores enviados

#### Scenario: Registro por encargado sin datos del encargado
- **WHEN** se envía un registro con `esRegistroPorEncargado = true` sin `encargadoNombre` o sin `encargadoContacto`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que los datos del encargado son obligatorios

#### Scenario: Registro con nombre del encargado inválido
- **WHEN** el `encargadoNombre` contiene números o no incluye nombre y apellido
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el nombre del encargado no puede contener números o debe incluir nombre y apellido

#### Scenario: Registro con contacto del encargado inválido
- **WHEN** el `encargadoContacto` no es un teléfono con formato `8877-9955` ni un correo válido
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el contacto del encargado debe ser un teléfono 8877-9955 o un correo válido

### Requirement: Generación del código QR al finalizar el registro


El sistema SHALL generar el código QR de cada participante en el mismo momento en que se
completa el registro, sin esperar a que el pago sea confirmado, y SHALL codificarlo a
partir del `participantId`. El código no cambia si el estado de pago cambia más adelante.

#### Scenario: QR disponible aunque el pago siga pendiente

- **WHEN** se completa un registro online cuyo comprobante aún no ha sido revisado
- **THEN** el sistema devuelve en la respuesta el `codigoQr` asociado al `participantId`
- **AND** el `codigoQr` es el mismo que se devolverá en cualquier consulta posterior del participante

### Requirement: Almacenamiento del correo del participante


El sistema SHALL almacenar el campo `correo` en el registro del participante cuando viene
incluido en un alta online, y SHALL validar su formato. El sistema NO envía ningún correo
en esta fase: el QR solo se entrega en la respuesta de la API.

#### Scenario: Registro online con correo válido

- **WHEN** se completa un registro online que incluye un correo electrónico válido
- **THEN** el sistema guarda el `correo` en el registro del participante
- **AND** el QR se entrega únicamente en la respuesta de la API, sin intentar enviar correo

#### Scenario: Registro online sin correo

- **WHEN** se completa un registro online sin correo electrónico
- **THEN** el sistema guarda el participante sin `correo`
- **AND** devuelve `codigoQr` en la respuesta

#### Scenario: Correo con formato inválido

- **WHEN** se envía un registro online cuyo campo de correo no tiene un formato de correo válido
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el correo es inválido

### Requirement: Subida del comprobante de pago


El sistema SHALL entregar una URL firmada para subir el comprobante (imagen o PDF) a un
bucket privado, de modo que el archivo se suba directamente sin pasar por el backend. El
sistema SHALL rechazar tipos de archivo no permitidos antes de generar la URL, y el
comprobante cargado SHALL quedar referenciado por su `s3Key` en el registro del participante.

#### Scenario: Solicitud de URL de subida para archivo permitido

- **WHEN** se solicita una URL de subida para un archivo con tipo `image/png`, `image/jpeg` o `application/pdf`
- **THEN** el sistema responde con una `uploadUrl` firmada, la `s3Key` generada y el `contentType` solicitado

#### Scenario: Solicitud de URL de subida para archivo no permitido

- **WHEN** se solicita una URL de subida para un tipo de archivo distinto de imagen o PDF
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el tipo de archivo no está permitido

### Requirement: Registro in situ


El staff el día del evento SHALL poder registrar a un participante directamente en el lugar, sin comprobante de pago, marcando el pago como confirmado en el momento. Estos registros SHALL quedar identificados con `tipoRegistro = in_situ` y `estadoPago = pagado`. **El registro in situ TAMBIÉN requiere los campos extendidos obligatorios (localidad, region, edad, diasAsistencia, rol). El campo `contacto` es opcional también en in situ.**

#### Scenario: Registro in situ exitoso
- **WHEN** se envía un registro con `tipoRegistro = in_situ`, **nombre, contacto opcional, correo opcional, localidad, region, edad, diasAsistencia, rol**, sin comprobante
- **THEN** el sistema crea el participante con `estadoPago = pagado` y `tipoRegistro = in_situ`
- **AND** el sistema devuelve el `participantId` y el `codigoQr` para que el staff lo imprima o muestre en el gafete
- **AND** el participante incluye los campos extendidos con los valores enviados

#### Scenario: Registro in situ sin campos extendidos
- **WHEN** se envía un registro con `tipoRegistro = in_situ` faltando alguno de: `localidad`, `region`, `edad`, `diasAsistencia`, `rol`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando el campo faltante

### Requirement: Validación de datos del registro


El sistema SHALL validar los datos obligatorios del registro y rechazar con un error 400 cualquier solicitud incompleta o inválida, devolviendo un mensaje que indique el problema. **Los campos obligatorios ahora son: nombre, localidad, region, edad, diasAsistencia, rol. El campo contacto es opcional.**

#### Scenario: Registro sin nombre
- **WHEN** se envía un registro sin nombre
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el nombre es obligatorio

#### Scenario: Registro sin localidad
- **WHEN** se envía un registro sin localidad
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que la localidad es obligatoria

#### Scenario: Registro sin region
- **WHEN** se envía un registro sin region
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que la región es obligatoria

#### Scenario: Registro sin edad
- **WHEN** se envía un registro sin edad
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que la edad es obligatoria

#### Scenario: Registro sin diasAsistencia
- **WHEN** se envía un registro sin diasAsistencia o array vacío
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que debe seleccionar al menos un día de asistencia

#### Scenario: Registro sin rol
- **WHEN** se envía un registro sin rol
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el rol es obligatorio

#### Scenario: Registro sin contacto
- **WHEN** se envía un registro sin contacto
- **THEN** el sistema **ACEPTA la solicitud** (contacto ahora es opcional)

#### Scenario: Registro con contacto que no es teléfono 8877-9955 ni correo
- **WHEN** se envía un registro cuyo contacto no es un teléfono con formato `8877-9955` ni un correo válido
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el contacto debe ser un teléfono 8877-9955 o un correo válido

#### Scenario: Registro con nombre que contiene números
- **WHEN** se envía un registro cuyo nombre contiene números
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el nombre no puede contener números

#### Scenario: Registro con nombre sin apellido
- **WHEN** se envía un registro cuyo nombre no incluye al menos dos palabras separadas por espacio (nombre y apellido)
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el nombre debe incluir nombre y apellido

#### Scenario: Registro con tipo de registro inválido
- **WHEN** se envía un registro cuyo `tipoRegistro` no es `online` ni `in_situ`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el tipo de registro es inválido
