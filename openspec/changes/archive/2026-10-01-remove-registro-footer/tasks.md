# Tasks

## 1. CSS: mover el inset inferior al área de contenido

- [x] 1.1 Borrar la regla `.registro-footer` de `apps/registro/src/index.css` (líneas 61-63) y trasladar su `padding-bottom: env(safe-area-inset-bottom, 0px)` a `.registro-main`, con un comentario que explique que `main` es el contenedor desplazable bajo 768px y que el inset va ahí para que el contenido pase por debajo en vez de quedar recortado. Verificar que no queda ninguna referencia a `registro-footer` en el repo salvo las menciones históricas en `openspec/changes/archive/`.

- [x] 1.2 Revisar la regla `@media print` de `apps/registro/src/index.css` y neutralizar el `padding-bottom` del inset solo si al imprimir el documento recuperara espacio vacío al final. Verificar que la pantalla de confirmación sigue imprimiendo sin contenido recortado.

## 2. JSX: eliminar el nodo footer

- [x] 2.1 Borrar el bloque `<footer className="registro-footer no-print mt-auto shrink-0">` y su contenido de `apps/registro/src/App.tsx` (líneas 594-602), incluyendo la condición `paso !== 'bienvenida'` que lo envolvía. Verificar con grep que `footer` ya no aparece en `apps/registro/src/App.tsx`.

- [x] 2.2 Confirmar que `NOMBRE_CONVENCION` sigue en uso por el `<h1>` del header y que los imports de `Container` y `Fragment` siguen siendo necesarios. Verificar con `pnpm --filter @convencion/registro build` que no hay referencias sin usar ni errores de tipo.

## 3. Verificación funcional

- [x] 3.1 Ejecutar `pnpm typecheck`, `pnpm --filter @convencion/registro build` y `pnpm verify:design`. Verificar que los tres pasan; `verify:design` no exige el selector del footer, así que debe seguir verde sin ajuste.

- [x] 3.2 Recorrer el asistente completo en un viewport de escritorio (1440×813 y 1920×993): bienvenida y los cinco pasos. Verificar que no aparece el texto "Convención Juvenil 2026 · Inscripción en línea" en ningún paso y que el header lo muestra una sola vez.

- [x] 3.3 Verificar en un dispositivo con safe area (iPhone, portrait) que los botones del último paso —Volver / Completar inscripción— quedan por encima del indicador de inicio y son alcanzables sin scroll adicional. Este paso es bloqueante: si el inset no está aplicando, el paso 1.1 está mal.

- [x] 3.4 Verificar bajo 768px que el documento no scrollea, que solo `main` scrollea cuando un paso no cabe, y que el header sigue fijo. Confirmar que el paso más alto (el de comprobante, con el dropzone de archivo) sigue siendo alcanzable de punta a punta.

- [x] 3.5 Confirmar que la pantalla de bienvenida conserva su centrado en ambos ejes y no cambió de posición, ya que su camino nunca renderizó el footer.

- [x] 3.6 Imprimir la pantalla de confirmación. Verificar que recupera el flujo normal del documento y que no queda contenido recortado por el shell de altura fija.

## 4. Documentación

- [x] 4.1 Actualizar `DESIGN_NOTES.md`: reemplazar la línea 27 que describe el footer como decisión vigente por una nota que registre que el footer se eliminó, que el inset inferior vive ahora en `.registro-main`, y que esto supersede el razonamiento de la tarea 14.14 del cambio archivado `2026-09-29-apply-design-system-19-convencion`.

- [x] 4.2 Corregir la mención al footer en la tabla de verificación de centrado de `DESIGN_NOTES.md` (la que dice que "el indicador de pasos y el footer siguen presentes") y re-medir las viewports de la tabla, ya que cada paso del asistente gana ~80px. Verificar que los ocho anchos siguen sin scroll de documento y que el CTA de bienvenida sigue arriba del fold.