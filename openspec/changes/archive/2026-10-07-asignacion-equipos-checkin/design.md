# Design

## Context

Estado actual relevante (motivación en proposal.md - Why; requisitos en specs/):

- La asignación actual es un sorteo por lotes (`POST /equipos/generar`) sobre los pagados, seguido
  de un bloqueo; la vista de Equipos muestra tarjetas por color usando palabras de color en
  español que ni siquiera son CSS válido (`backgroundColor: 'rojo'`).
- El check-in y el registro in situ operan tolerantes a desconexión: toda escritura se encola en
  IndexedDB (`cola.ts`) y se sincroniza cuando vuelve la señal; el `participantId` viaja en el QR.
- El índice local (IndexedDB) es un espejo completo de participantes, pero hoy solo se carga desde
  la vista Dashboard (admin) — un dispositivo staff nuevo queda sin datos para búsqueda ni
  conteos.
- No hay equipos generados en producción: cero datos que migrar. El valor de `equipoColor` pasa a
  ser el **nombre** del equipo, no una palabra de color.

## Goals / Non-Goals

**Goals:**
- Asignar equipo en el instante en que la persona llega, mostrando el color de la banda al staff
  sin esperar al servidor.
- Mantener el reparto equitativo (diferencia ≤ 1 entre mayor y menor) con asignaciones en línea,
  y acotado sin conexión.
- Un solo camino de escritura entre online y offline, reutilizando la cola existente.
- Cero cambios de infraestructura (GSI, tablas, CDK).

**Non-Goals:**
- No persistir conteos como estado en DynamoDB (ver decisión de conteos).
- No reasignar automáticamente a quien ya tiene equipo (la escritura condicional garantiza
  idempotencia, no rebalanceo).
- No mover la lógica de elección al servidor para todos los casos.

## Decisions

### D1. Identidad de un equipo = su nombre; el hex vive solo en el cliente

`equipoColor` guarda "Daniel", no "#FFD130". `shared-types` expone la lista canónica
`EQUIPOS: { nombre, hex }[]` (13) y helpers derivados; el backend deriva la lista por defecto de
nombres y el panel el mapa `nombre → hex`.

- **Por qué**: la GSI sigue sobre `equipoColor` (sin tocar infra), el CSV y la impresión quedan
  legibles por nombre, y ningún estado del servidor necesita el hex.
- **Alternativas descartadas**: guardar el hex (clave de GSI frágil, `#FFF` vs `#ffffff`);
  config con objetos `{nombre, hex}` en Dynamo (más superficie, y la lista no va a cambiar);
  duplicar la lista en panel y backend (riesgo de deriva).

### D2. Regla de equidad: mínimo conteo + desempate aleatorio

Cada asignación elige uniformemente al azar entre los equipos con el menor conteo actual. Con
asignaciones serializadas la diferencia queda en ≤ 1. Reutiliza `barajar` y
`crearGeneradorAleatorio` de `services/api/src/lib/sorteo.ts`, ya probados; el sorteo por lotes
(`sortearEquipos`) se elimina.

### D3. El cliente decide el equipo; el servidor valida y persiste

Todos los puntos de entrada (check-in, registro in situ, reasignación) eligen el equipo con la
misma regla; el servidor valida que el nombre pertenezca a la lista vigente (zod) y aplica con
escritura condicional `attribute_not_exists(equipoColor)` salvo reasignación (que sobrescribe).

- **Por qué**: el staff necesita el equipo y la banda en pantalla al instante, también offline;
  si el servidor decidiera, el cliente no tendría el resultado hasta sincronizar.
- **Alternativa descartada**: servidor decide siempre — no resuelve el offline ni el render
  inmediato; implicaba dos rutas de decisión en el cliente.

### D4. Conteos por consulta GSI, no por contadores

`GET /equipos/conteos` calcula los 13 conteos con consultas `Select=COUNT` sobre
`GSI-Equipo` (por `equipoColor`); el cliente online los usa para decidir. Sin estado: cero drift,
idempotencia trivial.

- **Alternativa descartada**: contadores atómicos (`ADD`) en el item `clave='equipos'` — cada
  camino de escritura tendría que mantenerlos, y un reintento torpe podría descontar de más.

### D5. Escrituras donde ya existen

- `POST /checkin` gana el campo opcional `equipoColor` y lo aplica **solo si** el participante
  no tiene equipo (misma UpdateItem que marca `checkIn`): una sola operación por llegada.
- `RegistrarParticipanteInput` gana el campo opcional `equipoColor`: el registro in situ lo
  aplica al crear, junto con `checkIn = true`.
