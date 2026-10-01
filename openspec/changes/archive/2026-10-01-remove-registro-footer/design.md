# Design

## Context

Ver `proposal.md` para la motivación. Lo relevante para el enfoque técnico:

`apps/registro/src/index.css` define un shell flex vertical con tres hijos:

```
.registro-shell        flex column, min-height: 100dvh
├── .registro-header   shrink-0, padding-top: env(safe-area-inset-top)
├── .registro-main     min-height: 0        → flex: 1 1 auto bajo 768px
└── .registro-footer   shrink-0, mt-auto, padding-bottom: env(safe-area-inset-bottom)
```

Bajo 768px el documento no scrollea (`.registro-shell { height: 100dvh; overflow: hidden }`) y `.registro-main` es el área desplazable. Encima de 768px el documento scrollea normal y el shell solo garantiza el alto mínimo.

El texto del footer es `NOMBRE_CONVENCION` + `" · "` + `"Inscripción en línea"`, las mismas dos cadenas del header en `App.tsx:346-347`. `NOMBRE_CONVENCION` también la usa el `<h1>` del header, así que la constante sobrevive al cambio.

`Container` e `InfoBlock` se importan desde `@convencion/ui`; `Container` sigue usándose en el header y en el `main`, así que su import no se toca. `InfoBlock` no aparece en este archivo.

## Goals / Non-Goals

**Goals:**
- Quitar el nodo `<footer>` y todo el CSS que solo le pertenecía.
- Que el inset inferior del dispositivo siga aplicándose, en el elemento que corresponde.
- Que la eliminación no requiera cambios en `apps/panel` ni en `@convencion/ui`.
- Que los pasos del asistente recuperen los ~80px que ocupaba el footer.

**Non-Goals:**
- No rediseñar el shell ni redistribuir `flex` más allá del inset. `mt-auto` desaparece con el footer y `main` no necesita `flex: 1 1 auto` en escritorio: el contenido se ancla arriba, que es el comportamiento actual de los pasos del asistente.
- No tocar `.registro-main--centrado` ni el camino de la pantalla de bienvenida. Ese shell ya corría sin footer.
- No agregar tests nuevos: el repo no tiene suite de pruebas de UI y `verify:design` no cubre el footer.

## Decisions

### El inset inferior se traslada a `.registro-main`, no a `.registro-shell`

El footer era el único elemento de `apps/registro` que aplicaba
`env(safe-area-inset-bottom, 0px)`. La decisión es dónde vive eso ahora.

**Opción elegida: `.registro-main { padding-bottom: env(safe-area-inset-bottom, 0px) }`.**

Bajo 768px `main` es el contenedor desplazable, así que el padding se convierte en
espacio al final del área scrolleable: el contenido pasa *por debajo* del inset y la
última fila de botones queda por encima del indicador de inicio. Además libera espacio
de viewport real en móvil, que es donde el diseño es más apretado.

Alternativas considered:

- **`.registro-shell { padding-bottom: ... }`.** El shell es `height: 100dvh` con
  `overflow: hidden` en móvil, así que el padding se comería altura de `main` en lugar de
  sumar espacio scrolleable. El contenido seguiría accesible, pero se perdería scroll real
  en el paso que ya no cabe. Peor opción.
- **Dejarlo en un elemento nuevo tipo spacer.** Reintroduce el nodo que se está quitando,
  sin contenido, solo por el inset. Contradice el objetivo.
- **No aplicar inset.** Deja la última fila de botones bajo el indicador de inicio en
  iPhone. Regresión táctil real, que es justo lo que el cambio no debe introducir.

### El contenido se relee en el delta, no en el spec principal

`openspec/specs/*/spec.md` no se edita durante el planeamiento: el cambio se expresa como
delta y el merge ocurre al archivar. Los escenarios modificados son MODIFIED con el
bloque completo, como requiere el flujo de deltas.

### `DESIGN_NOTES.md` se actualiza, el archivo archivado no

`DESIGN_NOTES.md:27` describe el footer como decisión vigente y `tasks.md` del cambio
archivado `2026-09-29-apply-design-system-19-convencion` documenta por qué se ocultó en
`bienvenida`. El archivo archivado es registro histórico inmutable: su tarea 14.14 sigue
siendo la razón por la que el footer *estaba* en esa pantalla. Lo que se actualiza es la
nota de diseño viva, que describe el estado actual del código, dejándole constancia de que
supersede el razonamiento anterior.

## Risks / Trade-offs

- **El inset inferior se pierde si el CSS se borra sin trasladar el `padding-bottom`** →
  La tarea de CSS y la de JSX van en el mismo commit, y la verificación visual de iPhone
  está en `tasks.md` como paso bloqueante, no como opcional.

- **El `padding-bottom` en `main` reduce el espacio visible en escritorio** →
  Solo aplica cuando el dispositivo reporta inset; en escritorio y en navegadores de
  escritorio `env()` resuelve a `0px`. En iPad y iPhone cambia el cálculo de
  `flex: 1 1 auto` bajo 768px a propósito.

- **Cambio de altura en viewports cortos** →
  Cada paso del asistente gana ~80px. La tabla de mediciones de `DESIGN_NOTES.md` cubre
  ocho viewports y hubo que actualizarse en el cambio anterior; este la invalida en
  altura. Se vuelve a medir.

- **Los escenarios de spec que decían "header y footer permanecen visibles" quedan
  falsos** →
  Los tres están cubiertos por deltas MODIFIED en `formulario-registro` y
  `design-system-layout`. Los specs no se archivan como correctos hasta que el cambio se
  implemente.

- **Impresión** →
  El footer era `no-print`, así que no cambia nada. La regla `@media print` que resetea
  `.registro-shell` y `.registro-main` a `height: auto` sigue aplicando; el
  `padding-bottom` se neutralize ahí solo si la medición lo muestra necesario.