# Spec Delta

## ADDED Requirements

### Requirement: Campos de contacto en el registro in situ

El formulario de registro in situ del panel SHALL capturar el teléfono y el correo en campos separados y opcionales, alineados con el formulario público: `contacto` SHALL aceptar únicamente un teléfono `8877-9955` formateado automáticamente con guion mientras el staff escribe, y `correo` SHALL aceptar únicamente un correo válido. Los mensajes de error SHALL ser los mismos que los del formulario público (`El contacto debe ser un teléfono 8877-9955` y `El correo no tiene un formato válido`). Los errores SHALL mostrarse junto al campo que los origina, SHALL actualizarse en tiempo real mientras el staff los corrige y SHALL marcarse sobre todos los campos inválidos al intentar el envío, sin depender de un único mensaje general.

#### Scenario: Un correo en el campo de teléfono
- **WHEN** el staff escribe un correo en el campo de teléfono e interactúa con él
- **THEN** el campo muestra el error `El contacto debe ser un teléfono 8877-9955` junto al campo y el formulario no se envía

#### Scenario: Corrige el teléfono
- **WHEN** el staff reemplaza el valor inválido por un teléfono `8877-9955`
- **THEN** el error del campo desaparece sin necesidad de reenviar el formulario

#### Scenario: Envío con campos inválidos
- **WHEN** el staff pulsa el botón de envío con uno o más campos inválidos
- **THEN** cada campo inválido muestra su propio error debajo del campo y el formulario no se envía

#### Scenario: Teléfono y correo vacíos
- **WHEN** el staff envía el formulario sin teléfono y sin correo
- **THEN** el sistema permite el envío, porque ambos campos son opcionales

#### Scenario: Teléfono escrito sin guion
- **WHEN** el staff escribe los 8 dígitos del teléfono sin escribir el guion
- **THEN** el campo muestra el valor formateado como `8877-9955` y la validación lo acepta

### Requirement: Visibilidad de las operaciones rechazadas por el servidor

Cuando el servidor rechaza de forma definitiva una operación encolada (registro in situ o check-in), el sistema SHALL conservar el motivo del rechazo y SHALL hacerlo visible en lugar de perderlo. El indicador de la cabecera SHALL mostrar el número de operaciones rechazadas y, al activarlo, SHALL listar cada descarte con su fecha, su tipo, el participante afectado y el motivo devuelto por el servidor, y SHALL permitir marcarlas como revisadas para limpiar el indicador. Cuando la sincronización ocurre inmediatamente después de crear un registro in situ o un check-in con conexión, el sistema SHALL mostrar el rechazo con su motivo en esa misma pantalla en lugar de un mensaje de éxito, y en el caso del registro SHALL conservar los datos del formulario para que el staff pueda corregirlos y reintentar.

#### Scenario: El servidor rechaza el registro in situ al sincronizar
- **WHEN** el staff crea un registro in situ con conexión y el servidor lo rechaza (400) durante la sincronización
- **THEN** la pantalla muestra el motivo del rechazo en lugar de "Registro sincronizado con el servidor"
- **AND** no presenta el gafete como confirmado y conserva los datos del formulario ingresados

#### Scenario: El servidor rechaza el check-in al sincronizar
- **WHEN** un check-in encolado es rechazado por el servidor durante la sincronización
- **THEN** el sistema muestra que la llegada no pudo registrarse en el servidor en lugar de mostrarla como registrada

#### Scenario: Detalle de las operaciones rechazadas
- **WHEN** existe al menos una operación rechazada pendiente de revisión
- **THEN** la cabecera muestra el contador de rechazadas y, al activarlo, se lista cada descarte con fecha, tipo, participante afectado y motivo

#### Scenario: Rechazo detectado al reconectar
- **WHEN** una operación encolada sin conexión es rechazada por el servidor al restablecerse la conexión
- **THEN** el descarte queda disponible con su motivo en el detalle del indicador de la cabecera

#### Scenario: Marcar las rechazadas como revisadas
- **WHEN** el staff marca las operaciones rechazadas como revisadas
- **THEN** el contador y la lista se limpian, y las operaciones dejan de señalarse
