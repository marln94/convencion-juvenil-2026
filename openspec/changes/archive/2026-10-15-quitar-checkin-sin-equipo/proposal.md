# Proposal

## Contexto

En el check-in del panel, cuando el staff registra la llegada de un participante con
`estadoPago = pendiente` o `estadoPago = rechazado` sin equipo, el sistema muestra una tarjeta de
confirmación con tres acciones: "Asignar y registrar", "Registrar sin equipo" y "Cancelar"
(`apps/panel/src/vistas/Checkin.tsx:357-363`). La opción "Registrar sin equipo" se añadió en la
propuesta original de asignación de equipos para permitir que el staff omitiera la asignación
cuando no pudiera decidir el equipo.

La operación del evento cambió: no se quiere que ningún participante llegue sin equipo. El
registro in situ ya lo impone (el equipo es obligatorio para `tipoRegistro = in_situ`,
`services/api/src/lib/validacion.ts:140-146`), pero el check-in con pago pendiente o rechazado
sigue siendo la única grieta por la que se puede marcar una llegada sin asignar equipo.

## Why

Un participante sin equipo no puede integrarse a las dinámicas del evento y desordena los
conteos del reparto equitativo. Mantener la opción "Registrar sin equipo" invita a un error
operativo en la puerta que luego exige corregir la asignación a mano. Cerrar esa vía hace que
toda llegada quede siempre en un equipo, igual que el registro in situ.

## What Changes

- **BREAKING** (de comportamiento): la tarjeta de confirmación para pagos pendientes o
  rechazados deja de ofrecer la acción "Registrar sin equipo". Quedan solo "Asignar y registrar"
  y "Cancelar".
- La confirmación se conserva como acknowledgement explícito de que el pago no está aprobado y de
  que la banda se entregará igualmente. Cancelar deja de significar "omitir la asignación": ahora
  significa no registrar la llegada.
- Ningún camino del check-in podrá registrar una llegada sin equipo. La rama defensiva que hoy
  registra sin equipo cuando `decidirEquipoParaLlegada` no devuelve un equipo
  (`Checkin.tsx:296-298`) pasa a mostrar un error y a no registrar.
- Se elimina el requisito y los escenarios de "omitir la asignación" de la especificación de
  asignación de equipos.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `asignacion-equipos`: el requisito "Confirmación para pagos pendientes o rechazados" deja de
  contemplar la omisión de la asignación; la confirmación queda con las acciones "Asignar y
  registrar" y "Cancelar", y ya no existe un escenario de llegada sin equipo por omisión.

## Non-goals

- No se cambia la regla de negocio de que el pago pendiente o rechazado no bloquea la llegada ni
  la entrega de la banda: el acceso sigue permitido y solo se exige asignar equipo.
- No se modifica la lógica de elección de equipo (`decidirEquipoParaLlegada`) ni el reparto
  equitativo.
- No se cambia el flujo de asignación automática cuando el pago está `pagado`.
- No se altera el registro in situ, que ya exige equipo.
- No se hace `equipoColor` obligatorio en `checkInSchema` (el servidor sigue aceptando
  check-ins sin equipo para no romper re-escaneos de datos existentes); la restricción se aplica
  en el panel.

## Impact

- `apps/panel/src/vistas/Checkin.tsx`: quitar el botón "Registrar sin equipo" de la tarjeta de
  confirmación y convertir la rama sin equipo en un error sin registro.
- `openspec/specs/asignacion-equipos/spec.md`: actualizar el requerimiento de confirmación y sus
  escenarios.
- Sin cambios en API, backend, tipos compartidos ni infraestructura.
