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
- **THEN** el sistema muestra el seguimiento de la asignación: el progreso (integrantes
  asignados y participantes pagados aún sin equipo) y un equipo por tarjeta con su nombre, su
  color y la lista de sus integrantes
- **AND** permite imprimir y exportar la asignación, e incluir el color en la exportación
- **AND** permite mover manualmente a un integrante a otro equipo

#### Scenario: Staff no ve las vistas de administración

- **WHEN** un usuario staff navega a una vista de administración
- **THEN** el sistema no le muestra esa vista

### Requirement: Vista de equipos sin acciones de generación por lotes

La vista de equipos SHALL NOT ofrecer acciones de generación masiva ni de bloqueo de la
asignación: la asignación ocurre durante el check-in y el registro in situ. El encabezado SHALL
indicar cuántos participantes están asignados y cuántos pagados siguen sin equipo, y cada
tarjeta SHALL mostrar el color del equipo de forma visible incluso en impresión, donde el nombre
del equipo SHALL ser el elemento identificador legible.

#### Scenario: Vista sin Generar ni Bloquear

- **WHEN** un admin abre la vista de equipos
- **THEN** la vista no ofrece acciones para generar la asignación ni para bloquearla

#### Scenario: Progreso visible

- **WHEN** ya hay participantes asignados
- **THEN** el encabezado muestra el total de asignados y el de pagados sin equipo

#### Scenario: Impresión legible

- **WHEN** el admin imprime la vista de equipos
- **THEN** cada equipo se identifica por su nombre, sin depender del color impreso

### Requirement: Carga del índice local al iniciar sesión

El sistema SHALL cargar el índice local completo de participantes al iniciar sesión, para todos
los roles, de modo que un dispositivo staff nuevo pueda buscar por nombre y calcular los
conteos de equipo sin conexión desde el primer momento.

#### Scenario: Staff con dispositivo recién instalado

- **WHEN** un usuario staff inicia sesión en un dispositivo sin datos locales
- **THEN** el índice local queda poblado con todos los participantes
- **AND** la búsqueda por nombre y los conteos locales de equipo funcionan sin conexión

#### Scenario: Índice al día tras sincronizar

- **WHEN** la cola local termina de sincronizar
- **THEN** el índice local refleja los cambios aplicados en el servidor, incluidos los equipos

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

### Requirement: Dashboard con últimos inscritos y filtro por nombre

El dashboard de administración SHALL mostrar la lista de participantes sin que el admin tenga que
filtrar: con el buscador por nombre vacío SHALL mostrar los 10 inscritos más recientes ordenados
por `fechaRegistro` descendente, con el buscador siempre visible por encima de la lista y con un
label que indique que se muestran los registros más recientes primero. Al filtrar por nombre SHALL
mostrar todas las coincidencias, también ordenadas por fecha de registro descendente. Las
estadísticas del dashboard SHALL seguir calculándose sobre el conjunto completo de participantes
independientemente del filtro.

#### Scenario: Lista visible sin filtrar

- **WHEN** el admin abre el dashboard con el buscador vacío
- **THEN** la lista muestra los 10 inscritos más recientes
- **AND** un label indica "Últimos inscritos" con el contador "Mostrando los 10 más recientes de N",
  donde N es el total de participantes

#### Scenario: Orden por fecha de registro

- **WHEN** se muestra la lista sin filtro
- **THEN** los participantes aparecen ordenados del más reciente al más antiguo según su
  `fechaRegistro`

#### Scenario: Filtrado con coincidencias

- **WHEN** el admin escribe un nombre en el buscador
- **THEN** la lista muestra todas las coincidencias, ordenadas por fecha de registro descendente,
  sin un tope artificial de resultados

#### Scenario: Filtrado sin coincidencias

- **WHEN** el texto escrito no coincide con ningún nombre de participante
- **THEN** la lista muestra el aviso "Sin coincidencias"

#### Scenario: Búsquedas en ráfaga

- **WHEN** el admin escribe varias veces seguidas y una búsqueda anterior responde después que una
  posterior
- **THEN** la lista refleja el resultado de la última búsqueda escrita, no el de la anterior
