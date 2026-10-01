# Tasks

## 0. Prerrequisito

- [x] 0.1 Construir `@convencion/shared-types` antes de cualquier `typecheck` o `test`: `pnpm --filter @convencion/shared-types build`. Los imports de valor resuelven contra `dist/`, que está gitignored; sin este paso el typecheck falla con "No matching export" o pasa contra constantes viejas

## 1. shared-types: fuente única del rango

- [x] 1.1 Crear `packages/shared-types/src/edad.ts` con `Rol`, `RangoEdad`, `EDAD_MINIMA = 15`, `EDAD_MAXIMA = 99`, `BANDA_EDAD_JOVEN = { min: 15, max: 30 }`, `RANGO_EDAD_ESTANDAR` y `rangoEdadPermitido(rol)`. La función es el criterio, no los objetos, para no repetir el ternario por rol en cuatro call sites
- [x] 1.2 Reexportar desde `packages/shared-types/src/index.ts` y reemplazar el union `'joven' | 'encargado' | 'nexo'` inline en `participante.ts:14` y `dtos.ts:12` por el tipo `Rol` importado
- [x] 1.3 Verificar con `pnpm --filter @convencion/shared-types build` que `dist/edad.js` contiene los exports de runtime

## 2. Backend: rango duro y banda por rol

- [x] 2.1 En `services/api/src/lib/validacion.ts`, reemplazar el `edadSchema` (líneas 52-56) por `z.number({ message }).int({ message }).min(15).max(99)` con `Edad no permitida` como mensaje único. Los cuatro necesitan mensaje propio: sin el de `z.number()` y `.int()`, un string o un decimal devuelven el texto en inglés de Zod, que `primerErrorLegible` pasa tal cual al 400
- [x] 2.2 Agregar la regla de `joven` en el `superRefine` existente, con guarda `edad >= EDAD_MINIMA && edad <= EDAD_MAXIMA` para no duplicar el mensaje cuando la edad ya falló el rango duro
- [x] 2.3 En `services/api/src/lib/validacion.test.ts`, agregar casos de borde: joven 15 y 30 aceptados, joven 31 y 14 rechazados, encargado 45 y nexo 99 aceptados, encargado 100 rechazado, decimal y no numérico rechazados, y un caso que fije que `joven` con 5 produce un solo issue. **Los tests de edad deben apoyarse sobre un fixture con `comprobante`**: el `base` existente es `online` sin comprobante y siempre falla, así que un test negativo sobre `base` pasaría por el motivo equivocado
- [x] 2.4 En `services/api/src/handlers/registro.test.ts`, invertir `acepta joven fuera de la banda sugerida` a rechazo con `edad: 32`, cambiar el test de edad no positiva a `edad: 14` y el de techo a `edad: 100`, y agregar aceptación de `encargado` con 45 y 99

## 3. Componente EdadField

- [x] 3.1 En `packages/ui/src/components/ui/EdadField.tsx`, cambiar los defaults a 15 y 99, renombrar `rangoSugerido` a `rangoPermitido` y reexportar `RangoEdad` desde `@convencion/shared-types` como tipo, sin volver `packages/ui` dependencia de runtime del paquete
- [x] 3.2 Exportar `edadEnRango(valor, rango)`, que devuelve `true` para el valor vacío: la obligatoriedad la reporta el formulario y un vacío no debe producir dos errores
- [x] 3.3 Quitar el aviso interno, el `⚠` y el estado `edad-field__hint--aviso`. El componente dibuja la banda y el caption; el error entra por la prop `error` que el formulario ya tenía, que es la vía por la que `siguientePaso` bloquea
- [x] 3.4 Cambiar `aPorcentaje` por `aFraccion`, que emite fracciones de 0 a 1 sin unidad, para que el CSS haga la conversión sobre el ancho útil
- [x] 3.5 Actualizar el copy del caption de "Rango típico" a "Rango permitido" y el barrel `packages/ui/src/components/ui/index.ts`

## 4. Estilos del control

- [x] 4.1 Declarar `--thumb: 1.5rem` en `.edad-field__track` y convertir `.edad-field__band` a `left: calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--banda-inicio, 0))` y `width: calc((100% - var(--thumb)) * (var(--banda-fin, 1) - var(--banda-inicio, 0)))`. Con la banda de joven arrancando en fracción 0, el inset de media unidad del range nativo se hacía visible
- [x] 4.2 Borrar la regla `.edad-field__hint--aviso`. El resto del bloque (borde 2px, thumb cuadrado, `:focus-within` a `--color-red-deep`) no cambia

## 5. Las dos apps

