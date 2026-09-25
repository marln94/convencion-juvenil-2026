# Proposal

## Contexto

La convención entrega hasta 800 credenciales. El gafete es el artefacto que cruza la
puerta: se comparte por el diálogo nativo del teléfono o se descarga, y el staff lo
imprime o lo muestra. Es la única pieza del sistema de diseño que se genera fuera del
navegador, dibujada a mano sobre un `<canvas>`, y por eso quedó fuera de la migración.

`apps/registro/src/lib/gafete.ts` no consulta ningún token. Escribe su propia paleta:

| En el gafete              | En el sistema de diseño |
| ------------------------- | ----------------------- |
| `#4338ca` (indigo-700)    | `--color-red`            |
| `#0f172a` (slate-900)     | `--color-ink`            |
| `#94a3b8` (slate-400)     | `--color-ink-fade`       |
| `#ffffff`                 | `--color-paper-light`    |
| `system-ui, -apple-system…` | `--font-display` (Poppins) |

`--color-red` aparece **cero veces** en el archivo. El resultado se ve como un badge de
Tailwind por defecto, no como un artefacto de la Convención Juvenil 2026.

Tres defectos más, todos en el mismo archivo:

- **Peso 600 inexistente.** `FUENTE_NOMBRE` pide `600 36px`, pero la carga de Google
  Fonts (`typography` en `base.css:4`) sólo trae Poppins `400;500;700;800`. El peso 600
  nunca se descarga y el navegador cae al peso disponible más cercano, de forma
  impredecible.
- **Las fuentes no se precargan.** `await document.fonts.ready` (líneas 45-46) sólo
  espera fuentes que ya están en vuelo; no solicita ninguna. Y `fillText` sobre canvas
  tampoco dispara descargas de webfonts. El resultado es que el gafete puede salir
  renderizado en `system-ui` aunque Poppins esté en el CSS de la página.
- **Resolución de 640 px.** `openspec/specs/registro/spec.md:128` dice que el gafete es
  "para que el staff lo imprima o muestre". A 640 px de ancho son 5.4 cm a 300 DPI, con
  el texto visiblemente suave al imprimir.

Además hay una costura en pantalla: la `Card` que envuelve al QR es
`--color-paper-light` (`#FAFAFA`) y el QR renderiza con su `bgColor` por defecto
(`#FFFFFF`). Hoy hay un cuadrado blanco dentro de una card casi blanca.

## Non-goals

- **No se toca el QR como elemento escaneable.** El presupuesto de contraste se mantiene
  íntegro: el `codigoQr` sigue siendo el mismo y el patrón de lectura no cambia.
- **No se re-agrega la copia al portapapeles.** `formulario-registro` lo prohíbe
  explícitamente y el check-in sólo lee QR o busca por nombre.
- **No se toca el QR in situ del panel.** `apps/panel/src/vistas/RegistroInsitu.tsx:189`
  tiene el mismo tipo de desvío (marco con `style={{}}` inline, QR en `#000`/`#FFF` por
  defecto) pero es otra pantalla y otro flujo.
- **No se agrega la textura de papel al PNG.** `apps/*/public/assets/paper-texture.png`
  pesa 70 bytes: es un placeholder bloqueado en la tarea 12.1 del change de diseño. Y un
  tile de 160 px escalado a 1280 es ruido alrededor de un QR.
- **No se implementa `imageSettings` (logo embebido).** Obliga a `level="H"` y consume
  tolerancia de escaneo para aportar una marca que el marco ya comunica.
- **No se corrige el `font-weight: 600` de `.t-outline`** (`typography.css:16`). Es el
  mismo bug de peso, pero preexistente y ajeno a este change.
- **No se agrega la textura de papel ni assets del diseñador** al gafete.

## What Changes

- `componerGafete` pasa a leer los tokens del sistema de diseño en tiempo de ejecución
  con `getComputedStyle`, dejando de llevar su propia paleta.
- Se reconstruye la composición del gafete con la gramática editorial del sistema:
  fondo `--color-paper-light`, marco ink de 2 px con radio 0, título en Poppins 800 en
  mayúsculas, una regla de 2 px en `--color-red`, el nombre en Poppins 700 y el
  `participantId` en monoespaciada 400 sobre `--color-ink-fade`.
- Se reemplazan los pesos inexistentes por pesos que la carga de Google Fonts sí provee
  (400, 500, 700, 800).
- Se precargan explícitamente las familias y pesos con `document.fonts.load()` antes de
  dibujar, con degradación a la pila del sistema si la descarga falla, para que el gafete
  nunca se descargue bloqueado.
- La composición se define en unidades de diseño y se exporta a 2× con `ctx.scale`, de
  modo que el texto se rasterice a la resolución final en vez de estirarse. A 2× el
  gafete mide 1280 px de ancho, unos 10.8 cm a 300 DPI.
- El `QRCodeCanvas` de la pantalla de confirmación recibe `fgColor` y `bgColor` de token,
  `marginSize={4}` en lugar de la prop `includeMargin` (deprecada) y un `size` derivado
  de la escala de exportación, de modo que el bitmap nunca se escale hacia arriba al
  componerse.
- Se agrega el token `--font-mono`, que hoy no existe: `App.tsx` usa el `font-mono` de
  Tailwind y `gafete.ts` tenía su propio stack hardcodeado, sin definición compartida.
- El nombre de la convención deja de estar hardcodeado en `gafete.ts` y pasa a recibirse
  desde el llamador, que ya lo tiene en `NOMBRE_CONVENCION`.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `formulario-registro`: se agrega un requirement sobre la identidad visual del gafete
  PNG. El requirement existente ("Pantalla final con el código QR") solo fija contenido
  (que textos y el QR van dentro) y nunca especifico estilo, asi que es una requirement
  nueva dentro de la misma capability, no una correccion del texto vigente.

## Impact

- `apps/registro/src/lib/gafete.ts` — reescritura de la composición; exporta la escala.
- `apps/registro/src/App.tsx` — props del `QRCodeCanvas` y paso de `NOMBRE_CONVENCION`.
- `packages/ui/src/styles/tokens.css` — token `--font-mono`.
- Sin cambios de API, DTOs, backend ni dependencias. El `codigoQr` no cambia: los gafetes
  ya compartidos siguen siendo válidos y los nuevos siguen leyendo igual en el check-in.
- `scripts/verify-design-system.mjs` no requiere cambios: el gafete es canvas y no agrega
  ninguna clase CSS al bundle.
