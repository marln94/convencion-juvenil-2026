# Proposal

## Contexto

El check-in del panel tiene dos modos de identificación: escanear el QR del gafete y buscar por
nombre. Cuando el participante identificado tiene el pago `pendiente` o `rechazado` y no tiene
equipo, el flujo debe pedir confirmación antes de asignarle un equipo, ofreciendo la opción de
asignar y registrar o registrar sin equipo.

En la implementación actual, la tarjeta de confirmación que contiene el botón "Asignar y
registrar" (`apps/panel/src/vistas/Checkin.tsx:356`) está anidada dentro de la rama de modo
búsqueda del ternario que empieza en `Checkin.tsx:335`. La lógica de confirmación
(`manejarLlegada` → `setConfirmacion`) sí se dispara en ambos modos, pero en modo escaneo la
rama que renderiza la tarjeta nunca se dibuja: el staff escanea el QR, toca "Registrar llegada"
y no aparece ninguna opción, como si el botón no hiciera nada.

## Why

El staff de mesa no puede asignar equipo a un participante con pago pendiente o rechazado cuando
trabaja con el QR, que es el modo principal en la puerta. Además, al no haber feedback, el botón
"Registrar llegada" se puede tocar repetidamente sin efecto aparente, lo que genera confusión y
frena el turno de entrada.

## What Changes

- La tarjeta de confirmación para pagos pendientes o rechazados SHALL renderizarse en ambos
  modos de check-in (escaneo QR y búsqueda por nombre), no solo en búsqueda.
- En modo escaneo, tras tocar "Registrar llegada" con pago no aprobado, el sistema SHALL mostrar
  la confirmación con las opciones "Asignar y registrar", "Registrar sin equipo" y "Cancelar".
- El comportamiento de la confirmación (asignar o registrar sin equipo) SHALL ser idéntico en
  ambos modos, ya que comparte el mismo estado y las mismas acciones.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `asignacion-equipos`: el requisito "Confirmación para pagos pendientes o rechazados" se
  explicita para exigir que la confirmación se presente en ambos modos de check-in (escaneo QR
  y búsqueda por nombre), con un escenario específico para el escaneo.

## Non-goals

- No se cambia la regla de negocio: el pago pendiente o rechazado sigue sin bloquear la llegada
  ni la entrega de la banda.
- No se modifica la lógica de elección de equipo (`decidirEquipoParaLlegada`) ni el reparto
  equitativo.
- No se cambia el flujo de asignación automática cuando el pago está `pagado`.
- No se rediseñan las vistas ni se reubican otros elementos del check-in.

## Impact

- `apps/panel/src/vistas/Checkin.tsx`: mover la tarjeta de confirmación fuera del ternario de
  modo para que sea común a escaneo y búsqueda, y ajustar el layout para que no desplace la
  cámara ni la ficha del participante.
- Sin cambios en API, backend, tipos compartidos ni infraestructura.
