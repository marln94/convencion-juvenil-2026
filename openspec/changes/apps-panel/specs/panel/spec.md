# Spec Delta

## Purpose

Provee la aplicación interna única para el equipo organizador y el staff de campo: vistas de
administración y de campo con separación por roles, diseño mobile-first y tolerancia a la pérdida
de conexión durante el evento.

## ADDED Requirements

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

El sistema SHALL funcionar correctamente en teléfonos y tablets (orientación vertical y
horizontal), con controles táctiles grandes y sin desplazamiento horizontal, y SHALL ser usable
desde un laptop en la mesa de check-in.

#### Scenario: Check-in desde un teléfono

- **WHEN** el staff usa la app desde un teléfono
- **THEN** la vista de check-in se ve y opera a pantalla completa con controles de toque grandes

#### Scenario: Uso desde un laptop

- **WHEN** el staff usa la app desde un laptop en la mesa de check-in
- **THEN** las vistas mantienen un layout legible sin romperse