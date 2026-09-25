# Design

## Context

`componerGafete` (`apps/registro/src/lib/gafete.ts`) dibuja el gafete con la API 2D de
canvas. No hay DOM que consulten tokens: el contexto de dibujo no resuelve
`var(--color-ink)`. Esa es la razón técnica de que la paleta esté hardcodeada, y por eso
la corrección tiene que resolver primero el acceso al token y después la composición.

Restricciones:

- El QR es una credencial de acceso. Se lee con `@zxing/browser` (`Checkin.tsx:51`)
  sobre video en vivo, con un teléfono sostenido con la mano, en un salón, y también se
  imprime. El margen de error de escaneo es cero.
- `registro/spec.md:128` dice que el gafete existe "para que el staff lo imprima o
  muestre", así que la resolución de exportación es un requisito, no una mejora.
- El change `apply-design-system-19-convencion` decidió (decisión 1) que los tokens son
  custom properties en CSS, y (decisión 2) que `packages/ui` es la fuente única. Duplicar
  hex en TypeScript rompería las dos.
- La carga de fuentes del proyecto (`base.css:4`) trae Poppins `400;500;700;800`,
  Poiret One y Sacramento.

## Goals / Non-Goals

**Goals:**

- Que el gafete se lea como un artefacto de la convención y no como un badge de Tailwind
  por defecto.
- Mantener el presupuesto de contraste del QR sin gastar ni un punto.
- Que el gafete sea imprimible a 300 DPI.
- Que el texto del gafete use la misma tipografía que la pantalla, incluso cuando la
  fuente se descarga tarde o falla.

**Non-Goals:**

- Reintroducir la copia al portapapeles (prohibido por `formulario-registro`).
- Tocar el QR in situ del panel.
- Corregir `.t-outline` (`typography.css:16`), que pide un peso 600 no cargado.
- Incrustar un logo en el QR.

## Decisions

### 1. Los tokens se leen en tiempo de ejecución, no se duplican en TypeScript

**Decision**: `componerGafete` resuelve los tokens con
`getComputedStyle(document.documentElement).getPropertyValue(nombre).trim()`.

**Rationale**: Es la única forma de que el hex siga siendo el de `tokens.css`. Un módulo
`tokens.ts` con los hex en paralelo sería una segunda fuente de verdad, y esa segunda
fuente es exactamente el bug que se está corrigiendo. Además `getComputedStyle` resuelve
en el momento en que se genera el gafete, así que un cambio de token se refleja sin
tocar TypeScript ni recompilar.

El costo es una lectura de estilo por token (cinco o seis, en un solo click). Irrelevante.

**Alternative considered**: exportar un `tokens.ts` desde `packages/ui` para que el canvas
los importara. Rechazado — doble fuente de verdad, y obliga a recompilar JS para cambiar
un color que hoy se cambia en un archivo de CSS.

**Implementation**: un resolvedor único que lee el `CSSStyleDeclaration` del
`document.documentElement` una sola vez y devuelve la paleta del gafete, con un respaldo
por token para que una lectura vacía no reviente el `ctx.fillStyle`:

```ts
function leerTokens(): EstilosGafete {
  const estilos = getComputedStyle(document.documentElement)
  const valor = (nombre: string): string => estilos.getPropertyValue(nombre).trim()

  return {
    fondo: valor('--color-paper-light') || TOKENS_FALLBACK.fondo,
    tinta: valor('--color-ink') || TOKENS_FALLBACK.tinta,
    // ...
  }
}
```

El respaldo existe sólo para eso: una lectura vacía se come el error en el `ctx.fillStyle`
y el gafete se dibuja negro en silencio, que es el mismo modo de falla que la decisión 8.

### 2. Tokens concretos, nunca los alias semánticos

**Decision**: El gafete lee `--color-paper-light`, `--color-ink`, `--color-ink-fade`,
`--color-red`, `--font-display` y `--font-mono`. No lee `--color-bg` ni `--color-text`.

**Rationale**: `--color-bg` y `--color-text` son los únicos tokens que se intercambian bajo
`.theme-dark` (`tokens.css:64-68`). Un gafete es un artefacto impreso y compartido por
WhatsApp: si un día se activa el tema oscuro, un gafete en `#0A0A0A` con el QR invertido
sería ilegible en la puerta y sobre el papel. Fijando los tokens concretos, el gafete es
light-only por construcción, sin necesidad de un flag.

`DESIGN_NOTES.md:25` confirma que `.theme-dark` todavía no se aplica en ninguna app, así
que hoy no hay diferencia observable. La decisión es preventiva y de costo cero.

**Alternative considered**: leer los alias semánticos y aceptar un gafete temático.
Rechazado — un artefacto impreso no debería cambiar de apariencia según el tema del
dispositivo que lo generó.

### 3. El QR conserva el contraste completo; la marca va en el marco

**Decision**: `fgColor` = `--color-ink`, `bgColor` = `--color-paper-light`, sin
`imageSettings`, sin borde alrededor del QR, y `--color-red` reservado para la regla.

