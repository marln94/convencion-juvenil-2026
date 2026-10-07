# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
