# Spec Delta

## Purpose

Provee el formulario público de inscripción en línea para que el participante o su
encargado capturen los datos, carguen el comprobante de pago y reciban al instante el
código QR de su registro.

## ADDED Requirements

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
cuando falten datos obligatorios o el correo sea inválido.

#### Scenario: Envío sin nombre

- **WHEN** el usuario intenta enviar el formulario sin nombre
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío sin contacto

- **WHEN** el usuario intenta enviar el formulario sin contacto
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío con correo inválido

- **WHEN** el usuario ingresa un campo de correo que no tiene formato válido
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío por encargado incompleto

- **WHEN** el usuario eligió inscribir como encargado y falta `encargadoNombre` o `encargadoContacto`
- **THEN** el sistema muestra un mensaje de error y no envía el registro

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
quedó pendiente de revisión, permitiendo guardar o imprimir el QR.

#### Scenario: Registro online completado

- **WHEN** el registro en línea se completa con éxito
- **THEN** el sistema muestra el código QR generado a partir de `codigoQr` junto con el `participantId`
- **AND** indica que el comprobante quedó pendiente de revisión

#### Scenario: Impresión o guardado del QR

- **WHEN** el participante quiere llevarse su QR
- **THEN** el sistema ofrece imprimir o guardar la pantalla con el código QR

### Requirement: Errores de la API visibles

El sistema SHALL mostrar al usuario los errores devueltos por la API (por ejemplo,
comprobante obligatorio o correo inválido) como mensajes legibles, sin perder los datos ya
ingresados.

#### Scenario: La API rechaza el registro

- **WHEN** la API responde con un error 400
- **THEN** el sistema muestra el mensaje del error y mantiene los datos del formulario para corregir