- Nueva ruta admin `POST /equipos/asignar { participantId, equipoColor }` para reasignación
  manual (sobrescribe). El allow-list de `roles.ts` excluye a staff.
- La confirmación de pago pendiente/rechazado es decisión del cliente: si se omite, el payload
  del check-in simplemente no lleva `equipoColor`.

### D6. Cola offline sin nuevo tipo de operación

El tipo `checkin` ya existente transporta el equipo; el tipo `registro_insitu` transporta el
equipo y `checkIn`. `RESPUESTAS_DEFINITIVAS = {400, 404, 409}` ya trata "ya asignado" (409) y
"equipo inválido" (400) como definitivos y descarta la operación sin reintentos.

### D7. Índice local completo al iniciar sesión

`App` carga el índice con `cargarParticipantes()` al montar, para **todos** los roles (hoy solo
desde Dashboard). Habilita la búsqueda por nombre y los conteos offline en un dispositivo staff
nuevo y, tras sincronizar, actualiza los equipos desde el servidor.

### D8. Se elimina toda la cadena de generación por lotes

`POST /equipos/generar` y `/equipos/bloquear`, `reclamarGeneracion`/`bloquearEquipos`,
`GenerarEquiposOutput`/`BloquearEquiposOutput`, los métodos de `api-client`, el botón Generar y
los estados `bloqueado`/`fechaGeneracion`. `GET /equipos` y `POST /equipos/config` se conservan.

### D9. Presentación del color

Un helper `textoSobreColor(hex)` (luminancia WCAG, texto claro u oscuro) decide el color del
texto sobre cada fondo de equipo; `#FFFFFF` (Nehemías) lleva borde visible. El swatch usa el hex
real, no la palabra de color.

## Risks / Trade-offs

- [Equidad offline con varios dispositivos] → En línea la medida es exacta (conteos del
  servidor); sin conexión la elección usa conteos locales que pueden estar atrasados → diferencia
  acotada, y la regla de mínimo la recompone en la siguiente asignación en línea. Aceptado en
  spec (`asignacion-equipos`).
- [Conteos locales obsoletos en dispositivo online] → El cliente usa `GET /equipos/conteos`
  cuando hay red, no el índice; el índice solo decide offline.
- [Acentos en nombres dentro de la ruta `GET /equipos/:color` (José, María, Nehemías)] → Esa ruta
  no la consume la UI (usa `GET /equipos`); el percent-encoding del fetch cubre el caso. Se puede
  revisar al momento de implementar sin cambiar specs.
- [Race de reescaneo simultáneo en dos dispositivos] → La escritura condicional
  `attribute_not_exists` permite que solo uno gane; el otro recibe 409 y la cola descarta la
  operación duplicada.
- [Config `clave='equipos'` con una lista vieja escrita a mano en Dynamo] → Riesgo bajo (nunca
  hubo UI ni llamada a `/equipos/config`), pero se verifica pre-deploy: si existiera, se
  reemplaza por la lista nueva.
- [Reasignación manual rompe el ≤ 1 momentáneamente] → Mover a una persona deja un desvío de 2
  hasta que la regla de mínimo lo reequilibre. Ocurre solo por acción deliberada de un admin;
  aceptado.
- [Equipos con nombre + color: nombres únicos, sin slugs] → Un cambio futuro del nombre exigiría
  tocar la lista; es un default en código y la lista está fijada para esta convención.

## Migration Plan

1. **Pre-deploy (verificación)**: confirmar que no existe el item `clave='equipos'` en la tabla
   `Configuracion` y que ningún participante tiene `equipoColor` (no hay asignaciones a la fecha).
   Si apareciera, limpiarlo antes de desplegar.
2. **Orden de build/deploy**: `shared-types` → `api` (rutas nuevas y eliminadas juntas; no hay
   datos que migrar) → `panel` (apunta a las rutas nuevas) → sin cambios de infraestructura.
3. **Rollback**: revertir los commits; como no se reescriben valores heredados (solo se asigna de
   ahora en adelante), una vuelta atrás deja el sistema sin asignaciones y operativo con la
   mecánica vieja.
4. **Post-deploy**: vuelta corta de rutas nuevas (`GET /equipos/conteos`,
   `POST /equipos/asignar`) y del flujo de check-in con un pago verificado y uno pendiente.

## Open Questions

- La ruta `GET /equipos/:color` con nombres acentuados: si se decide exponerla a la UI en el
  futuro, evaluar slugificación. No consume decisiones de hoy.
- El escritorio de registro in situ, al mostrar el QR final, ¿debe ofrecer imprimir ya? Fuera de
  alcance; el flujo de impresión del gafete no cambia en este cambio.