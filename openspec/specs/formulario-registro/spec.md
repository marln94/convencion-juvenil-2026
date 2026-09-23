# Formulario de registro

## Purpose

Provee el formulario público de inscripción en línea para que el participante o su
encargado capturen los datos, carguen el comprobante de pago y reciban al instante el
código QR de su registro.

## Requirements

### Requirement: Elección del tipo de inscripción

El sistema SHALL preguntar al inicio si la persona se está inscribiendo a sí misma o si
inscribe a alguien más como encargado, y SHALL mostrar los campos correspondientes según
la respuesta.

#### Scenario: La persona se inscribe a sí misma

- **WHEN** el usuario elige "inscribirse a sí mismo"
- **THEN** el formulario muestra solo los datos del participante

#### Scenario: La persona inscribe como encargado

- **WHEN** el usuario elige "inscribir como encargado"
- **THEN** el formulario muestra además los campos de `encargadoNombre` y `encargadoContacto`

### Requirement: Captura y validación de datos del formulario

El sistema SHALL solicitar los datos del participante (nombre, contacto, correo opcional)
y, si aplica, los del encargado, y SHALL impedir el envío mostrando un error visible
cuando falten datos obligatorios o el correo sea inválido. Los campos del encargado SHALL
validarse con las mismas reglas que los del participante (nombre sin números y con nombre y
apellido; contacto como correo válido o teléfono `8877-9955`). El error de cada campo SHALL
mostrarse junto al campo que lo origina y SHALL actualizarse en tiempo real mientras el
usuario lo corrige, y SHALL limpiarse al volver a pasos anteriores.

#### Scenario: Validación en tiempo real junto al campo

- **WHEN** el usuario deja vacío o completa mal un campo (ej. nombre con números,
  contacto sin formato `8877-9955`)
- **THEN** el sistema muestra el error debajo de ese campo apenas el usuario interactúa
  con él y lo quita al corregirlo, sin necesidad de enviar el formulario

#### Scenario: El error se limpia al volver

- **WHEN** el formulario muestra errores y el usuario vuelve a un paso anterior
- **THEN** el sistema limpia los errores mostrados para que no persistan al reingresar

#### Scenario: Envío sin nombre

- **WHEN** el usuario intenta enviar el formulario sin nombre
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío sin contacto

- **WHEN** el usuario intenta enviar el formulario sin contacto
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío con nombre que contiene números

- **WHEN** el usuario ingresa un nombre que contiene números
- **THEN** el sistema muestra un mensaje de error indicando que el nombre no puede contener números y no envía el registro

#### Scenario: Envío con nombre sin apellido

- **WHEN** el usuario ingresa un nombre con una sola palabra (sin nombre y apellido)
- **THEN** el sistema muestra un mensaje de error indicando que el nombre debe incluir nombre y apellido y no envía el registro

#### Scenario: Envío con contacto inválido

- **WHEN** el usuario ingresa un contacto que no es un teléfono con formato `8877-9955` ni un correo válido
- **THEN** el sistema muestra un mensaje de error indicando que el contacto debe ser un teléfono 8877-9955 o un correo válido y no envía el registro

#### Scenario: Envío con correo inválido

- **WHEN** el usuario ingresa un campo de correo que no tiene formato válido
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío por encargado incompleto

- **WHEN** el usuario eligió inscribir como encargado y falta `encargadoNombre` o `encargadoContacto`
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío con datos del encargado inválidos

- **WHEN** el `encargadoNombre` no tiene nombre y apellido o contiene números, o el `encargadoContacto` no es un teléfono `8877-9955` ni un correo válido
- **THEN** el sistema muestra el error en el campo correspondiente y no envía el registro

### Requirement: Carga del comprobante de pago

El sistema SHALL permitir seleccionar un archivo de imagen (PNG/JPEG) o PDF como
comprobante de pago, subirlo al almacenamiento mediante la URL firmada y adjuntarlo al
registro. El sistema SHALL impedir la subida de tipos no permitidos con un error visible.

#### Scenario: Selección de un archivo permitido

- **WHEN** el usuario selecciona un archivo `image/png`, `image/jpeg` o `application/pdf`
- **THEN** el sistema solicita una URL de subida, sube el archivo y lo asocia al registro en curso

#### Scenario: Selección de un archivo no permitido

- **WHEN** el usuario selecciona un archivo con un tipo distinto de imagen o PDF
- **THEN** el sistema muestra un error y no intenta subir el archivo

#### Scenario: Fallo al subir el comprobante

- **WHEN** la subida del archivo falla
- **THEN** el sistema muestra un error y permite reintentar sin perder los datos ya ingresados

### Requirement: Pantalla final con el código QR

Al completar el registro en línea, el sistema SHALL mostrar una pantalla de confirmación
con el código QR del participante, su `participantId` y una indicación de que el pago
quedó pendiente de revisión, permitiendo compartir o guardar el identificador.

#### Scenario: Registro online completado

- **WHEN** el registro en línea se completa con éxito
- **THEN** el sistema muestra el código QR generado a partir de `codigoQr` junto con el `participantId`
- **AND** indica que el comprobante quedó pendiente de revisión

#### Scenario: Guardado o compartición del QR

- **WHEN** el participante quiere llevarse su QR, toca "Guardar/Compartir"
- **THEN** el sistema abre el diálogo nativo de compartir del dispositivo si está disponible
- **AND** si no hay soporte para compartir, copia el identificador al portapapeles y confirma la copia en pantalla

### Requirement: Diseño responsive y mobile friendly

El formulario SHALL funcionar correctamente en celulares y tablets: sin desplazamiento
horizontal, con campos y botones de toque grandes, y con las acciones principales a ancho
completo apiladas cuando la pantalla es angosta.

#### Scenario: Uso desde un celular

- **WHEN** el participante completa la inscripción desde un celular
- **THEN** el contenido se adapta al ancho de pantalla y los botones de acción son fáciles de tocar sin zonas colapsadas

### Requirement: Errores de la API visibles

El sistema SHALL mostrar al usuario los errores devueltos por la API (por ejemplo,
comprobante obligatorio o correo inválido) como mensajes legibles, sin perder los datos ya
ingresados.

#### Scenario: La API rechaza el registro

- **WHEN** la API responde con un error 400
- **THEN** el sistema muestra el mensaje del error y mantiene los datos del formulario para corregir