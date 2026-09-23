# Registro

## Purpose

Permite dar de alta a los asistentes de la convención por vía online o in situ, generar su
código QR al momento del registro y cargar el comprobante de pago, para que los módulos
posteriores (revisión de pagos, equipos, check-in) trabajen sobre participantes ya
registrados y con QR disponible.

## Requirements

### Requirement: Registro online de participante

El sistema SHALL permitir registrar a un participante a través de la API con
`estadoPago = pendiente` cuando recibe un payload con `tipoRegistro = online`, nombre,
contacto y una referencia al comprobante de pago cargado. Al completar el registro, el
sistema SHALL generar un `participantId` único y devolverlo junto con el código QR del
participante.

#### Scenario: Registro online exitoso

- **WHEN** se envía un registro con `tipoRegistro = online`, nombre y apellido (sin números), contacto (correo válido o teléfono `8877-9955`), correo válido y `comprobante.s3Key` válido
- **THEN** el sistema crea el participante con `estadoPago = pendiente` y `tipoRegistro = online`
- **AND** el sistema genera un `participantId` único y lo devuelve en la respuesta con `codigoQr`
- **AND** el participante queda recuperable por su `participantId`

#### Scenario: Registro online sin comprobante

- **WHEN** se envía un registro con `tipoRegistro = online` que no incluye `comprobante`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el comprobante de pago es obligatorio

### Requirement: Registro por encargado

Cuando el participante es inscrito por un encargado (por ejemplo un padre inscribiendo a su
hijo), el sistema SHALL capturar los datos del participante y los del encargado, y SHALL
devolverlos vinculados en el mismo registro para identificar quién responde por el
participante durante el evento. Los datos del encargado SHALL validarse con las mismas
reglas que los del participante: `encargadoNombre` sin números y con al menos dos palabras,
y `encargadoContacto` como correo válido o teléfono `8877-9955`.

#### Scenario: Registro realizado por un encargado

- **WHEN** se envía un registro con `esRegistroPorEncargado = true`, nombre y contacto del participante, y `encargadoNombre` y `encargadoContacto`
- **THEN** el sistema crea el participante con sus datos y los datos del encargado en el mismo registro
- **AND** la respuesta devuelve `participante` con `encargadoNombre` y `encargadoContacto` poblados

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

El staff el día del evento SHALL poder registrar a un participante directamente en el
lugar, sin comprobante de pago, marcando el pago como confirmado en el momento. Estos
registros SHALL quedar identificados con `tipoRegistro = in_situ` y `estadoPago = pagado`.

#### Scenario: Registro in situ exitoso

- **WHEN** se envía un registro con `tipoRegistro = in_situ`, nombre y contacto, sin comprobante
- **THEN** el sistema crea el participante con `estadoPago = pagado` y `tipoRegistro = in_situ`
- **AND** el sistema devuelve el `participantId` y el `codigoQr` para que el staff lo imprima o muestre en el gafete

### Requirement: Validación de datos del registro

El sistema SHALL validar los datos obligatorios del registro y rechazar con un error 400
cualquier solicitud incompleta o inválida, devolviendo un mensaje que indique el problema.

#### Scenario: Registro sin nombre

- **WHEN** se envía un registro sin nombre
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el nombre es obligatorio

#### Scenario: Registro sin contacto

- **WHEN** se envía un registro sin contacto
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el contacto es obligatorio

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