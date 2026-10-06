# Proposal

## Contexto

El panel de check-in (`apps/panel/src/vistas/Checkin.tsx`) tiene dos modos: escanear QR y
buscar por nombre. En el modo búsqueda, hacer click sobre un resultado abre un card de
detalle al final de la lista — después de todos los resultados — con la información del
participante y el botón "Registrar llegada". Ese patrón se siente lento y visualmente
descolocado: el staff busca, hace click, y tiene que mirar al fondo de la lista para
encontrar la acción.

Además, el estado de la fila no cambia hasta que se abre ese card, y la función
`registrarLlegada` usa un `try/finally` sin `catch`: si algo falla, la promesa se rechaza
sin manejo y el usuario no ve ningún mensaje (fallo mudo).

## Why

En la puerta del evento el flujo tiene que ser directo: ver quién llegó y registrar la
llegada de quien no ha llegado, sin pasos intermedios. El card de detalle al final de la
lista añade un click y una mirada hacia abajo que no aportan, y la acción debe estar
visible solo donde tiene sentido: en los participantes que aún no han llegado.

## What Changes

- En modo **buscar**: se elimina el card de detalle al final de la lista. Cada fila de
  resultado muestra directamente la acción — un botón "Registrar" alineado a la derecha —
  **solo** para participantes con `checkIn = false`. Quien ya llegó muestra la marca
  "Llegó" y su fila no tiene elementos clickeables.
- El aviso de estado de pago ("se puede entregar banda…") pasa a vivir **también** dentro
  de cada fila de resultado, con copia nueva:
  "Pago pendiente: se puede entregar banda pero el pago seguirá pendiente" (y análogo para
  pago rechazado).
- En modo **escanear**: el card de confirmación se conserva igual (es el resultado del
  escaneo QR), con la copia nueva del aviso de pago y usando el mismo estado de progreso
  por participante.
- El mensaje de éxito "Llegada registrada. ¡Bienvenido/a!" se muestra solo en modo
  escanear; en modo buscar el feedback es el cambio de la propia fila a "Llegó".
- `registrarLlegada` se reestructura en dos fases con manejo de errores separado: la fase
  local (encolar en IndexedDB + índice) tiene `catch` con Alert de error visible; la fase
  de sincronización con el servidor falla en silencio (queda en cola y el indicador
  "N sin sincronizar" del header ya lo comunica).
- La progreso pasa de un flag global (`procesando`) a `procesandoId`, para que solo la
  fila/botón en curso muestre "Registrando…".

## Non-goals

- No se agrega "deshacer check-in": el endpoint solo marca `checkIn = true` y no existe
  reversa; por eso la acción es un botón explícito y no un tap sobre la fila entera.
- No se modifica el backend, la API ni los tipos compartidos (`packages/shared-types`).
- No se toca el modo escaneo QR más allá de lo indicado (card conservado, copia del aviso,
  `procesandoId`).
- No se agrega filtrado de resultados (por ejemplo, ocultar ya llegados).
- No se introducen tests de componentes: no hay infraestructura de rendering para
  `apps/panel/src/vistas/` (solo `cola.test.ts` con vitest).
- No se modifica `openspec/specs/busqueda-participantes/spec.md`: la capacidad de encontrar
  participantes por nombre no cambia.

## Capabilities

### New Capabilities

_(ninguna)_

### Modified Capabilities

- `check-in`: cambia el requirement "Registro de llegada por búsqueda de nombre" (la
  acción queda inline en cada resultado, solo para quienes no han llegado, sin card de
  detalle) y se precisa el requirement "Estado de pago visible sin bloquear el acceso"
  (el aviso de banda se muestra en los resultados de búsqueda y en el card de escaneo).
  Agrega el requirement "Reporte del resultado del registro de llegada" (éxito, fallo
  local y fallo de sincronización como no-error).

## Impact

- **Código**: solo `apps/panel/src/vistas/Checkin.tsx` (filas de resultados, card de
  escaneo, estados `procesando`/`mensaje`, y la función `registrarLlegada`).
- **Specs**: delta sobre `openspec/specs/check-in/spec.md`.
- **Sin cambios**: API (`services/api`), `packages/shared-types`, `packages/api-client`,
  IndexedDB (`lib/cola.ts`, `lib/indice.ts`, `lib/sincronizacion.ts`) — la separación de
  fases solo reordena el manejo de errores en la vista.
