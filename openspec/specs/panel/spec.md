# Panel

## Purpose

Provee la aplicación interna única para el equipo organizador y el staff de campo: vistas de
administración y de campo con separación por roles, diseño mobile-first y tolerancia a la pérdida
de conexión durante el evento.

## Requirements

### Requirement: Inicio de sesión según grupo

El sistema SHALL permitir a los usuarios internos (admin y staff) iniciar sesión y SHALL dirigirlos
a la vista inicial según su grupo: admin al dashboard y staff al check-in.

#### Scenario: Login de un admin

- **WHEN** un usuario del grupo admin inicia sesión
- **THEN** el sistema lo dirige al dashboard de administración

#### Scenario: Login de un staff

- **WHEN** un usuario del grupo staff inicia sesión
- **THEN** el sistema lo dirige a la vista de check-in

### Requirement: Vistas de administración

El sistema SHALL ofrecer únicamente a los usuarios admin las vistas de dashboard de estadísticas,
revisión de pagos y gestión de equipos, además de las vistas de campo. Los usuarios staff SHALL
NOT poder ver estas vistas.

#### Scenario: Admin abre la revisión de pagos

- **WHEN** un admin abre la vista de revisión de pagos
- **THEN** el sistema muestra la bandeja de comprobantes y permite aprobar o rechazar cada uno

#### Scenario: Admin gestiona equipos

- **WHEN** un admin abre la vista de equipos
- **THEN** el sistema muestra la asignación por color y permite generar, bloquear e imprimir o
  exportar

#### Scenario: Staff no ve las vistas de administración

- **WHEN** un usuario staff navega a una vista de administración
- **THEN** el sistema no le muestra esa vista

### Requirement: Vistas de campo

El sistema SHALL ofrecer a todo usuario autenticado (admin y staff) las vistas de check-in y
registro in situ, con escaneo de QR y búsqueda por nombre.

#### Scenario: Escaneo del QR de un asistente

- **WHEN** el staff escanea el QR de un gafete
- **THEN** el sistema muestra el nombre del participante, su estado de pago y permite registrar su
  llegada

#### Scenario: Registro in situ desde el panel

- **WHEN** el staff registra a un asistente en el lugar
- **THEN** el sistema crea el registro y muestra el código QR para el gafete en el momento

### Requirement: Modo contingencia offline

El sistema SHALL tolerar la pérdida de conexión durante la operación de campo: SHALL seguir
permitiendo el check-in y el registro in situ usando datos locales, SHALL acumular las escrituras
en una cola local persistente y SHALL sincronizarlas cuando la conexión se restablezca, sin perder
datos. El inicio de sesión SHALL requerir conexión.

#### Scenario: Se pierde la señal durante un turno

- **WHEN** la conexión se pierde mientras el staff opera el check-in o el registro in situ
- **THEN** el sistema continúa permitiendo ambas operaciones con datos en caché y acumula los
  cambios en una cola local

#### Scenario: Sincronización al volver la señal

- **WHEN** la conexión se restablece
- **THEN** el sistema sube la cola pendiente, aplica los cambios en el servidor y actualiza la
  caché
- **AND** el indicador de pendientes de sincronizar se limpia

#### Scenario: La cola persiste si se cierra la app

- **WHEN** la app se cierra con operaciones pendientes en cola
- **THEN** la cola queda guardada localmente y se sincroniza la próxima vez que la app opera con
  conexión

#### Scenario: Login sin conexión

- **WHEN** un usuario intenta iniciar sesión sin conexión
- **THEN** el sistema no lo permite e indica que se requiere conexión para iniciar sesión

### Requirement: Registro in situ offline con QR inmediato

El sistema SHALL permitir completar un registro in situ sin conexión generando el identificador y
el código QR en el dispositivo, y SHALL enviarlo al servidor al sincronizar.

#### Scenario: Registro in situ sin conexión

- **WHEN** el staff registra a un asistente in situ sin conexión
- **THEN** el sistema genera el `participantId` y muestra el QR de inmediato
- **AND** el registro queda en la cola local hasta la sincronización

### Requirement: Diseño mobile-first

