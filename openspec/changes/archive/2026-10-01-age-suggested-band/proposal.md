# Proposal

## Why

El campo de edad se endureció en dos iteraciones: primero con un techo de 120 años y una banda 15–30 **consultiva** para jóvenes; después, cuando se vio que la banda consultiva dejaba pasar edades imposibles, el rango pasó a ser un límite de aceptación. Este documento describe el estado final.

El problema de fondo: el rango real de la convención (jóvenes de 15 a 30) estaba codificado como sugerencia visual, y la validación del servidor solo miraba `int().positive()`. Un `joven` de 45 años pasaba por el formulario con un simple aviso ámbar y quedaba persistido. Al mismo tiempo, la edad es obligatoria para los tres roles, así que el rango por rol tiene que ser explícito en los dos formularios **y** en la API, o el registro in situ offline se convierte en un canal de datos inconsistentes.

`openspec/changes/archive/2026-09-24-add-registration-fields/design.md` había dejado la pregunta abierta: *"— ¿Límite superior para edad (ej. 120)? Dejar abierto, añadir si hay datos ruidosos."*. Los datos ruidosos llegaron, y el techo realista resultó ser 99.

## Contexto

La convención admite tres roles: `joven`, `encargado` y `nexo`. La edad se captura en los dos formularios (online en `apps/registro`, in situ en `apps/panel`) y es obligatoria para todos los roles.

`edad` es un campo *write-only*: no hay ni un solo `GET` que lo lea. No aparece en el dashboard, ni en equipos, ni en pagos, ni en check-in, ni en el gafete. Eso abre espacio para endurecer la validación sin riesgo de regresión en ningún consumidor.

El registro in situ del panel funciona offline: `encolarOperacion` guarda el payload en IndexedDB y `sincronizarCola` lo reintenta cuando vuelve la señal. Antes de este cambio, el bucle cortaba ante **cualquier** error que no fuera 409, así que un solo 400 — una operación con edad inválida encolada por un build viejo del PWA, o un `participantId` duplicado en otra forma — dejaba la operación y todas las siguientes atascadas para siempre. Endurecer la validación del lado del servidor sin arreglar la cola habría convertido un bug de validación en un incidente de disponibilidad.

## What Changes

- **La edad pasa a 15–99 para todos los roles**, con `Edad no permitida` como mensaje único para cualquier valor fuera de rango. El campo vacío conserva `La edad es obligatoria`: son dos condiciones distintas y el usuario necesita distinguirlas.
- **El rango es por rol**: `joven` acepta 15–30; `encargado` y `nexo` aceptan 15–99.
- **La API aplica el mismo rango**, con el mismo mensaje. El `superRefine` existente en `validacion.ts` ya era el lugar natural para la regla condicional por rol.
- **La banda deja de ser consultiva.** El componente ya no deriva un aviso propio: el error entra por la prop `error`, que el formulario ya tenía, y `siguientePaso` bloquea el avance por la misma vía que cualquier otro campo.
- **El botón de envío final del wizard revalida todos los campos.** `enviarRegistro` solo chequeaba el comprobante  y posteaba; cambiar el rol en un paso anterior podía dejar la edad fuera del rango nuevo.
- **El deslizante aparece para todos los roles**, con la banda del rango permitido de cada uno. Para `joven` la banda cubre el primer ~17.86% del track; para los demás roles cubre el track entero.
- **`rangoSugerido` pasa a llamarse `rangoPermitido`**, porque ahora es un límite y no una sugerencia.
- **Los límites se centralizan en `@convencion/shared-types`** (`edad.ts`), con `rangoEdadPermitido(rol)` como única fuente del criterio por rol. Ver decisión 2 de `design.md`.
- **La cola offline distingue respuestas definitivas de transitorias.** 400, 404 y 409 descartan la operación y la mueven a un store `descartadas`; todo lo demás detiene el bucle como antes. El descarte de un registro in situ también lo quita del índice local, para no dejar un participante fantasma.
- **El panel muestra cuántas operaciones fueron rechazadas**, porque al salir de la cola dejan de aparecer en el contador de pendientes y un registro perdido sería invisible.

## Non-goals

- **No hacer `edad` opcional ni ocultarla para `encargado` y `nexo`.** La edad de un adulto es un dato de censo que se quiere capturar.
- **No migrar registros existentes.** DynamoDB es schemaless, `crearParticipante` escribe el objeto tal cual, y los registros ya escritos no se revalidan. Solo hay datos de prueba.
- **No persistir la marca de fuera de rango** ni agregar atributos, GSIs o vistas de revisión.
- **No tocar el shape del payload** ni agregar campos nuevos.
- **No deduplicar `REGIONES` ni `DIAS_ASISTENCIA_OPTIONS`.** Siguen duplicados en las dos apps; son datos de catálogo, no reglas de validación, y no tienen el mismo costo de drift.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `campos-extendidos`: *Captura de edad* pasa a 15–99 con rango por rol y mensaje único; el requisito de banda sugerida se convierte en banda permitida y bloqueante.
- `registro`: los escenarios de edad validan el rango por rol; el escenario que fijaba que el backend aceptaba un joven fuera de banda se invierte a rechazo.
- `formulario-registro`: la banda pasa a ser bloqueante, el deslizante aparece para todos los roles, y se agrega el requisito de revalidación al enviar.
- `design-system-components`: nuevo requisito para `EdadField`, con banda posicionada sobre el ancho útil del track y sin aviso interno.
- `design-system-a11y`: una edad fuera de banda ahora marca `aria-invalid`, porque la banda dejó de ser consultiva.

## Impact

**Código nuevo**

- `packages/shared-types/src/edad.ts`
- `packages/ui/src/components/ui/EdadField.tsx`
- `apps/panel/vitest.config.ts`, `apps/panel/src/lib/cola.test.ts`

**Código modificado**

- `packages/shared-types/src/{index,participante,dtos}.ts` (export de `edad`, union `Rol` extraído)
- `packages/ui/src/components/ui/index.ts`, `packages/ui/src/styles/components.css`
- `services/api/src/lib/validacion.ts`, `validacion.test.ts`, `handlers/registro.test.ts`
- `apps/registro/src/App.tsx`, `apps/panel/src/vistas/RegistroInsitu.tsx`
- `apps/panel/src/lib/{cola,indice,persistencia,sincronizacion}.ts`, `apps/panel/src/App.tsx`
- `apps/{registro,panel}/package.json` (shared-types a `dependencies`, script `test` en panel)
- `DESIGN_NOTES.md`, `scripts/verify-design-system.mjs`

**Sin cambios:** `packages/api-client/*`, `infra/cdk/*`, `services/api/src/repos/participantes.ts`.

**Dependencias nuevas:** `vitest` y `fake-indexeddb` como devDependencies del panel, para poder testear la clasificación de errores de la cola sin IndexedDB real. El deslizante sigue siendo `<input type="range">` nativo.

**Verificación:** `pnpm --filter @convencion/shared-types build` (los imports de valor resuelven contra `dist`), `pnpm typecheck`, `pnpm --filter @convencion/api test`, `pnpm --filter @convencion/panel test`, ambos builds, `pnpm verify:design`.