- [x] 5.1 En `apps/registro/src/App.tsx`, reemplazar las constantes locales por imports de `@convencion/shared-types`, y reducir `case 'edad'` a: vacío devuelve `La edad es obligatoria`, y si no, `edadEnRango(v, rangoEdadPermitido(datos.rol))` devuelve `Edad no permitida`
- [x] 5.2 Pasar `rangoPermitido={rangoEdadPermitido(datos.rol)}` en el `<EdadField>` del wizard, sin condicional, y `minimo`/`maximo` desde las constantes compartidas
- [x] 5.3 Agregar `validarTodosLosCampos()` y llamarla en `enviarRegistro` antes del POST, marcando todos los campos como tocados para que el error quede visible. `siguientePaso` solo valida el paso visible, así que cambiar el rol en un paso anterior dejaba la edad validada contra el rango viejo
- [x] 5.4 En `apps/panel/src/vistas/RegistroInsitu.tsx`, aplicar lo mismo en `validar()` y en el `<EdadField>`. `enviar()` ya corta con `validar()`, así que acá no hay gap que cerrar
- [x] 5.5 Mover `@convencion/shared-types` de `devDependencies` a `dependencies` en ambas apps y correr `pnpm install`: pasó a ser dependencia de runtime

## 6. Cola offline

- [x] 6.1 En `apps/panel/src/lib/cola.ts`, reemplazar el chequeo de 409 por `RESPUESTAS_DEFINITIVAS = new Set([400, 404, 409])`. El 404 entra por el caso de un checkin encolado contra un registro que el panel descartó; 401, 403, 429, 5xx y corte de red siguen deteniendo el bucle
- [x] 6.2 Agregar `descartar()`: borra de `cola`, borra del índice local si la operación era `registro_insitu`, y guarda en el store `descartadas` con `status`, `motivo` y `descartadaEn`. `RegistroInsitu` indexa al encolar sin esperar al servidor, así que sin esa limpieza queda un participante fantasma cuyo checkin vuelve a dar 404
- [x] 6.3 Agregar `eliminarDelIndice()` en `apps/panel/src/lib/indice.ts` y `contarDescartadas`, `listarDescartadas` y `limpiarDescartadas` en `cola.ts`
- [x] 6.4 Subir `VERSION_BASE_DATOS` a 2 en `persistencia.ts` con un `upgrade` condicional por versión, aditivo, más `reiniciarBaseDatos()` para poder aislar tests
- [x] 6.5 En `apps/panel/src/lib/sincronizacion.ts`, agregar `descartadas` a `EstadoRed`, a la instantánea y a `refrescarPendientes`
- [x] 6.6 En `apps/panel/src/App.tsx`, agregar un `Pill` rojo con el conteo de rechazadas en `IndicadorConexion`, con un `title` que indique que hay que registrarlos de nuevo. Sin esto el rechazo es invisible: la operación sale del contador de pendientes

## 7. Tests de la cola

- [x] 7.1 Agregar `vitest` y `fake-indexeddb` como devDependencies del panel, el script `test` y `apps/panel/vitest.config.ts`
- [x] 7.2 Cubrir la clasificación: 400 y 409 descartan y el loop sigue, 404 descarta sin tocar el índice, 500 y corte de red hacen `break` sin procesar las siguientes, 403 queda en cola, y una operación ya descartada no se reintenta
- [x] 7.3 Cubrir el descarte del índice local y el upgrade de v1 a v2 con datos reales, ejecutando el `upgrade` de producción en lugar de simularlo. Cada test limpia los tres stores en `beforeEach` porque la base es compartida dentro del archivo

## 8. Documentación

- [x] 8.1 Actualizar la entrada de `EdadField` en `DESIGN_NOTES.md`: track 15–99, banda por rol con carácter de límite, fracciones y ancho útil, y que los límites viven en `@convencion/shared-types`
- [x] 8.2 Reescribir los cinco delta specs, `design.md` con la decisión 2 revertida y el rationale verificado, y `proposal.md` sin la asimetría cliente/servidor

## 9. Verificación de integración

- [x] 9.1 `pnpm typecheck` en los siete workspaces sin errores
- [x] 9.2 `pnpm --filter @convencion/api test` verde, con los casos de borde de 2.3 y 2.4
- [x] 9.3 `pnpm --filter @convencion/panel test` verde, con los casos de 7.2 y 7.3
- [x] 9.4 `pnpm build:registro` y `pnpm build:panel` sin warnings de React
- [x] 9.5 `pnpm verify:design` pasa con el selector nuevo
- [x] 9.6 Recorrer ambos formularios en móvil a 390px y escritorio con teclado: la banda se alinea con el thumb en su extremo izquierdo, el error aparece fuera de rango y bloquea el avance, el foco es visible en ambos controles y no hay scroll horizontal
- [x] 9.7 En el panel, con el Network panel en offline: encolar un registro in situ con `joven`/`45` no debe llegar a `encolarOperacion`; encolar uno válido, volver a quitar la conexión, sincronizar y verificar que un 400 lo descarta, que aparece el `Pill` rojo, que el participante no aparece en la búsqueda de check-in, y que una operación válida posterior sí sincroniza