**Rationale**: El diseño del gafete tiene tres restricciones que consumen el mismo
presupuesto:

- ISO/IEC 18004 pide 3:1 como mínimo entre módulo y fondo, pero un teléfono con brillo a
  contraluz en un salón no está en esa condición.
- `ink #0A0A0A` sobre `paper-light #FAFAFA` da ~17:1. `--color-red #D90D0D` sobre
  `--color-paper #EDEDED` da 4.47:1, y `DESIGN_NOTES.md:35` ya dice que el rojo "solo debe
  usarse en texto grande o elementos de UI". En impresión CMYK ese rojo sobre gris se
  degrada más todavía.
- La zona de silencio de 4 módulos es la señal con la que el escáner reconoce "esto es un
  QR". Un marco oscuro pegado al QR la reduce y confunde la detección del patrón
  localizador. El borde va en el borde externo del artefacto, lejos del QR.

Es decir: la identidad la dan el marco ink de 2 px, la tipografía Poppins en mayúsculas y
la regla roja. El QR se queda en negro sobre casi blanco, que es donde funciona.

**Alternative considered**: `imageSettings` con el símbolo ≠ al centro. Obliga a
`level="H"` y a `crossOrigin` para poder extraer el canvas, y gasta entre 20 y 30 puntos
de tolerancia de escaneo para aportar una marca que el marco ya comunica. El check-in es el
proceso donde no se puede fallar.

### 4. Se precargan las fuentes explícitamente

**Decision**: Antes de dibujar, `document.fonts.load()` para cada combinación
peso/tamaño/familia que se va a usar, con el texto representativo, y cada llamada con su
propio `catch`.

**Rationale**: El código actual hace `await document.fonts.ready`, que es insuficiente
por dos razones independientes:

1. `document.fonts.ready` no solicita nada. Sólo espera a que terminen de cargar las
   fuentes que ya estaban en vuelo.
2. `fillText` sobre canvas no dispara descargas de webfonts. El navegador usa lo que hay
   en caché; si no está, cae al fallback de inmediato y sin avisar.

El resultado combinado es que el gafete puede salir en `system-ui` aunque la página
completa tenga Poppins en su CSS. Pasar el texto representativo
(`document.fonts.load(font, text)`) hace que se descarguen los glifos exactos que se van a
dibujar, no sólo los que la página ya usó.

Un `catch` por llamada: si Google Fonts no responde, el gafete se dibuja con la pila del
sistema y se comparte igual. Perder la tipografía es aceptable; perder la descarga no.

**Implementation**: se mantienen pesos que la carga realmente provee. `FUENTE_NOMBRE`
pide `600` hoy, que no existe en `400;500;700;800`. Se usa 700 para el nombre y 800 para
el título, que además ya están en caché porque `.t-solid` y `.t-date` los usan en esa
pantalla. El `participantId` usa 400, que es la única que resta.

### 5. La composición se define en unidades de diseño y se exporta con `ctx.scale`

**Decision**: Todas las coordenadas, tamaños de fuente y grosores se siguen escribiendo
en un espacio de 640 px de ancho. El bitmap del PNG es `ANCHO * ESCALA_GAFETE` de ancho y
`ctx.scale(ESCALA_GAFETE, ESCALA_GAFETE)` aplica el factor a todo lo demás.

**Rationale**: Un solo `scale` cubre geometría, `ctx.font` y `lineWidth` sin tocar los
números del layout, y el texto se rasteriza a la resolución final en vez de estirarse —
que es lo que pasa si se dibuja en 640 y se exporta a 1280.

`ESCALA_GAFETE` se exporta desde `gafete.ts` y `App.tsx` deriva de él el `size` del
`QRCodeCanvas` (`size={QR_LADO_UI * ESCALA_GAFETE}`). Así el acoplamiento queda explícito:
si alguien cambia la escala, el `size` sigue y el QR nunca se escala hacia arriba al
componerse. `size` no cambia lo que se ve en pantalla porque `style={{ width: '100%',
height: '100%' }}` sobrescribe el tamaño de presentación; sólo la resolución intrínseca
del canvas.

**Alternative considered**: redibujar el QR en un canvas offscreen al tamaño exacto que
necesita el gafete, sin tocar la props del `QRCodeCanvas` de pantalla. Rechazado por
complejidad: obliga a mantener dos fuentes de QR y a recalcular `marginSize` a mano.

### 6. Se agrega `--font-mono` a los tokens

**Decision**: Se declara `--font-mono` en `tokens.css` con el stack que ya se usaba
hardcodeado en `gafete.ts:13` y que Tailwind provee como `font-mono`.

**Rationale**: El hueco es real: `App.tsx:538` usa el `font-mono` de Tailwind y
`gafete.ts:13` tenía su propio stack, sin que nada los uniera. Agregar el token hace que
el `participantId` de la pantalla y el del gafete sean la misma definición, y de paso
deja de ser un literal suelto.

**Alternative considered**: usar el `font-mono` de Tailwind directamente y no tocar
`tokens.css`. Rechazado — el gafete no lee utilidades Tailwind, lee tokens, y si no
existiera el token el gafete seguiría siendo el único consumidor con un stack propio.

