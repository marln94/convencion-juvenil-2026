# Design

## Context

Restricciones reales del repo que condicionan el diseño:

- **No hay librería de formularios.** Los dos son `useState` + validación a mano: un `switch` por campo en `apps/registro/src/App.tsx` y una función plana `validar()` en `apps/panel/src/vistas/RegistroInsitu.tsx`.
- **`edad` es `string` en el estado del formulario y `number` en el DTO.** El `onChange` de `Input` emite `string`, así que `EdadField` también emite `string`.
- **`validacion.ts` ya tiene un `superRefine`** con las reglas cross-field (encargado, comprobante). La regla de edad por rol entra ahí, no en un `z.union` ni en un discriminated union.
- **`primerErrorLegible` toma `issues[0]`.** Importa para no duplicar el mismo mensaje con dos issues, porque la respuesta al usuario sería idéntica y el test de "un solo issue" lo fija.
- **El registro in situ funciona offline.** `sincronizarCola` corta el bucle ante cualquier error que no sea 409. Sin arreglar eso, endurecer el servidor convierte un 400 en un cuelgue permanente de la cola.
- **`VERSION_BASE_DATOS` tiene un `upgrade` que crea stores.** Subir la versión tiene que ser aditivo para no perder la cola ni el índice de quien ya usó el panel.
- **`packages/shared-types` es 100% `import type` hasta este cambio**, y está declarado en `devDependencies` en ambas apps. Este es el primer import de valor del repo desde ese paquete.

## Goals / Non-Goals

**Goals:**

- Que ninguna edad fuera del rango permitido de su rol llegue a persistirse, ni por UI ni por API.
- Que el cliente y el servidor compartan la definición del rango, no dos copias.
- Que la validación que bloquea en el wizard sea la misma que se muestra en el mensaje de la API.
- Que la validación del servidor no pueda dejar registros atascados en la cola offline.
- Cero dependencias de UI nuevas.

**Non-Goals:**

- Persistir el estado de fuera de rango.
- Cambiar el shape del payload o el DTO.
- Deduplicar `REGIONES` ni `DIAS_ASISTENCIA_OPTIONS`.
- Migrar o revalidar registros existentes.

## Decisions

### 1. El track va de 15 a 99, no del rango del rol

Si el track fuera 15–30 y el valor capturado fuera 45, el thumb quedaría clavado en 30 junto a un campo que dice 45: el control mostraría una posición que contradice el valor, que es la peor falla posible en un input.

El track abarca **el dominio duro completo**, 15 a 99. Entonces el thumb nunca puede mentir, y la banda del rol se dibuja encima como zona sombreada. Con la banda siendo ahora un límite de aceptación, que el thumb pueda *salirse* de la banda es información, no un defecto: señala que la edad capturada no va a pasar.

Con 15 como mínimo del track y de la banda de joven, la banda arranca en fracción 0. Un `<input type="range">` nativo no apoya el extremo en el borde del contenedor: reserva media unidad de thumb hacia adentro. Con porcentajes absolutos eso se veía como una banda desalineada del thumb en el extremo izquierdo.

### 2. Centralizar en `packages/shared-types` (decisión revertida)

La primera versión de este diseño descartó centralizar, con este argumento: el paquete es 100% `import type`, está en `devDependencies` en las apps, y un import de valor obligaría a tocar `build-lambdas.mjs`, los `vite.config.ts` y abrir la clase de bug de un `dist` viejo — seis puntos de infraestructura para deduplicar un literal de dos números.

**Ese argumento no resistió la verificación.** Probando esbuild con el mismo `absWorkingDir` en tmpdir que usa `build-lambdas.mjs`, el paquete resuelve bien y el bundle lo incorporate: el error que devuelve es *"No matching export"*, o sea que abrió `dist/index.js` e inspeccionó sus exports. La preocupación sobre PnP del comentario del script aplica a Yarn; el repo usa pnpm con symlinks.

El argumento que sí queda en pie es el del `dist` viejo, y es real: `dist/` está gitignored, así que un `dist` desactualizado hace que el typecheck pase con constantes viejas o falle con un export inexistente. Se maneja con dos medidas:

- `pnpm -r run build` respeta el orden topológico, así que `pnpm build` construye `shared-types` antes que las apps y la API.
- Para `typecheck` y `test` se construye `shared-types` explícitamente antes. No se agrega un `pretypecheck`: `pnpm -r run typecheck` no dispara hooks de dependencias, así que el hook no se ejecutaría igual.

El costo real no fue la infraestructura, fueron tres archivos de `package.json` y un `pnpm install`.

