# Asignacion-equipos

## Purpose

Divide a los asistentes en los 13 equipos del evento —cada uno con un nombre propio y un color
hexadecimal— en el momento en que llegan: automático con pago verificado, con confirmación si el
pago está pendiente o rechazado, manteniendo el reparto equitativo y permitiendo la reasignación
manual por administración.

## Requirements

### Requirement: Asignación automática al llegar con pago verificado

El sistema SHALL asignar un equipo automáticamente a todo participante que llega con
`estadoPago = pagado` y sin equipo asignado, sin pedir confirmación, y SHALL mostrar el equipo
asignado junto con el color de la banda. El sistema SHALL aplicar el equipo recibido únicamente
cuando el participante aún no tiene uno: un reescaneo o una relectura del check-in SHALL NO
reasignar ni sobrescribir el equipo existente.

#### Scenario: Llegada de un participante con pago verificado

- **WHEN** se escanea o se busca a un participante con `estadoPago = pagado` que no tiene equipo
- **THEN** el sistema le asigna un equipo sin pedir confirmación
- **AND** la ficha muestra el nombre del equipo y el color de la banda

#### Scenario: Reescaneo de un participante ya asignado

- **WHEN** se vuelve a escanear a un participante que ya tiene equipo
- **THEN** el sistema conserva el equipo original y lo muestra
- **AND** no se cuenta dos veces el integrante en su equipo

#### Scenario: Participante con equipo asignado en el registro in situ

- **WHEN** se escanea a un participante que recibió su equipo al registrarse in situ
- **THEN** el sistema muestra ese mismo equipo sin ofrecer reasignación

### Requirement: Confirmación para pagos pendientes o rechazados

El sistema SHALL pedir confirmación explícita antes de asignar equipo a un participante con
`estadoPago` distinto de `pagado`, y SHALL registrar la llegada en ambos casos, sin bloquear el
acceso ni la entrega de la banda. Si el staff omite la asignación, el participante SHALL quedar
sin equipo y la interfaz SHALL indicarlo de forma explícita para que la omisión no pase
desapercibida.

#### Scenario: Pago pendiente confirmado

- **WHEN** se identifica a un participante con `estadoPago = pendiente` sin equipo y el staff
  confirma que desea asignarlo
- **THEN** el sistema asigna el equipo y registra la llegada

#### Scenario: Pago pendiente omitido

- **WHEN** el staff declina la asignación de un participante con pago pendiente o rechazado
- **THEN** el sistema registra la llegada igualmente
- **AND** la ficha indica explícitamente que el participante queda sin equipo

#### Scenario: Rechazo sin bloqueo

- **WHEN** un participante con `estadoPago = rechazado` llega al evento
- **THEN** el sistema no bloquea su registro de llegada por el estado del pago

### Requirement: Reparto equitativo con desempate aleatorio

En cada asignación el sistema SHALL elegir únicamente entre los equipos con el menor número de
integrantes en ese momento y SHALL desempatar aleatoriamente entre ellos. Consecuencia: con
asignaciones en línea, la diferencia entre el equipo con más integrantes y el con menos SHALL
ser como máximo 1. El sistema SHALL usar la misma lista de 13 equipos para todos los eventos de
asignación (llegada y registro in situ).

#### Scenario: Primeros asistentes se reparten entre equipos

- **WHEN** llegan los primeros asistentes con pago verificado
- **THEN** cada uno cae en un equipo distinto hasta completar los 13 antes de que alguno reciba
  un segundo integrante

#### Scenario: Reparto equitativo sostenido

- **WHEN** se asignan 800 participantes de forma consecutiva con conexión
- **THEN** ningún equipo excede en más de 1 integrante al equipo con menos

#### Scenario: Desempate aleatorio

- **WHEN** hay varios equipos empatados en el mínimo de integrantes
- **THEN** la elección entre ellos es aleatoria, sin orden fijo de prioridad

### Requirement: Reasignación manual por administración

El sistema SHALL permitir a un usuario `admin` mover a un participante de un equipo a otro desde
la vista de equipos, sobrescribiendo la asignación anterior, y SHALL reflejar el cambio de
conteos en la consulta de equipos. El sistema SHALL rechazar con 403 la reasignación solicitada
por un usuario `staff`.

#### Scenario: Admin mueve a un participante

- **WHEN** un admin asigna manualmente a un participante a un equipo distinto al suyo
- **THEN** el participante queda en el nuevo equipo
- **AND** los conteos de ambos equipos se actualizan

#### Scenario: Staff intenta reasignar

- **WHEN** un usuario `staff` solicita reasignar a un participante a otro equipo
- **THEN** el sistema responde 403 con un mensaje de permiso denegado

### Requirement: Lista de equipos con nombre y color

El sistema SHALL identificar a cada uno de los 13 equipos por un nombre y un color hexadecimal,
SHALL usar la lista por defecto definida en el sistema cuando no exista configuración
guardada y SHALL usar la configuración guardada cuando exista. Los nombres de los equipos de
esta convención son Daniel, Timoteo, José, Abel, David, Rut, Mardoqueo, Pedro, Mathias, María,
Josué, Caleb y Nehemías.

#### Scenario: Uso de la lista por defecto

- **WHEN** no existe configuración de equipos guardada
- **THEN** el sistema usa los 13 equipos por defecto con sus nombres y colores

#### Scenario: Configuración guardada

- **WHEN** existe una configuración de equipos guardada
- **THEN** el sistema usa esa lista en lugar de la por defecto

### Requirement: Consulta de la asignación y de los conteos

El sistema SHALL devolver la asignación completa (participante → equipo), la lista de integrantes
de cada equipo y los conteos por equipo, para que el panel muestre el progreso, imprima o exporte.

#### Scenario: Ver integrantes de un equipo

- **WHEN** se consulta la lista de integrantes de un equipo
- **THEN** el sistema devuelve los participantes asignados a ese equipo con sus datos

#### Scenario: Ver la asignación completa con conteos

- **WHEN** se consulta la asignación de equipos
- **THEN** el sistema devuelve el mapa participante → equipo, el agrupado por equipo y los
  conteos de cada uno

### Requirement: Asignación con conexión degradada

El sistema SHALL permitir asignar equipo durante el check-in y el registro in situ sin conexión:
el equipo elegido localmente SHALL viajar con la operación encolada y SHALL aplicarse al
sincronizar. Sin conexión, la elección se basará en los conteos del índice local; con conexión,
se basará en los conteos del servidor. En ningún caso la operación encolada podrá aplicar un
equipo que no pertenezca a la lista de equipos vigente.

#### Scenario: Check-in sin conexión

- **WHEN** el staff registra la llegada de un participante sin conexión y confirma la asignación
- **THEN** el equipo se elige con los conteos locales, se muestra de inmediato y la operación
  queda en la cola local
- **AND** al sincronizar el servidor aplica el equipo encolado

#### Scenario: Equipo inválido en la cola

- **WHEN** una operación encolada trae un equipo que no está en la lista vigente
- **THEN** el sistema la rechaza con un error 400 y la operación se descarta de la cola