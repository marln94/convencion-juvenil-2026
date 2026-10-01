# Spec Delta

## MODIFIED Requirements

### Requirement: Captura y validación de datos del formulario

El sistema SHALL solicitar los datos del participante (nombre, contacto opcional, correo opcional, **localidad**, **region**, **edad**, **diasAsistencia**, **rol**) y, si aplica, los del encargado, y SHALL impedir el envío mostrando un error visible cuando falten datos obligatorios o el correo sea inválido. Los campos del encargado SHALL validarse con las mismas reglas que los del participante (nombre sin números y con nombre y apellido; contacto como correo válido o teléfono `8877-9955`). **Los nuevos campos extendidos (localidad, region, edad, diasAsistencia, rol) son obligatorios y se validan según sus respectivas reglas**. La `edad` SHALL validarse como entero dentro del rango permitido para el `rol` seleccionado, con `Edad no permitida` como mensaje único para cualquier valor fuera de rango, y `La edad es obligatoria` cuando está vacía. El error de cada campo SHALL mostrarse junto al campo que lo origina y SHALL actualizarse en tiempo real mientras el usuario lo corrige, y SHALL limpiarse al volver a pasos anteriores.

#### Scenario: Validación en tiempo real junto al campo
- **WHEN** el usuario deja vacío o completa mal un campo (ej. nombre con números, contacto sin formato `8877-9955`, localidad vacía, región sin seleccionar, edad fuera del rango de su rol, ningún día de asistencia, rol sin seleccionar)
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

## ADDED Requirements

### Requirement: Banda de edad por rol en el formulario

El formulario SHALL presentar el campo edad con un control deslizante y una banda que marque el rango permitido del rol seleccionado: de 15 a 30 años para `joven`, y de 15 a 99 años para `encargado` y `nexo`. El campo numérico de edad SHALL estar disponible para todos los roles y SHALL ser la fuente del valor. El deslizante SHALL recorrer el dominio duro completo de 15 a 99 años, de modo que su posición pueda señalar valores que el rol no admite, sin contradecir al campo numérico. Cuando la edad quede fuera del rango del rol, el sistema SHALL mostrar `Edad no permitida` y SHALL bloquear el avance de paso y el envío.

#### Scenario: El deslizante aparece con la banda del rol
- **WHEN** el usuario selecciona cualquier rol
- **THEN** el formulario muestra el control de edad con deslizante y con la banda del rango permitido de ese rol marcada

#### Scenario: La banda de joven ocupa solo el inicio del track
- **WHEN** el rol es `joven`
- **THEN** la banda cubre de 15 a 30 sobre un track que va de 15 a 99, es decir aproximadamente el primer 17.86% del recorrido

#### Scenario: El deslizante y el campo numérico comparten el valor
- **WHEN** el usuario mueve el deslizante
- **THEN** el campo numérico refleja ese valor, y al editar el campo numérico el deslizante se reposiciona sin contradecirlo

#### Scenario: Error bloqueante fuera de banda
- **WHEN** el rol es `joven` y la edad es 32
- **THEN** el formulario muestra `Edad no permitida` y no permite avanzar al siguiente paso

#### Scenario: El valor se conserva al cambiar de rol
- **WHEN** el usuario captura una edad, cambia el rol a `encargado` y luego vuelve a `joven`
- **THEN** la edad capturada sigue siendo la misma y la banda vuelve al rango de 15 a 30 años

#### Scenario: Cambiar de rol vuelve a válida una edad antes rechazada
- **WHEN** el rol es `joven` con edad 32 y el usuario cambia el rol a `encargado`
- **THEN** el error desaparece y el formulario permite continuar, porque 32 es válido para ese rol

### Requirement: La validación de edad se repite al enviar

El botón de envío final del formulario SHALL revalidar todos los campos antes de llamar a la API, no solo los del paso visible, porque el usuario puede haber cambiado un campo de un paso anterior sin volver a él.

#### Scenario: El rol cambia en un paso anterior
- **WHEN** el usuario completa la edad como `encargado` con 45 años, vuelve al paso anterior, cambia el rol a `joven` y envía sin regresar al paso de edad
- **THEN** el formulario revalida, muestra `Edad no permitida` y no envía el registro

### Requirement: El control de edad no desborda en móvil

El campo de edad con deslizante SHALL funcionar dentro del shell de altura fija del formulario sin generar desplazamiento horizontal, y el usuario SHALL poder alcanzar tanto el campo numérico como el deslizante desplazando el área principal.

#### Scenario: Uso desde un celular
- **WHEN** el participante completa la edad desde un celular de 390 px
- **THEN** el control no genera scroll horizontal y el deslizante permanece dentro de los gutters laterales

#### Scenario: Deslizante alcanzable con el teclado virtual abierto
- **WHEN** el usuario edita el campo numérico de edad en un celular
- **THEN** el deslizante y la banda siguen siendo alcanzables en el área desplazable