Y el argumento de fondo cambió por completo. Cuando la banda era consultiva, un desfase entre copias producía un cuelgue visible de la cola. Ahora produce un **400 que descarta un registro real**, invisible salvo por un contador. La diferencia entre "se traba algo" y "se pierde un participante" justifies la fuente única.

`edad.ts` exporta `Rol`, `RangoEdad`, `EDAD_MINIMA`, `EDAD_MAXIMA`, `BANDA_EDAD_JOVEN`, `RANGO_EDAD_ESTANDAR` y `rangoEdadPermitido(rol)`. La función es el criterio, no los objetos: llamarla evita el ternario `rol === 'joven' ? BANDA : ESTANDAR` repetido en cuatro call sites. El union `'joven' | 'encargado' | 'nexo'` estaba inline en `participante.ts` y `dtos.ts`; se extrajo a `Rol` porque `rangoEdadPermitido` necesita un tipo con nombre para ser usable por los tres paquetes.

### 3. La banda se posiciona con fracciones sobre el ancho útil

`--banda-inicio` y `--banda-fin` son **fracciones de 0 a 1**, sin unidad. El CSS las convierte a longitud:

```
left: calc(var(--thumb) / 2 + (100% - var(--thumb)) * var(--banda-inicio, 0));
width: calc((100% - var(--thumb)) * (var(--banda-fin, 1) - var(--banda-inicio, 0)));
```

El CSS sigue sin conocer 15 ni 30. Las fracciones documentan la geometría del range nativo: los extremos no están en el borde, están media unidad de thumb adentro.

### 4. El componente no valida

`EdadField` dibuja la banda y expone `edadEnRango(valor, rango)` como predicado compartido. No deriva un aviso propio, no calcula si el valor es aceptable.

La prop pasó de `rangoSugerido` a `rangoPermitido`, y el copy del caption de "Rango típico" a "Rango permitido".

El motivo es que el componente ya tenía la prop `error`, y todo el cableado de a11y que hace que un error bloquee (`aria-invalid`, `role="alert"`, `aria-describedby`) ya estaba construido sobre ella. Un camino paralelo para el aviso habría necesitado replicar ese cableado y una segunda fuente de verdad sobre si el formulario está bloqueado. Con este diseño, `EdadField` es presentacional y el formulario es el dueño de la decisión.

`edadEnRango` devuelve `true` para el valor vacío. La obligatoriedad la reporta el formulario con `La edad es obligatoria`, y un vacío no debe producir dos errores ni mezclarlos.

### 5. El servidor repite el rango, no solo el duro

`edadSchema` cubre 15–99 con `Edad no permitida` en `z.number()`, `.int()`, `.min()` y `.max()`. Los cuatro necesitan mensaje propio: sin el de `z.number()` y `.int()`, un `"mucha"` o un `25.5` devuelven el texto en inglés de Zod, que `primerErrorLegible` pasa tal cual al 400.

La regla de `joven` va en el `superRefine` existente, porque depende de `rol` y no puede vivir en el schema de `edad`. Lleva guarda: si la edad ya falló `.min`/`.max`, no agrega un segundo issue con el mismo mensaje. Sin la guarda, `edad: 5` con `rol: joven` produce dos issues idénticos; el mensaje al usuario sería el mismo, pero el test que fija un solo issue documenta la intención.

### 6. El envío final revalida todos los campos

`siguientePaso` valida el paso visible, así que un error de edad no deja avanzar. Pero `enviarRegistro` no pasa por ahí: solo chequeaba el comprobante y posteaba. El hueco real es cambiar el rol en el paso "Datos" y volver atrás sin regresar, dejando la edad validada contra el rango viejo.

Se agregó `validarTodosLosCampos()`, que corre el mismo `validarCampo` sobre la lista completa. Se marcan todos los campos como tocados para que el error quede visible y el usuario sepa qué corregir.

### 7. La cola clasifica respuestas, no solo si es 409

El `break` indiscriminado convertía cualquier error permanente en un cuelgue. Tres respuestas son definitivas, porque reintentar el mismo payload no puede cambiar el resultado:

- **400**: el servidor rechazó la validación. Reintentar da el mismo 400.
- **404**: el participante no existe. Típico de un checkin encolado contra un registro que el propio panel descartó.
- **409**: el servidor ya lo tiene. No hay nada que sincronizar.

Esas salen de la cola. El resto (401, 403, 429, 5xx, corte de red) detiene el bucle como antes: son transitorios, y 401/403 en particular los puede resolver una renovación de sesión.

