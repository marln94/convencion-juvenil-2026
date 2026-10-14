# Spec Delta

## MODIFIED Requirements

### Requirement: Captura y validación de datos del formulario

El sistema SHALL solicitar los datos del participante (nombre, contacto opcional, correo opcional, **localidad**, **region**, **edad**, **diasAsistencia**, **rol**) y, si aplica, los del encargado, y SHALL impedir el envío mostrando un error visible cuando falten datos obligatorios o el correo sea inválido. El campo `contacto` del participante SHALL aceptar únicamente un teléfono `8877-9955` —el correo se captura y valida en el campo `correo`— y SHALL formatearse automáticamente con guion mientras el usuario escribe. Los campos del encargado SHALL validarse con reglas análogas a las del participante (nombre sin números y con nombre y apellido; `encargadoContacto` como correo válido o teléfono `8877-9955`, porque es un único campo de contacto). **Los nuevos campos extendidos (localidad, region, edad, diasAsistencia, rol) son obligatorios y se validan según sus respectivas reglas**. La `edad` SHALL validarse como entero dentro del rango permitido para el `rol` seleccionado, con `Edad no permitida` como mensaje único para cualquier valor fuera de rango, y `La edad es obligatoria` cuando está vacía. El error de cada campo SHALL mostrarse junto al campo que lo origina y SHALL actualizarse en tiempo real mientras el usuario lo corrige, y SHALL limpiarse al volver a pasos anteriores.

#### Scenario: Validación en tiempo real junto al campo
- **WHEN** el usuario deja vacío o completa mal un campo (ej. nombre con números, contacto sin formato `8877-9955`, localidad vacía, región sin seleccionada, edad fuera del rango de su rol, ningún día de asistencia, rol sin seleccionar)
- **THEN** el sistema muestra el error debajo de ese campo apenas el usuario interactúa con él y lo quita al corregirlo, sin necesidad de enviar el formulario

#### Scenario: El error se limpia al volver
- **WHEN** el formulario muestra errores y el usuario vuelve a un paso anterior
- **THEN** el sistema limpia los errores mostrados para que no persistan al reingresar

#### Scenario: Envío sin nombre
- **WHEN** el usuario intenta enviar el formulario sin nombre
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío sin localidad
- **WHEN** el usuario intenta enviar el formulario sin localidad
- **THEN** el sistema muestra un mensaje de error indicando que la localidad es obligatoria y no envía el registro

#### Scenario: Envío sin región
- **WHEN** el usuario intenta enviar el formulario sin seleccionar región
- **THEN** el sistema muestra un mensaje de error indicando que debe seleccionar una región válida y no envía el registro

#### Scenario: Envío sin edad
- **WHEN** el usuario intenta enviar el formulario sin edad
- **THEN** el sistema muestra un mensaje de error indicando que la edad es obligatoria y no envía el registro

#### Scenario: Envío con edad no positiva
- **WHEN** el usuario ingresa una edad de 0 o negativa
- **THEN** el sistema muestra `Edad no permitida` y no envía el registro

#### Scenario: Envío con edad por debajo del mínimo
- **WHEN** el usuario ingresa una edad menor a 15
- **THEN** el sistema muestra `Edad no permitida` y no envía el registro

#### Scenario: Envío con edad mayor a 99
- **WHEN** el usuario ingresa una edad mayor a 99
- **THEN** el sistema muestra `Edad no permitida` y no envía el registro

#### Scenario: Envío con edad de joven fuera de banda
- **WHEN** el rol es `joven` y el usuario ingresa una edad mayor a 30
- **THEN** el sistema muestra `Edad no permitida` y no envía el registro

#### Scenario: Envío sin días de asistencia
- **WHEN** el usuario intenta enviar el formulario sin seleccionar ningún día de asistencia
- **THEN** el sistema muestra un mensaje de error indicando que debe seleccionar al menos un día y no envía el registro

#### Scenario: Envío sin rol
- **WHEN** el usuario intenta enviar el formulario sin seleccionar rol
- **THEN** el sistema muestra un mensaje de error indicando que debe seleccionar un rol válido y no envía el registro

#### Scenario: Envío sin contacto
- **WHEN** el usuario intenta enviar el formulario sin contacto
- **THEN** el sistema **permite el envío** (contacto ahora es opcional)

#### Scenario: Escritura del teléfono sin guion
- **WHEN** el usuario escribe los 8 dígitos del teléfono sin escribir el guion
- **THEN** el campo muestra el valor formateado como `8877-9955` y la validación lo acepta

#### Scenario: Envío con nombre que contiene números
- **WHEN** el usuario ingresa un nombre que contiene números
- **THEN** el sistema muestra un mensaje de error indicando que el nombre no puede contener números y no envía el registro

#### Scenario: Envío con nombre sin apellido
- **WHEN** el usuario ingresa un nombre con una sola palabra (sin nombre y apellido)
- **THEN** el sistema muestra un mensaje de error indicando que el nombre debe incluir nombre y apellido y no envía el registro

#### Scenario: Envío con contacto inválido
- **WHEN** el usuario ingresa un contacto que no es un teléfono con formato `8877-9955` (incluido un correo en este campo)
- **THEN** el sistema muestra un mensaje de error indicando que el contacto debe ser un teléfono 8877-9955 y no envía el registro

#### Scenario: Envío con correo inválido
- **WHEN** el usuario ingresa un campo de correo que no tiene formato válido
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío por encargado incompleto
- **WHEN** el usuario eligió inscribir como encargado y falta `encargadoNombre` o `encargadoContacto`
- **THEN** el sistema muestra un mensaje de error y no envía el registro

#### Scenario: Envío con datos del encargado inválidos
- **WHEN** el `encargadoNombre` no tiene nombre y apellido o contiene números, o el `encargadoContacto` no es un teléfono `8877-9955` ni un correo válido
- **THEN** el sistema muestra el error en el campo correspondiente y no envía el registro
