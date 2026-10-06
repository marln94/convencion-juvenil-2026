# Design

## Context

El dashboard ya descarga todos los participantes en `todos` y solo usa ese arreglo para las
estadísticas; la lista renderizada sale de `resultados`, que el efecto de búsqueda vacía cuando el
filtro está en blanco (ver proposal.md - Why). El orden por fecha es imposible hoy porque
`aResumen()` (`services/api/src/repos/participantes.ts:73`) descarta `fechaRegistro`, aunque es la
sort key de la tabla DynamoDB.

Restricciones que condicionan el diseño:

- El panel es una PWA con uso en conectividad degradada: la vista ya funciona con datos de caché.
- Escala: hasta ~800 participantes; `cargarParticipantes` ya pagina todo el conjunto (500/página).
- La búsqueda por nombre es cliente-side sobre IndexedDB (decisión archivada en
  `2026-09-24-busqueda-participantes`); el API no tiene parámetro `q`.
- Existen 4 puntos que construyen `ResumenParticipante` a mano en el panel (Checkin, Pagos,
  RegistroInsitu, `cola.test.ts`) además del mapeo del repositorio.

## Goals / Non-Goals

**Goals:**

- Lista visible en el dashboard sin filtrar, acotada a 10 elementos, ordenada por `fechaRegistro`
  descendente, con label de "Últimos inscritos" + contador.
- Todas las coincidencias al filtrar por nombre, mismo criterio de orden.
- `fechaRegistro` disponible en cada `ResumenParticipante` para que cualquier vista pueda ordenar.

**Non-Goals:**

- Orden server-side, GSI nuevos, o cambios de contrato HTTP más allá del campo adicional.
- Virtualización / scroll infinito (10 filas no lo justifican).
- Cambiar el buscador de Checkin o Equipos, o limpiar el índice put-only de IndexedDB.

## Decisions

### D1. Orden en el cliente, extendiendo `ResumenParticipante`

Se agrega `fechaRegistro: string` (requerido) al DTO y se pobla en `aResumen()`, único mapeo del
repositorio que alimenta los tres listados (`listarParticipantes` con y sin filtro,
`listarIntegrantesDeEquipo`).

Alternativas descartadas:

- **GSI con clave de partición constante** para que el `Scan` sin filtros se vuelva `Query`
  ordenado: requiere cambio de infraestructura (CDK + backfill conceptual) para un orden que el
  cliente puede calcular con lo que ya descarga. Descartado por costo/beneficio.
- **Ordenar en el handler**: el `Scan` no garantiza orden y el handler tendría que paginar todo el
  conjunto para ordenarlo — exactamente el trabajo que el panel ya hace al consumir el listado.
- **Campo opcional** en el DTO: obligaría a guardas en cada consumidor y escondería errores de
  tipado. Es requerido porque el API siempre lo tiene; el sistema de tipos entonces obliga a
  actualizar los 4 constructores manuales del panel, que es lo que se quiere.

### D2. La lista por defecto sale de `todos`, no del índice

`ordenados` se deriva con `useMemo` de `todos` (ya en memoria tras `cargar()`): síncrono, sin estado
de carga extra y sin depender de la salud de IndexedDB. El efecto de búsqueda sigue usando
`buscarEnIndice` para el caso filtrado, que es donde el índice aporta (búsqueda local offline).

Alternativa descartada: `buscarEnIndice('')` en el caso vacío — consistente con `Equipos.tsx`, pero
agrega un estado de carga asíncrono para un dato que ya está en el estado, e incluye entradas
fantasma del índice put-only.

### D3. Guarda de obsolescencia en el efecto de búsqueda

Se mantiene el patrón efecto + `resultados` (la búsqueda es async sobre IndexedDB, un `useMemo` no
aplica) y se agrega un contador de solicitud: cada ejecución incrementa un id y solo aplica el
resultado si sigue siendo el más reciente. Resuelve el escenario "Búsquedas en ráfaga" del delta de
`panel` sin cancelación real de promesas.

### D4. Entradas del índice sin `fechaRegistro`

Al ser el campo requerido en el tipo, `agregarAlIndice()` fuerza a sus 4 llamantes a incluirlo:

| Llamante | Fuente del valor |
|---|---|
| `Checkin.tsx:13` (`aResumen`) | `participante.fechaRegistro` (detalle completo) |
| `Pagos.tsx:50` | `resultado.participante.fechaRegistro` |
| `RegistroInsitu.tsx:144` | `new Date().toISOString()` (ya se construye en la función) |
| `cola.test.ts:50` (fixture) | valor fijo de prueba |

Quedan fuera del alcance del tipo las entradas **ya persistidas** en IndexedDB de una versión
anterior: se ordenan con `fechaRegistro ?? ''`, lo que las ubica al final (se consideran más
antiguas). Se corregirán solas en el próximo `actualizarIndice()` tras una carga exitosa.

### D5. Render y labels

- `visibles = filtro.trim() ? resultados : ordenados.slice(0, 10)`.
- Encabezado `<h2>` con el mismo patrón visual que `Equipos.tsx:150`:
  - sin filtro → "Últimos inscritos" + `Mostrando los 10 más recientes de {todos.length}`;
  - con filtro → `"{resultados.length} coincidencias para «{filtro}»"` o "Sin coincidencias".
- El aviso "Sin coincidencias" deja de depender de la condición actual y pasa a depender de
  `resultados.length === 0` con filtro activo.
- El buscador permanece donde está, por encima de la lista, en ambos estados.

## Risks / Trade-offs

- **Caché vieja sin `fechaRegistro`** (SW `StaleWhileRevalidate` sobre `/inscripciones`) → el orden
  degrada a arbitrario hasta el primer refresco exitoso; no rompe render ni tipos en runtime porque
  el guard es `?? ''`. Sin acción: se resuelve con la primera petición fresca.
- **Entradas antiguas del índice ordenadas al final** → solo visible si hay un participante
  local-sin-sincronizar o fantasma; se autcorrige con `actualizarIndice`. Aceptado.
- **`slice(0, 10)` oculta participantes del medio** → es intencional (label lo comunica) y el
  buscador es el camino para llegar al resto. El contador con `todos.length` evita la percepción de
  lista incompleta.
- **Campo requerido rompe fixtures** → churn de tests esperado y acotado:
  `repos/participantes.test.ts` (expectativas `toEqual` en ~3 lugares), `generar-equipos.test.ts`
  (fixture tipado), `cola.test.ts` (fixture). El typecheck del monorepo los detecta todos.

## Migration Plan

Sin migración de datos: `fechaRegistro` ya existe en DynamoDB. Despliegue normal (API primero o en
paralelo; el campo es aditivo y los clientes viejos lo ignoran). Rollback = revert del deploy; el
cliente viejo no lee el campo.

## Open Questions

Ninguna abierta: el cap de 30 al filtrar se resolvió a favor de mostrar todas las coincidencias, y
el wording del label quedó confirmado ("Últimos inscritos" + "Mostrando los 10 más recientes de N").