Los descartes van a un store `descartadas` aparte, no se quedan en `cola`. Si vivieran en `cola`, el contador de pendientes mentiría y la sincronización volvería a chocar con ellas en cada intento.

**El descarte de un `registro_insitu` también borra la entrada del índice local.** `RegistroInsitu` indexa al participante en el momento del encolar, sin esperar al servidor. Si no se limpia, el staff ve un participante que el servidor nunca recibió, lo escanea, y ese checkin vuelve a fallar con 404 — el mismo cuelgue por otra puerta.

`VERSION_BASE_DATOS` sube de 1 a 2 con un `upgrade` aditivo y condicional por versión, para no romper la base de quien ya usó el panel.

### 8. Las descartadas se muestran en el indicador de conexión

Al salir de la cola, las operaciones rechazadas dejan de contar como pendientes. Sin un indicador propio, un registro rechazado sería invisible para el staff que lo capturó: el QR se mostró, y el participante nunca llegó al servidor. El indicador muestra el conteo con un `Pill` rojo y un `title` que explica que hay que registrarlos de nuevo.

### 9. El deslizante es nativo, sin librería

`<input type="range">` con `appearance: none`. Trae gratis el rol `slider`, el valor accesible, el teclado (flechas, Home, End, Page Up, Page Down) y el touch tracking.

*Alternativas:* Radix Slider o similar (dependencia nueva y a11y a cargo propio, contra la convención del repo); `appearance: auto` sin estilizar (no encaja con `--radius: 0` ni con el borde de 2px).

### 10. El foco del deslizante usa la familia de form controls

`design-system-a11y/spec.md` ya distingue tres familias: outline para botones y day cards, transición de borde para form controls, default del browser para navegación. El track lleva borde propio de 2px, así que entra en la segunda y transiciona a `--color-red-deep` con `:focus-within`, sin outline. `:focus-within` en lugar de `:focus-visible` porque el foco del range propaga al track contenedor.

### 11. El panel gana un runner de tests

`apps/panel` no tenía script `test`, así que la clasificación de errores de la cola — la lógica que tranca producción en silencio — no tenía forma de verificarse salvo a mano. Se agregan `vitest` y `fake-indexeddb` como devDependencies. Los tests cubren el `break` ante errores transitorios tanto como el descarte de los definitivos: el caso que importa es el primero, porque es el que protege contra reintroducir el cuelgue.

## Risks / Trade-offs

**Un `dist` viejo de `shared-types` rompe el build o, peor, pasa con constantes viejas** → Mitigado por el orden topológico de `pnpm build` y por construir el paquete explícitamente antes de `typecheck` y `test`. Anotado en `proposal.md` y en el bloque de verificación de `tasks.md`. Un hook `pretypecheck` no serviría: `pnpm -r run typecheck` no dispara hooks de dependencias.

**Una edad de joven de 32 en cola queda rechazada en vez de sincronizada** → Es el comportamiento pedido. La cola solo encola lo que la validación del cliente ya aceptó, así que solo afecta a payloads encolados por un build viejo del PWA, que es exactamente el caso que antes trancaba la cola.

**El track de 84 pasos hace la banda de joven una franja angosta** → Sigue siendo el mismo compromiso de antes: el campo numérico existe al lado para eso. Con la banda ahora siendo bloqueante, el usuario tiene además el mensaje de error ya señala el problema.

**Perder un participante es peor que no poder registrarlo** → Es el punto. Antes, el backend aceptaba 32 para un joven sin avisar; ahora el error es visible en el formulario y, si aun así llega a la cola, el conteo de rechazadas lo delata.

**`400` como definitivo descarta registros que podrían aceptarse después de un fix** → El store `descartadas` conserva el payload completo con el motivo, así que la decisión de reingresar es del staff y no se pierde el dato.

**`edad: 25.5` enviado desde un cliente viejo ahora da 400 en vez de un error genérico** → Correcto, y con mensaje en español.

## Migration Plan

Sin migración. DynamoDB es schemaless, `crearParticipante` escribe el objeto tal cual, y los registros existentes con edades fuera del rango nuevo no se revalidan ni se ven afectados. Endurecer el schema solo aplica a escrituras nuevas, y solo hay datos de prueba.

El upgrade de IndexedDB es aditivo: crea `descartadas` sin tocar `cola` ni `indice`.

Rollback: revertir el commit. No hay migración de infraestructura ni cambios en infra.

Verificación: `pnpm --filter @convencion/shared-types build`, `pnpm typecheck`, `pnpm --filter @convencion/api test`, `pnpm --filter @convencion/panel test`, `pnpm build:registro`, `pnpm build:panel`, `pnpm verify:design`.
