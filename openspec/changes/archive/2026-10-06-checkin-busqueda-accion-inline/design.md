# Design

## Context

Todo el cambio vive en `apps/panel/src/vistas/Checkin.tsx` (373 líneas). Ver `proposal.md`
para la motivación. Hechos que condicionan el diseño:

- El card de detalle (líneas 328-367) está renderizado **fuera** del ternario de modos, así
  que sirve tanto a la búsqueda como a la confirmación del escaneo QR.
- La fila de resultado es hoy un `<button>` completo con `onClick → setParticipante` (líneas
  290-309).
- `registrarLlegada` (líneas 222-236) hace `try/finally` sin `catch`; los fallos dejan una
  promesa rechazada sin manejo (`void registrarLlegada(...)` en la línea 356).
- La sincronización ya es tolerante por diseño: `sincronizarCola` atrapa sus errores
  (`cola.ts:109-116`), se reintenta en el evento `online` y al cargar la app
  (`sincronizacion.ts:48-51, 86`), y el header muestra "N sin sincronizar" / "N rechazadas"
  (`App.tsx:106-130`).
- No existe endpoint de deshacer check-in: `services/api/src/handlers/checkin.ts` solo marca
  `checkIn = true`.

## Goals / Non-Goals

**Goals:**

- Registrar la llegada desde la búsqueda en un solo click, sin abrir panel de detalle.
- Feedback inmediato en la fila (búsqueda) y en la ficha (escaneo).
- Distinguir fallo local (grave, visible) de fallo de sincronización (inocuo, silencioso).

**Non-Goals:**

- Deshacer check-in, cambios de API/tipos, filtrar resultados, tests de componentes (no hay
  infraestructura de rendering en `vistas/`).

## Decisions

1. **Acción inline en la fila (plan A) en lugar de hacer la fila entera clicable.**
   Sin endpoint de reversa, un tap accidental sería permanente; el botón explícito da una
   fricción mínima deliberada. Alternativas descartadas: fila entera como acción (riesgo de
   toque accidental sin deshacer) y botón full-width dentro de la fila (3× el alto por fila,
   lista de 20 resultados muy larga).

2. **La fila pasa de `<button>` a `<div>` con layout flex.** Anidar el botón "Registrar"
   dentro de un `<button>` sería HTML inválido. Columna izquierda: nombre, pills de pago y
   llegada, y el aviso de pago cuando `estadoPago !== 'pagado'`. Columna derecha: botón
   "Registrar" (solo si `!checkIn`); si ya llegó no hay acción y la marca "Llegó" vive en la
   columna izquierda. Botón con target táctil `min-h-11` (44px), `variant="primary"`.

3. **El card se gatea con `modo === 'escanear'` en lugar de eliminarse.** Es la única
   confirmación visible del flujo QR. `participante` deja de setearse desde la búsqueda; el
   `setParticipante` de `registrarLlegada` se vuelve condicional
   (`prev?.participantId === id`) para que un registro hecho desde la búsqueda no deje un
   card fantasma al volver a escanear.

4. **Separación de fases en `registrarLlegada`.** Fase local (`encolarOperacion` +
   `agregarAlIndice`) con `catch`: Alert de error y la fila **no** se voltea — no hay éxito
   parcial posible. Después del punto de no retorno se actualiza la UI (`setResultados` con
   `map` sobre `checkIn: true`, más `setParticipante` condicional) y la fase de
   `sincronizar()` va en un `try/catch` anidado vacío: su fallo no es un fallo del registro
   (queda en cola; el pill del header lo comunica). Alternativa descartada: un solo `catch`
   genérico — mezclaría fallos de storage con cortes de red y duplicaría el pill de
   sincronizaría, que ya existe.

5. **`procesando` (boolean global) → `procesandoId: string | null`.** Un solo estado cubre
   ambos modos: la fila/card cuyo `participantId` coincide muestra "Registrando…" y los
   demás quedan deshabilitados solo si está en curso otra operación (misma semántica que
   hoy con el flag global, pero señalando a quién).

6. **Alertas según modo y gravedad.** Éxito (`mensaje`) solo se renderiza en
   `modo === 'escanear'` (en la búsqueda el feedback es la fila). Error local se renderiza
   **debajo del input de búsqueda / de la ficha de escaneo**, no al final de la lista, para
   que sea visible sin hacer scroll.

7. **Copia nueva del aviso de pago, en ambos lugares** (fila y card):
   - pendiente: "Pago pendiente: se puede entregar banda pero el pago seguirá pendiente"
   - rechazado: "Pago rechazado: se puede entregar banda pero el pago seguirá rechazado"

## Risks / Trade-offs

- [Click accidental registra una llegada irreversible] → acción en botón explícito (no en la
  fila entera); sin deshacer es limitación aceptada y acordada (Non-goal).
- [Olvidar `setResultados` dejaría la fila desactualizada tras registrar] → es el feedback
  central del cambio; tarea 2 lo cubre de forma explícita y se verifica manualmente.
- [Aviso de pago largo en contenedor `max-w-md`] → se renderiza como línea propia debajo de
  los pills con wrap, no dentro de un pill.
- [Fase local falla y el usuario reintenta: ¿duplica la operación en cola?] → no: cada
  intento escribe una entrada nueva, pero `sincronizarCola` procesa en orden y el endpoint
  es idempotente (409 al repetir, tratado como definitivo en `cola.ts:35`).

## Migration Plan

Cambio solo de frontend estático: se despliega con el build normal del panel
(`pnpm deploy:apps`). Rollback = revertir el commit y redeployar; sin migraciones de datos.

## Open Questions

_(resuelto: label "Registrar" en la fila por el ancho `max-w-md`; la ficha de escaneo
conserva "Registrar llegada" con `fullWidth`.)_
