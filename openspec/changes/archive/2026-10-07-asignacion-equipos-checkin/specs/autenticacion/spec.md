# Spec Delta

## MODIFIED Requirements

### Requirement: Grupos de usuarios con jerarquía admin ⊇ staff

El sistema SHALL distinguir dos grupos de usuarios, `admin` y `staff`, donde los usuarios `admin`
acceden a todo lo que los `staff` pueden hacer más las operaciones de administración.

#### Scenario: Staff accede a operaciones de campo

- **WHEN** un usuario del grupo `staff` autenticado llama a un endpoint de campo (check-in,
  registro in situ, búsqueda, conteos de equipos)
- **THEN** el sistema permite la operación

#### Scenario: Admin accede a operaciones de campo

- **WHEN** un usuario del grupo `admin` llama a un endpoint de campo
- **THEN** el sistema permite la operación

#### Scenario: Admin accede a operaciones de administración

- **WHEN** un usuario del grupo `admin` llama a un endpoint de administración (revisar pagos,
  reasignar equipos, configurar equipos)
- **THEN** el sistema permite la operación

## REMOVED Requirements

### Requirement: Restricción de endpoints de administración por rol

**Reason**: La matriz de rutas cambia con la nueva mecánica de equipos: la generación por lotes
desaparece y aparece la reasignación manual; los conteos de equipos son operación de campo para
el staff. La regla de restricción se reformula íntegra en el nuevo requisito "Restricción de
endpoints de administración según rol" porque la lista de escenarios cambia por completo
(desaparece el escenario de generar equipos).

**Migration**: Ver el requisito "Restricción de endpoints de administración según rol" de esta
capacidad.

## ADDED Requirements

### Requirement: Restricción de endpoints de administración según rol

El sistema SHALL rechazar con 403 las solicitudes de usuarios `staff` a los endpoints de
administración (revisar pagos, reasignar equipos, configurar equipos) y SHALL permitir a ambos
roles los endpoints de campo, incluidos el check-in, el registro in situ y la consulta de
conteos de equipos.

#### Scenario: Staff intenta revisar un pago

- **WHEN** un usuario del grupo `staff` llama al endpoint de revisión de pagos
- **THEN** el sistema responde 403 con un mensaje de permiso denegado

#### Scenario: Staff intenta reasignar un equipo

- **WHEN** un usuario del grupo `staff` llama al endpoint de reasignación de equipos
- **THEN** el sistema responde 403 con un mensaje de permiso denegado

#### Scenario: Staff consulta los conteos de equipos

- **WHEN** un usuario del grupo `staff` llama al endpoint de conteos de equipos
- **THEN** el sistema permite la operación, porque los conteos son necesarios para elegir el
  equipo en la puerta