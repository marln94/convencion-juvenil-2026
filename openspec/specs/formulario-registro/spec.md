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

El sistema SHALL solicitar los datos del participante (nombre, contacto opcional, correo opcional, **localidad**, **region**, **edad**, **diasAsistencia**, **rol**) y, si aplica, los del encargado, y SHALL impedir el envío mostrando un error visible cuando falten datos obligatorios o el correo sea inválido. Los campos del encargado SHALL validarse con las mismas reglas que los del participante (nombre sin números y con nombre y apellido; contacto como correo válido o teléfono `8877-9955`). **Los nuevos campos extendidos (localidad, region, edad, diasAsistencia, rol) son obligatorios y se validan según sus respectivas reglas**. El error de cada campo SHALL mostrarse junto al campo que lo origina y SHALL actualizarse en tiempo real mientras el usuario lo corrige, y SHALL limpiarse al volver a pasos anteriores.

#### Scenario: Validación en tiempo real junto al campo
- **WHEN** el usuario deja vacío o completa mal un campo (ej. nombre con números, contacto sin formato `8877-9955`, localidad vacía, región sin seleccionar, edad no positiva, ningún día de asistencia, rol sin seleccionar)
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
- **THEN** el sistema muestra un mensaje de error indicando que la edad debe ser un número positivo y no envía el registro

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

Al completar el registro en línea, el sistema SHALL mostrar una pantalla de confirmación con el código QR del participante, su `participantId` y una indicación de que el pago quedó pendiente de revisión, y SHALL permitir compartir o guardar el gafete como una imagen del código QR. **Los campos extendidos capturados (localidad, region, edad, diasAsistencia, rol) se envían al backend y se almacenan en el participante, pero no se muestran en la pantalla de confirmación**.

#### Scenario: Registro online completado
- **WHEN** el registro en línea se completa con éxito
- **THEN** el sistema muestra el código QR generado a partir de `codigoQr` junto con el `participantId`
- **AND** indica que el comprobante quedó pendiente de revisión

#### Scenario: Guardado o compartición del QR
- **WHEN** el participante toca "Guardar/Compartir" y el navegador soporta compartir archivos
- **THEN** el sistema comparte una imagen PNG del gafete por el diálogo nativo de compartir del dispositivo
- **AND** la imagen incluye el nombre de la convención, el nombre del participante y el código QR, con el `participantId` en tipografía discreta en la base

#### Scenario: Sin soporte para compartir archivos
- **WHEN** el participante toca "Guardar/Compartir" y el navegador no soporta compartir archivos (p.ej. Firefox en escritorio)
- **THEN** el sistema descarga la imagen PNG del gafete
- **AND** no copia el identificador al portapapeles

### Requirement: Identidad visual del gafete PNG

El gafete que el sistema genera como imagen PNG SHALL seguir el sistema de diseño de la
Convención Juvenil 2026 en lugar de composición de una paleta propia. El sistema SHALL
derivar colores, tipografía y grosores de borde de los tokens del proyecto en tiempo de
ejecución, SHALL usar fondo `--color-paper-light`, marco de 2 px en `--color-ink` con
radio 0, y SHALL posicionar la información en el orden convención, regla de acento,
nombre del participante, código QR, `participantId`.

El código QR SHALL conservar su presupuesto de contraste completo: los módulos SHALL
usar `--color-ink` sobre `--color-paper-light`, SHALL mantener la zona de silencio de 4
módulos exigida por la especificación, SHALL NOT llevar logo embebido, SHALL NOT llevar
marco ni borde propios, y el sistema SHALL NOT usar `--color-red` ni ningún otro color de
contraste reducido para los módulos, porque el gafete se escanea con la cámara del
teléfono y también se imprime.

El sistema SHALL componer el gafete en una resolución de exportación que lo haga
imprimible a 300 DPI y SHALL NOT escalar hacia arriba el bitmap del QR al componerlo.
Las familias y los pesos tipográficos usados SHALL corresponder a los que la carga de
fuentes del proyecto realmente provee, y el sistema SHALL solicitar explícitamente su
descarga antes de dibujar, de modo que el gafete no se genere con la pila de fuentes del
sistema por defecto. Si la descarga de fuentes falla, el sistema SHALL degradar a la pila
del sistema y SHALL continuar generando el gafete.

#### Scenario: Gafete generado tras completar el registro

- **WHEN** el sistema genera el gafete PNG
- **THEN** el fondo es `--color-paper-light` y el artefacto lleva un marco de 2 px en `--color-ink` con esquinas rectas
- **AND** el nombre de la convención se dibuja en la tipografía display en peso 800, en mayúsculas y en `--color-ink`
- **AND** una regla horizontal de 2 px en `--color-red` separa el nombre de la convención del nombre del participante
- **AND** el nombre del participante se dibuja en la tipografía display en peso 700, en mayúsculas y en `--color-ink`
- **AND** el `participantId` se dibuja en tipografía monoespaciada en peso 400 sobre `--color-ink-fade`

#### Scenario: Lectura del QR con la cámara del teléfono

- **WHEN** el staff escanea el gafete en la puerta con la aplicación de check-in
- **THEN** los módulos del QR se leen con el contraste de `--color-ink` sobre `--color-paper-light`
- **AND** el QR mantiene su zona de silencio de 4 módulos, sin logo, marco ni borde que la reduzcan
- **AND** el `codigoQr` codificado es el mismo que antes del cambio, de modo que los gafetes ya compartidos siguen siendo válidos

#### Scenario: Impresión del gafete

- **WHEN** el staff imprime el gafete a 300 DPI
- **THEN** la imagen exportada tiene resolución suficiente para que el nombre y el `participantId` se lean sin verse suavizados
- **AND** el texto se rasteriza a la resolución de exportación y no se escala desde una imagen de menor resolución

#### Scenario: Falla de descarga de las tipografías

- **WHEN** la descarga de las tipografías del proyecto falla al momento de generar el gafete
- **THEN** el sistema dibuja el gafete con la pila de fuentes del sistema
- **AND** el gafete se genera y se comparte o descarga igual, sin quedar bloqueado

#### Scenario: Vista del QR en la pantalla de confirmación

- **WHEN** el participante ve la pantalla de confirmación en el navegador
- **THEN** el QR se dibuja con `--color-ink` sobre `--color-paper-light`, sin costura de fondo blanco dentro de la card que lo contiene

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
