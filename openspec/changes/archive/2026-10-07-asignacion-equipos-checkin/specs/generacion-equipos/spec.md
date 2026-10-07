# Spec Delta

## REMOVED Requirements

### Requirement: Generación aleatoria y balanceada de equipos

**Reason**: La asignación deja de ser por lotes desde el escritorio: ahora ocurre en el momento
en que cada asistente llega, con pago verificado automáticamente y con confirmación si el pago
está pendiente o rechazado.

**Migration**: Ver la capacidad `asignacion-equipos`, que cubre la asignación automática al
llegar, la confirmación para pagos pendientes y el reparto equitativo con desempate aleatorio.

### Requirement: Bloqueo de la asignación

**Reason**: Con asignaciones incrementales e idempotentes de a una, el bloqueo global ya no
protege nada: no hay un sorteo masivo que impedir ni una redistribución que congelar.

**Migration**: No requiere sustituto. La reasignación manual de un integrante es una operación
explícita de solo-admin descrita en `asignacion-equipos`.

### Requirement: Configuración de colores

**Reason**: Los 13 equipos ya tienen nombre y color hexadecimal fijados por la iglesia para
esta convención y no volverán a cambiar; la lista vive como valor por defecto en el sistema y
no se edita desde la interfaz.

**Migration**: Ver el requisito "Lista de equipos con nombre y color" en `asignacion-equipos`.
La ruta `POST /equipos/config` se conserva sin una vista que la use.

### Requirement: Consulta de equipos por color y por participante

**Reason**: Se reemplaza por la misma consulta referida a equipos con nombre propio, más los
conteos por equipo que alimentan el progreso de la vista de Equipos.

**Migration**: Ver el requisito "Consulta de la asignación y de los conteos" en
`asignacion-equipos`.
