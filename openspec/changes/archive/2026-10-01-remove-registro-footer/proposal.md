# Proposal

## Contexto

`apps/registro/src/App.tsx` renderiza un `<footer>` con el texto
`Convención Juvenil 2026 · Inscripción en línea`. Son literalmente las mismas dos cadenas
que el `<header>` ya muestra, solo que concatenadas: el eyebrow `Inscripción en línea` y
el `<h1>` con el nombre del evento. El participante ve el mismo dato dos veces en cada
paso del asistente.

El footer no es un componente del design system. Vive solo en `apps/registro`, ocupa
~80px (`py-3` en móvil, `py-8` en escritorio) y `apps/panel` no tiene ninguno: su cromo
inferior es la barra de navegación. No existe un `Footer` exportado por `@convencion/ui`,
así que no hay otra app que mantener en sincronía ni una primitiva que este cambio pueda
dejar huérfana.

Lo que sí hace el footer, y es lo único no redundante, es portar el inset de safe area
inferior: `apps/registro/src/index.css` define `.registro-footer` con
`padding-bottom: env(safe-area-inset-bottom, 0px)`, y es el **único** lugar de
`apps/registro` que aplica el inset inferior. Sin él, el indicador de inicio del iPhone
queda sobre la última fila de los botones de acción del asistente.

Ya hubo un intento anterior de resolver la redundancia. La tarea 14.14 del cambio
archivado `2026-09-29-apply-design-system-19-convencion` decidió **ocultar** el footer en
la pantalla de bienvenida en vez de eliminarlo, y `DESIGN_NOTES.md:27` documenta esa
decisión junto con la medición que la justificaba. Este cambio da el paso que aquel no se
atrevió a dar: quitarlo de una vez.

## Why

El footer repite textualmente el header en cada paso del asistente, y los ~80px que
ocupa compiten con el contenido útil del formulario en viewports cortos, que es
justamente donde el diseño ya tightened antes para que la pantalla de bienvenida no
desbordara. Quitarlo devuelve esos 80px a cada paso del asistente.

## What Changes

- **BREAKING** Se elimina el `<footer>` de `apps/registro/src/App.tsx`, junto con la
  condición `paso !== 'bienvenida'` que lo condicionaba y con la constante de texto que
  solo él consumía parcialmente.
- Se traslada `padding-bottom: env(safe-area-inset-bottom, 0px)` de `.registro-footer` a
  `.registro-main`, que en móvil es el contenedor desplazable (`overflow-y: auto`), de modo
  que el contenido se desplace *por debajo* del inset en vez de quedar recortado por él.
- Se elimina la regla `.registro-footer` de `apps/registro/src/index.css`.
- Se actualizan los escenarios de `formulario-registro` y `design-system-layout` que
  prometen que "el header y el footer permanecen visibles", ya que pasan a ser falsos.
- Se actualiza `DESIGN_NOTES.md` para registrar la eliminación y dejar constancia de que
  supersede el razonamiento de la tarea 14.14.

No hay cambios de API, dependencias, tipos ni comportamiento del flujo de inscripción.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `formulario-registro`: el requisito de diseño responsive deja de exigir que el footer
  permanezca fuera del área desplazable y visible; el header sigue siendo el único cromo
  fijo del shell.
- `design-system-layout`: el escenario "Registration content scrolls inside the shell" y el
  de insets/printing dejan de hablar de footer. El segundo además precisa que el inset
  inferior lo aplica el área de contenido principal.

## Non-goals

- **No se introduce un `Footer` en `@convencion/ui`.** El cambio es una eliminación, no una
  promoción a componente compartido.
- **No se reescribe la pantalla de bienvenida.** El centrado en ambos ejes vía
  `.registro-main--centrado` y `margin-block: auto` ya funciona sin footer y no se toca.
- **No se rediseña el header.** Sigue siendo la única fuente del nombre del evento y del
  eyebrow "Inscripción en línea".
- **No se agregan links legales o de privacidad.** Hoy el footer no contiene contenido
  legal, así que quitarlo no pierde información. Si más adelante hacen falta, es un cambio
  aparte y deliberado.
- **No se toca `apps/panel`.** Su cromo inferior es la barra de navegación móvil y ya
  aplica su propio inset.

## Impact

| Área | Detalle |
| --- | --- |
| `apps/registro/src/App.tsx` | Se borran las líneas del `<footer>` y su gate `paso !== 'bienvenida'`. `Container` y `Fragment` se siguen usando en header y main, así que sus imports no cambian. |
| `apps/registro/src/index.css` | Se borra `.registro-footer`; `.registro-main` gana el `padding-bottom` con safe area. |
| `openspec/specs/formulario-registro/spec.md` | 2 escenarios y 1 frase de requisito a reescribir. |
| `openspec/specs/design-system-layout/spec.md` | 2 escenarios a reescribir. |
| `DESIGN_NOTES.md` | Línea 27 y la mención al footer en la tabla de verificación de centrado. |
| Verificación | `pnpm typecheck`, `pnpm --filter @convencion/registro build`, `pnpm verify:design`. `verify:design` no exige el footer, así que sigue pasando sin ajuste. |

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El inset inferior se pierde si se borra el footer sin tocar el CSS | `main` es el contenedor desplazable en móvil; el padding vive ahí y el contenido scrollea más allá del inset. |
| Los botones del último paso quedan bajo el indicador de inicio en iPhone | Verificación visual en un device con safe area, no solo en emulador de escritorio. |
| Cambio de altura en viewports cortos, donde el diseño ya se ajustó para no desbordar | Cada paso del asistente gana los ~80px del footer. Se re-miden las viewports de la tabla de `DESIGN_NOTES.md`. |
| Regresión de impresión | El footer ya era `no-print`, así que la impresión no cambia. La regla `@media print` de `.registro-shell` / `.registro-main` se toca solo para el inset. |