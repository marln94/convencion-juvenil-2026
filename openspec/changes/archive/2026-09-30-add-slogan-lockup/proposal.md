# Proposal

## Why

La pantalla de bienvenida del formulario y la pantalla de login del panel muestran hoy un
lockup provisional: el texto "MUY PRONTO" compuesto con `.t-outline` + `.t-solid` y, debajo,
el símbolo ≠ dibujado por el `MarkNeq` de fallback. Es un placeholder tipográfico que no es
el eslogan de la Convención y duplica una composición tipográfica que ya sabemos que no escala.

El diseñador entregó el arte final: el eslogan "Atrévete a ser diferente" con el símbolo ≠
integrados en un solo lockup, en PNG con canal alfa. Eso reemplaza las dos piezas a la vez,
simplifica la pantalla y de paso resuelve el desborde de viewport corto que
`DESIGN_NOTES.md` tiene registrado como pendiente abierto desde el change anterior.

## Context

- `apps/registro/src/App.tsx:321-338` — paso `bienvenida`: `<div className="stack" role="img"
  aria-label="Muy pronto">` con dos spans, más `<MarkNeq size="hero">` a `w-40 sm:w-56`.
- `apps/panel/src/App.tsx:64-71` — login: `<MarkNeq>` a `w-20` más `<h1 className="t-solid
  text-3xl">Panel</h1>` y un `.t-eyebrow` con el nombre de la convención.
- El `MarkNeq` de `packages/ui/src/components/decorative/MarkNeq.tsx` es el fallback en SVG
  con `feTurbulence`, producido por la decisión 3 de `apply-design-system-19-convencion`
  ("CSS-First Fallbacks, Swap Real Assets Later"). Este es el primer asset real que llega.
- El desborde pendiente: a 1366×768 la página de bienvenida mide 770px contra 681px de
  viewport y el CTA "Comenzar inscripción" queda 41px bajo el fold
  (`DESIGN_NOTES.md`, "Pendientes conocidos").

Datos medidos sobre el asset entregado (`4xconvencion-eslogan.png`, 4989×2000, RGBA):

- 75.9% del canvas es totalmente transparente, 23.6% opaco, 0.5% anti-alias. El fondo es
  transparente de verdad, no un header que miente.
- Tinta: 61.3% `#000000` y 0.9% `#D70202`. Dos tintas, 11.808 colores distintos en total; el
  top 8 cubre 71.9%.
- El archivo es 1.570 KB porque guarda antialiasing de 8 bits por canal en un canvas de 32
  bits donde casi todo está vacío.
- El `@4x` no es 4× del PNG de 845×323 (que habría sido 3380×1292): es el mismo arte con
  1.1% de padding a la izquierda, 1.3% a la derecha, 5.0% arriba y 1.6% abajo. El ratio del
  artwork opaco es 2.6060, casi idéntico al 2.6161 del PNG de 845px.

## Non-goals

- No se cambia el copy, el flujo ni los pasos del formulario. `paso === 'bienvenida'` sigue
  siendo el primer paso y el CTA sigue arrancando el wizard.
- No se implementa dark mode. El lockup raster es light-only; `.theme-dark` sigue sin
  aplicarse en ninguna app.
- No se reemplazan los demás fallbacks decorativos (brushes, organic lines, map pin, textura
  de papel). Solo el ≠ del hero y el texto del lockup.
- No se toca `MarkNeq`. Sigue siendo el símbolo en el header del panel; solo deja de ser el
  componente del hero de bienvenida. El favicon pasa a servirse desde el set de iconos
  entregado (PNG por tamaño + `.ico` multi-tamaño + apple-touch + Android maskable), que ya
  no depende de `MarkNeq`.
- No se reescribe el copy del header, del footer ni de la confirmación.
- No se agrega el eslogan a vistas internas del panel (dashboard, pagos, check-in).

## What Changes

- Se agrega `SloganLockup` a `packages/ui/src/components/decorative/` como componente
  compartido: renderiza el eslogan y el ≠ desde un único PNG con alfa, expone el nombre
  accesible del eslogan y reserva las dimensiones intrínsecas para evitar CLS.
- Se agrega el asset a `packages/ui/src/assets/` como copia única, con un export wildcard
  nuevo en `packages/ui/package.json`.
- La pantalla de bienvenida del registro pasa a renderizar `SloganLockup` y elimina el
  `.stack` tipográfico y el `MarkNeq size="hero"`.
- El login del panel pasa a renderizar `SloganLockup` y elimina el `MarkNeq` y el `<h1>Panel`
  de la tarjeta.
- El paso de conversión del asset a WebP y el recorte a 1664px se documentan como paso
  reproducible, no como archivo generado a mano.
- `apps/panel/vite.config.ts` suma `webp` a `globPatterns` de Workbox para que el logo entre
  en el precache del PWA y el login funcione sin conexión.
- `verify:design` gana `.slogan-lockup` en `requiredSelectors`.
- `DESIGN_NOTES.md` se actualiza: el lockup, el carácter light-only del asset, el desborde
  de viewport corto como pendiente cerrado y el asset de eslogan como entregado.

Ningún cambio es **BREAKING**: no se toca ninguna API, DTO, endpoint ni contrato de datos.

## Capabilities

### New Capabilities

Ninguna. El componente vive dentro de las capacidades de design system que ya introduce
`apply-design-system-19-convencion` (`design-system-decorative`); este change solo las
extiende y no abre un árbol nuevo.

### Modified Capabilities

- `design-system-decorative`: se agrega el requisito del componente `SloganLockup` y se
  modifica el de `MarkNeq` para que deje de ser el símbolo del hero de bienvenida.
- `formulario-registro`: el paso `bienvenida` muestra el lockup de eslogan con nombre
  accesible propio en lugar del "MUY PRONTO" tipográfico.
- `panel`: la pantalla de login muestra el lockup de eslogan en lugar del `MarkNeq` y el
  título "Panel".

## Impact

- **Código nuevo**: `packages/ui/src/components/decorative/SloganLockup.tsx`,
  `packages/ui/src/assets/convencion-eslogan.webp`, export en
  `packages/ui/src/components/decorative/index.ts`, clase `.slogan-lockup` en
  `packages/ui/src/styles/components.css`, export wildcard en `packages/ui/package.json`.
- **Código modificado**: `apps/registro/src/App.tsx` (paso `bienvenida`),
  `apps/panel/src/App.tsx` (login), `apps/panel/vite.config.ts` (`globPatterns`),
  `scripts/verify-design-system.mjs` (`requiredSelectors`), `DESIGN_NOTES.md`.
- **Dependencias**: ninguna nueva en runtime. `cwebp` se usa como herramienta de
  preparación del asset, fuera del bundle.
- **Bundle**: el PNG original de 1.570 KB se convierte a un WebP de 1664px de ~70 KB. El
  precache del PWA del panel crece ~70 KB sobre los 864 KB actuales de `dist`.
- **Accesibilidad**: el nombre accesible del hero pasa de "Muy pronto" a "Atrévete a ser
  diferente", que es el copy real. `MarkNeq` deja de ser el portador del símbolo en el hero.
- **Riesgo conocido**: el asset WebP queda por debajo de lo que necesita un viewport de 768px
  a dpr3 (2304px) y se verá algo suave en iPhone a ese tamaño. Aceptado a cambio de 118 KB
  menos de precache; queda documentado en `DESIGN_NOTES.md`.