### 7. `includeMargin` deprecada pasa a `marginSize`

**Decision**: `includeMargin` se reemplaza por `marginSize={4}`.

**Rationale**: `qrcode.react` marca `includeMargin` como deprecada y la reemplaza por
`marginSize`, que acepta la misma zona de 4 módulos de forma explícita. El valor no
cambia, así que la legibilidad tampoco; sólo se deja de usar una prop que va a
desaparecer.

`QR_LADO` sigue siendo 480 en unidades de diseño para conservar la proporción actual
entre el QR y el ancho del gafete.

### 8. Los colores del QR tienen que llegar como valores, nunca como `var()`

**Decision**: `fgColor` y `bgColor` se pasan con valores resueltos por `leerColoresQr()`,
no con referencias a custom properties.

**Rationale**: Es la trampa de este change y merece quedar escrita. `QRCodeCanvas` no
dibuja DOM: asigna sus props directo a `ctx.fillStyle`. El parser de colores de canvas
acepta colores CSS, pero **no** custom properties. La primera implementación pasó
`fgColor="var(--color-ink)"` y `bgColor="var(--color-paper-light)"` y el QR salió **negro
sólido**: una asignación inválida a `fillStyle` no lanza error, se ignora en silencio y la
propiedad conserva su valor anterior, que en un canvas recién creado es negro. Como el
componente primero rellena el fondo completo con `bgColor`, el negro inicial pintaba todo
y después los módulos se pintaban negros encima. Sin modules visibles, sin excepción, sin
error en consola.

Es peor que un bug visible porque `var()` funciona en el DOM: el mismo string es válido
en un `style` y en un `color`, así que la revisión de código no lo marca, `tsc` no lo
marca, y el error sólo aparece mirando el render. La regla general: **custom properties
resuelven donde hay CSS, y en canvas hay que resolverlas a mano con
`getComputedStyle`.**

Verificado en Chrome headless contra `QRCodeCanvas` con el valor de `qrcodegen` real:

| props | % oscuro | fondo medido | decodifica |
| ----- | -------- | ------------ | ---------- |
| `var(--color-ink)` / `var(--color-paper-light)` | 100.0 | `rgb(0,0,0)` | `NotFoundException` |
| `#0A0A0A` / `#FAFAFA` | 28.7 | `rgb(250,250,250)` | sí, coincide |

`document.fonts.check()` devuelve `true` incluso sin red, así que no sirve para verificar
que una fuente se cargó. La comprobación útil es medir el texto con la familia pedida y
con el fallback y ver si difieren.

## Layout

Todo en unidades de diseño (640 de ancho), exported a 2×:

```
  ┌ borde 2px ink, inset 3u ──────────────────────────────┐
  │  y=64    CONVENCIÓN JUVENIL 2026   display 800, 26u   │  --color-ink
  │  y=116   ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬  2px, ancho de contenido  │  --color-red
  │  y=148   MARÍA FERNÁNDEZ           display 700, 34u   │  --color-ink
  │  y=224   ┌────────────────┐                             │
  │          │   QR 480u      │                             │  ink / paper-light
  │          └────────────────┘                             │
  │  y=734   CJ-2026-A1B2C3             mono 400, 15u      │  --color-ink-fade
  └──────────────────────────────────────────────────────┘
```

El nombre se envuelve con el helper `envolverTexto` que ya existe, y el alto total se
deriva de la cantidad de líneas, igual que hoy. Un nombre largo crece el gafete hacia
abajo sin recortar el QR.

El `ctx.letterSpacing` se usa para el tracking del título y se protege con `'letterSpacing'
in ctx`: es una API reciente (Chrome 99+, Safari 17.4+, Firefox 128+) y en navegadores
que no la tengan el texto se dibuja sin tracking, que sigue siendo legible. Es el mismo
razonamiento que ya aplica el sistema a `.btn` y `.t-solid` vía CSS.

## Contraste medido sobre el PNG generado

Fondo real del gafete `#FAFAFA` (`--color-paper-light`):

| Elemento                        | Token                  | Contraste |
| ------------------------------- | ---------------------- | --------- |
| Módulos del QR, título, nombre  | `--color-ink`          | 18.97:1   |
| Regla de acento                 | `--color-red`          | 5.01:1    |
| `participantId`                 | `--color-ink-fade`     | 2.70:1    |

El QR queda en 18.97:1, muy por encima del mínimo, y la regla roja en 5.01:1 que es
holgadamente texto grande.

El `participantId` en `--color-ink-fade` queda en **2.70:1**, por debajo del 4.5:1 de AA
para texto normal. Cumple el requisito de la spec, que pide tipografía "discreta en la
base", y cumple su función — la información que el staff necesita está en el QR y en la
tarjeta de la pantalla —, pero sobre papel un identificador que hay que leer no debería
andar por debajo de AA. `--color-ink-soft` da 8.49:1 y sigue leyéndose como secundario.
Queda anotado como decisión abierta en vez de cambiarlo por cuenta propia, porque la
spec vigente pide explícitamente discreción.