El sistema SHALL funcionar correctamente en teléfonos y tablets (orientación vertical y horizontal), con controles táctiles grandes, sin desplazamiento horizontal y con navegación principal siempre visible. En viewports de 768px o más SHALL presentar la navegación en una barra lateral vertical; por debajo de 768px SHALL presentarla como una barra horizontal fija en la parte inferior, respetando el safe area del dispositivo. El sistema SHALL seguir siendo usable desde un laptop en la mesa de check-in.

#### Scenario: Check-in desde un teléfono

- **WHEN** el staff usa la app desde un teléfono
- **THEN** la vista de check-in se ve y opera a pantalla completa, la navegación inferior permanece visible y los controles de toque son grandes

#### Scenario: Navegación lateral en tablet o laptop

- **WHEN** un usuario autenticado usa la app en un viewport de 768px o más
- **THEN** la navegación aparece como una barra lateral vertical junto al contenido y la vista activa se distingue visualmente

#### Scenario: Safe area de la navegación móvil

- **WHEN** el dispositivo tiene un inset de seguridad en la parte inferior
- **THEN** la navegación móvil respeta ese inset y el contenido principal reserva el espacio necesario para no quedar oculto

#### Scenario: Uso desde un laptop

- **WHEN** el staff usa la app desde un laptop en la mesa de check-in
- **THEN** las vistas mantienen un layout legible sin romperse

### Requirement: Login del panel con el eslogan de la convención
La pantalla de inicio de sesión del panel SHALL mostrar el eslogan de la Convención Juvenil
("Atrévete a ser diferente") junto con el símbolo ≠ como una sola pieza gráfica, y SHALL
exponer ese eslogan como nombre accesible de la imagen.

La pantalla SHALL NOT mostrar un símbolo ≠ separado del eslogan ni el título "Panel" como
elemento de marca propio. El eslogan SHALL componerse sobre el fondo de papel, sin caja
rectangular visible.

Como el eslogan reemplaza al título que era el único encabezado de la página, el sistema
SHALL mantener una jerarquía de encabezados válida: el eslogan SHALL ser el encabezado de
nivel 1 de la pantalla de login, de modo que el documento no quede sin `<h1>` y el nombre
accesible del encabezado no se duplique.

La pantalla SHALL conservar el formulario de usuario y contraseña, el mensaje de credenciales
incorrectas y la separación de vistas por rol que existían antes de este cambio.

Como el panel es una PWA que se usa con conectividad degradada en la puerta, el eslogan
SHALL estar disponible en el precache para que la pantalla de login se renderice completa
sin conexión de red.

#### Scenario: El login muestra el eslogan

- **WHEN** una persona abre el panel sin sesión iniciada
- **THEN** ve el eslogan "Atrévete a ser diferente" con el símbolo ≠ integrado, en lugar del
  símbolo aislado y el título "Panel"

#### Scenario: El eslogan se lee sin ver

- **WHEN** una persona navega la pantalla de login con un lector de pantalla
- **THEN** el eslogan se anuncia una sola vez como "Atrévete a ser diferente" y el símbolo ≠
  no se anuncia por separado

#### Scenario: La pantalla conserva su encabezado

- **WHEN** se inspecciona el árbol de encabezados de la pantalla de login
- **THEN** existe exactamente un encabezado de nivel 1, su nombre accesible es el eslogan, y
  ningún lector de pantalla lo anuncia dos veces

#### Scenario: El login sigue funcionando

- **WHEN** una persona introduce credenciales válidas
- **THEN** el acceso se concede y la persona llega a la vista inicial que le corresponde por
  rol, sin cambios respecto a antes de este cambio

#### Scenario: El login sigue rechazando credenciales incorrectas

- **WHEN** una persona introduce credenciales inválidas
- **THEN** se muestra el mensaje de credenciales incorrectas y el formulario permanece
  disponible

#### Scenario: El login renderiza sin conexión

- **WHEN** el panel se abre sin conexión de red con la aplicación ya instalada
- **THEN** la pantalla de login se renderiza completa, incluido el eslogan, y el formulario
  de acceso sigue visible
