# Design

## Context

La bandeja de pagos (`apps/panel/src/vistas/Pagos.tsx`) renderiza un `<Card>` por participante
con padding `var(--space-3)` (1.5rem), tres líneas de texto (nombre, fecha larga, correo) y una
fila de acciones separada por `mt-3`. Cada `.btn` tiene `min-height: 44px`, lo que da un pitch de
~180px por tarjeta y sólo 3-4 visibles en un laptop.

Datos relevantes ya disponibles:

- `BandejaPagosItem` trae `tieneComprobante` y `vistaComprobanteUrl` (`packages/shared-types/src/dtos.ts:77`),
  pero el código sólo mira el segundo; el `<a>` actual usa `href={url ?? '#'}` y `aria-disabled`,
  así que sin comprobante el clic navega a `#` en vez de estar deshabilitado.
- `motivoRechazo` ya se persiste en el participante (`services/api/src/repos/participantes.ts:264`)
  y `listarPorEstadoPago` devuelve `Participante[]` completo, pero no se copia al DTO de bandeja.
- El design system sólo tiene `primary` (rojo) y `outline` (tinta); `--color-accent` **es**
  `--color-red`, por eso el enlace "Comprobante" hoy es rojo.
- `.btn--sm` no reduce la altura (mantiene `min-height: 44px`): sólo baja fuente y padding
  horizontal. Sirve para ganar ancho, no alto.

Ver proposal.md para la motivación y los specs de `revision-pagos` y `design-system-components`
para el contrato de comportamiento.

## Goals / Non-Goals

**Goals:**

- Bajar el pitch por participante de ~180px a ~72px (≥8 filas visibles en laptop).
- Acción de comprobante visualmente neutra, con estado deshabilitado real y texto explícito.
- Exponer `motivoRechazo` en la bandeja sin romper consumidores existentes.

**Non-Goals:**

- Paginar o virtualizar la bandeja; cambiar la consulta/orden del GSI.
- Reutilizar la fila compacta en otras vistas (check-in, dashboard).
- Agregar pruebas de componentes React al panel.

## Decisions

**1. Fila única con `flex-wrap` en lugar de grilla o dos filas.**
Alternativas descartadas: layout A (2 filas, ~100px) sólo llega a ~6 visibles; grilla de 2
columnas duplica el ancho consumido sin bajar la altura por ítem y complica el wrap en móvil.
La fila única con `p-2` (16px) + botón de 44px + bordes da ~72px y, con `flex-wrap`, degrada a
2 líneas en tablet angosta sin encimar controles. El padding se override con una utility de
Tailwind (`p-2`): las utilities viven en `@layer utilities`, posterior a `@layer components`, así
que pisan `.card` sin tocar el design system.

**2. `<a>` habilitado y `<button disabled>` deshabilitado, condicionalmente.**
Alternativa descartada: `window.open()` desde un `<button>` pierde cmd/ctrl+clic y clic medio
para abrir en pestaña nueva, que es el flujo natural del admin (abrir comprobante y decidir
al lado). Se renderiza `<a class="btn btn--ghost" target="_blank" rel="noreferrer">` cuando
`tieneComprobante && vistaComprobanteUrl`, y `<button class="btn btn--ghost" disabled>` con el
texto "Sin comprobante" cuando no. El `disabled` nativo hereda `.btn:disabled` (opacity 0.5,
`cursor: not-allowed`, sin hover transform) y no es enfocable ni activable por teclado.
`tieneComprobante` es la fuente de verdad de existencia; la URL sólo decide si se puede abrir.

**3. Variante `ghost` en el design system, no un estilo local de Tailwind.**
Alternativas descartadas: `outline` (ya lo usa "Rechazar" → jerarquía confusa) y un estilo
arbitrario inline en `Pagos.tsx` (duplica lógica visual fuera del sistema y no es reutilizable).
`.btn--ghost` se define junto a `.btn--outline` en `components.css`: fondo transparente, texto
`--color-ink`, borde transparente, hover `background: var(--color-paper)` (papel sobre
paper-light es un gris sutil). Hereda `.btn:focus-visible` (outline rojo 3px) y `.btn:disabled`.
Sin `color-mix()`: Lightning CSS lo downlevel a un fallback opaco (ver `tokens.css:20-21`).
Al ser neutro y sin relleno, no compite con "Aprobar" (rojo) ni con "Rechazar" (outline).

**4. `size="sm"` en los tres botones de la fila.**
Gana ~20% de ancho por botón (padding 0.75rem, fuente 0.875rem) manteniendo
`min-height: 44px`, lo que permite que la fila completa quepa sin wrap hasta ~1100px de ancho.
La altura táctil exigida por `design-system-a11y` no se ve afectada. Si al revisar se ve
demasiado pequeño, volver a `default` es un cambio de una línea sin efectos en la densidad.

**5. `motivoRechazo` como campo opcional aditivo en el DTO.**
El handler ya tiene el `Participante` completo, así que el mapeo es una línea; el campo es
opcional, por lo que clientes viejos ignoran el dato y no hay break de contrato. En la UI se
muestra como línea `text-xs` bajo la fila **solo si existe**, de modo que únicamente los
rechazados con motivo ocupan dos líneas. Se usa `dateStyle: 'short', timeStyle: 'short'` para
la fecha (~120px menos que el `toLocaleString` actual con segundos).

**6. El formulario de rechazo inline se conserva.**
Sólo una tarjeta a la vez se expande (estado `rechazando` es único), el costo de alto es
temporal y local. Un modal agregaría foco/trap de teclado y código sin resolver un problema
real.

## Risks / Trade-offs

- [El correo desaparece de la vista] → Decisión explícita del usuario; el dato sigue en
  DynamoDB y en el item del DTO, disponible si se retoma en el futuro.
- [La fila envuelve en viewports entre 768px y ~1100px, duplicando el alto en esos anchos] →
  `size="sm"` reduce el ancho de los botones; el wrap es controlado (`flex-wrap`) y no encima
  controles. Densidad objetivo verificada en laptop ancho.
- [`.btn--ghost` es un cambio del paquete compartido `ui`] → Es aditivo: no altera `primary`
  ni `outline`, y `verify:design` sólo exige selectores presentes, no prohíbe nuevos.
- [El campo nuevo del DTO podría no llegar si la Lambda no se redespliega junto al frontend] →
  El campo es opcional y la UI lo trata como tal: sin él, simplemente no se muestra la línea.
- [No hay pruebas de componentes para la vista] → Cubierto por el test del handler (bandeja con
  y sin motivo/sin comprobante) más typecheck, build y `verify:design`; la validación visual es
  manual con `pnpm dev:panel`.

## Migration Plan

Cambio aditivo y desplegable en orden cualquiera: primero API (campo opcional), luego
design system, luego frontend. Rollback = revert del commit; no hay migración de datos
(`motivoRechazo` ya existe en la tabla).

## Open Questions

Ninguna abierta: formato de fecha, destino del correo, ubicación del motivo, tipo de control
deshabilitado y alcance (sin paginación) ya fueron decididos y quedan reflejados en los specs.
