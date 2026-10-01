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


El formulario SHALL funcionar correctamente en celulares y tablets: sin desplazamiento horizontal, con gutters laterales visibles, con campos y botones de toque grandes, y con las acciones principales a ancho completo apiladas cuando la pantalla es angosta. Por debajo de 768px SHALL mantener el header y el footer fuera del área desplazable, SHALL impedir el scroll del documento y SHALL permitir que solo el contenido principal se desplace cuando un paso no quepa en el viewport.

#### Scenario: Uso desde un celular

- **WHEN** el participante completa la inscripción desde un celular
- **THEN** el contenido conserva gutters laterales, los botones de acción son fáciles de tocar y el documento no se desplaza

#### Scenario: Paso más alto que el viewport

- **WHEN** un paso del formulario necesita más altura que el viewport móvil
- **THEN** solo el área principal de contenido se desplaza y el header y el footer permanecen visibles

#### Scenario: Teclado virtual abierto

- **WHEN** el usuario escribe en un campo del formulario y se abre el teclado virtual
- **THEN** el área de contenido se ajusta al viewport reducido y el campo activo permanece alcanzable

#### Scenario: Impresión del resultado

- **WHEN** se imprime la pantalla de confirmación
- **THEN** el documento recupera su flujo normal y el contenido no queda recortado por el shell de altura fija

### Requirement: Errores de la API visibles


El sistema SHALL mostrar al usuario los errores devueltos por la API (por ejemplo,
comprobante obligatorio o correo inválido) como mensajes legibles, sin perder los datos ya
ingresados.

#### Scenario: La API rechaza el registro

- **WHEN** la API responde con un error 400
- **THEN** el sistema muestra el mensaje del error y mantiene los datos del formulario para corregir

### Requirement: Pantalla de bienvenida con el eslogan de la convención

La pantalla de bienvenida del formulario SHALL mostrar el eslogan de la Convención Juvenil
("Atrévete a ser diferente") junto con el símbolo ≠ como una sola pieza gráfica, y SHALL
exponer ese eslogan como nombre accesible de la imagen.

La pantalla SHALL NOT mostrar el texto provisional "MUY PRONTO" ni un símbolo ≠ separado del
eslogan. El eslogan SHALL componerse sobre el fondo de papel, de modo que no se perciba
ninguna caja rectangular alrededor del arte ni una interrupción de la textura.

La pantalla SHALL mantener el llamado a la acción "Comenzar inscripción" como su acción
principal y SHALL seguir iniciando el asistente de inscripción.

Como la pantalla muestra una sola acción, su contenido SHALL quedar centrado horizontal y
verticalmente en el espacio que deja el header, y no pegado al techo con el resto del
viewport vacío debajo. El centrado SHALL funcionar en móvil, donde antes el eslogan quedaba
demasiado arriba. Este centrado SHALL NOT aplicarse a los pasos del asistente: el formulario
debe seguir empezando en su parte superior y desplazándose con normalidad.

Cuando el contenido no cabe en el viewport, el sistema SHALL anclarlo arriba y SHALL mantener
lo que no cabe alcanzable por desplazamiento, en vez de recortarlo por arriba.

#### Scenario: La bienvenida muestra el eslogan

- **WHEN** una persona abre el formulario público sin haber iniciado el asistente
- **THEN** ve el eslogan "Atrévete a ser diferente" con el símbolo ≠ integrado, sin el texto
  "MUY PRONTO" ni un símbolo ≠ aislado debajo

#### Scenario: El eslogan se lee sin ver

- **WHEN** una persona navega la pantalla de bienvenida con un lector de pantalla
- **THEN** el eslogan se anuncia una sola vez como "Atrévete a ser diferente" y el símbolo ≠
  no se anuncia por separado

#### Scenario: El eslogan se apoya sobre el papel

- **WHEN** la pantalla de bienvenida se renderiza
- **THEN** el eslogan se compone sobre el color de papel, el brillo radial y la textura de
  papel, sin un borde rectangular visible ni una costura de ruido alrededor del arte

#### Scenario: La bienvenida completa arranca el asistente

- **WHEN** la persona pulsa "Comenzar inscripción"
- **THEN** el asistente avanza al primer paso de captura de datos, igual que antes de este
  cambio

#### Scenario: La bienvenida no desborda en pantallas bajas

- **WHEN** la pantalla de bienvenida se renderiza en 1366×768 y en 1280×800
- **THEN** el eslogan, los pincelados y el botón "Comenzar inscripción" quedan dentro del
  viewport sin desplazamiento

#### Scenario: La bienvenida se centra en ambos ejes

- **WHEN** la pantalla de bienvenida se renderiza en un viewport con espacio vertical de sobra,
  en móvil y en escritorio
- **THEN** el espacio entre el borde superior del área útil y el eslogan es igual al espacio
  entre el botón y el borde inferior, y el eslogan queda centrado en el eje horizontal

#### Scenario: El centrado no afecta a los pasos del asistente

- **WHEN** una persona pulsa "Comenzar inscripción" y el asistente avanza al primer paso
- **THEN** el formulario de ese paso y los siguientes empiezan en su parte superior, sin
  centrarse verticalmente, y conservan su desplazamiento normal

#### Scenario: Un viewport más bajo que el contenido no recorta

- **WHEN** la pantalla de bienvenida se renderiza en un viewport tan bajo que el eslogan y el
  botón no caben
- **THEN** el contenido se ancla arriba, no se recorta por arriba, y sigue siendo alcanzable
  desplazándose
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
