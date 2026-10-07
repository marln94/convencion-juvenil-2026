# Spec Delta

## MODIFIED Requirements

### Requirement: Registro in situ


El staff el día del evento SHALL poder registrar a un participante directamente en el lugar, sin comprobante de pago, marcando el pago como confirmado en el momento. Estos registros SHALL quedar identificados con `tipoRegistro = in_situ` y `estadoPago = pagado`. **El registro in situ TAMBIÉN requiere los campos extendidos obligatorios (localidad, region, edad, diasAsistencia, rol). El campo `contacto` es opcional también en in situ.**
Al finalizar el registro, el sistema SHALL asignarle un equipo con la misma regla que el check-in
(pago verificado, sin confirmación) y SHALL marcar la llegada (`checkIn = true`), porque la
persona está en el lugar; la pantalla de confirmación SHALL mostrar el equipo y el color de la
banda junto con el QR.

#### Scenario: Registro in situ exitoso
- **WHEN** se envía un registro con `tipoRegistro = in_situ`, **nombre, contacto opcional, correo opcional, localidad, region, diasAsistencia, rol**, sin comprobante
- **THEN** el sistema crea el participante con `estadoPago = pagado` y `tipoRegistro = in_situ`
- **AND** el sistema devuelve el `participantId` y el `codigoQr` para que el staff lo imprima o muestre en el gafete
- **AND** el participante incluye los campos extendidos con los valores enviados

#### Scenario: Registro in situ asigna equipo y registra la llegada
- **WHEN** se completa un registro in situ
- **THEN** el sistema le asigna un equipo con la regla de reparto equitativo
- **AND** el participante queda con `checkIn = true` y su `equipoColor` poblado
- **AND** la pantalla de confirmación muestra el equipo junto con el color de la banda y el QR

#### Scenario: Registro in situ sin conexión
- **WHEN** el staff completa un registro in situ sin conexión
- **THEN** el equipo se elige con los conteos locales, se muestra de inmediato y el registro y la
  asignación viajan juntos en la operación encolada
- **AND** al sincronizar el participante queda creado, asignado y con la llegada registrada

#### Scenario: Registro in situ sin campos extendidos
- **WHEN** se envía un registro con `tipoRegistro = in_situ` faltando alguno de: `localidad`, `region`, `edad`, `diasAsistencia`, `rol`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando el campo faltante

#### Scenario: Registro in situ sin equipo
- **WHEN** se envía un registro con `tipoRegistro = in_situ` sin `equipoColor`
- **THEN** el sistema rechaza la solicitud con un error 400 indicando que el equipo es obligatorio
  para el registro in situ
