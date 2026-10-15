# Design

## Context

Ver `proposal.md` — Why. La tarjeta de confirmación vive una sola vez en `Checkin.tsx` (fuera del
ternario de modo, tras el cambio `arreglar-confirmacion-checkin-qr`) y comparte el estado
`confirmacion` y la acción `registrarLlegada` entre escaneo y búsqueda. La rama sin equipo de
`manejarLlegada` (`Checkin.tsx:296-298`) es hoy un registro silencioso sin equipo. El servidor
acepta `equipoColor` opcional en `checkInSchema` y conserva el equipo existente en reescaneos.

## Goals / Non-Goals

**Goals:**

- Que ningún camino del check-in registre una llegada sin equipo.
- Reducir la confirmación a "Asignar y registrar" y "Cancelar" con una sola implementación para
  ambos modos.

**Non-Goals:**

- No convertir la confirmación en un diálogo nativo ni rediseñar el layout.
- No tocar la lógica de elección de equipo ni el reparto equitativo.
- No cambiar el contrato del API (`checkInSchema` sigue con `equipoColor` opcional).

## Decisions

### Decisión 1: Quitar solo el botón "Registrar sin equipo" y conservar la confirmación

La tarjeta mantiene "Asignar y registrar" y "Cancelar". El texto de la tarjeta ya advierte que el
pago no está aprobado y que la banda se entrega igualmente, así que sigue sirviendo como
acknowledgement explícito antes de asignar equipo a un no pagado.

- **Por qué**: la confirmación conserva el valor de pausa consciente ante un pago no aprobado, y
  el cambio queda acotado a quitar una acción.
- **Alternativa considerada**: eliminar la confirmación y asignar automáticamente como con
  `pagado`. Se descarta porque pierde la pausa explícita y amplía el cambio más de lo pedido.

### Decisión 2: La rama sin equipo pasa a ser un error sin registro

En `manejarLlegada`, si `decidirEquipoParaLlegada` no devuelve equipo, en vez de
`registrarLlegada(resumen)` se muestra un mensaje de error y no se registra. El mensaje de éxito
"Sin equipo asignado" (`Checkin.tsx:286`) deja de ser alcanzable desde el flujo normal, pero se
conserva el parámetro opcional `equipoColor` de `registrarLlegada` para no ensanchar el cambio.

- **Por qué**: cierra la única vía restante de llegada sin equipo sin reescribir la firma de
  `registrarLlegada`. La rama es prácticamente inalcanzable (los 13 equipos están sembrados con 0
  localmente), pero el comportamiento debe ser seguro si ocurre.
- **Alternativa considerada**: reescribir `registrarLlegada` para exigir `equipoColor`. Se
  descarta por alcance: obligaría a tocar todas las llamadas y no aporta valor con la rama ya
  cubierta.

### Decisión 3: La restricción vive en el panel, no en el API

No se hace `equipoColor` obligatorio en `checkInSchema`.

- **Por qué**: el servidor debe seguir aceptando reescaneos y datos existentes sin equipo, y la
  política del evento es una regla de la mesa de check-in. Endurecer el API rompería
  compatibilidad con participantes ya guardados sin equipo.

## Risks / Trade-offs

- [El servidor aún acepta check-ins sin equipo si otra superficie los envía] → La única
  superficie que emite check-in es `apps/panel`; el client tipado no fuerza el campo. Aceptado
  como trade-off de compatibilidad.
- [El mensaje "Sin equipo asignado" queda como código muerto] → Se conserva a propósito; si se
  quiere limpiar, es un refactor posterior independiente.
- [Staff que antes usaba "Registrar sin equipo" ahora no encuentra la acción] → El flujo correcto
  es asignar; cancelar no registra, lo que evita llegadas incompletas.

## Migration Plan

Cambio puramente de frontend en `apps/panel`. Sin migración de datos ni despliegue especial;
rollback = revertir el commit.
