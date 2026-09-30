# DESIGN_NOTES

Estado de la implementación del sistema de diseño para la Convención Juvenil 2026.

## Verificación automatizada

- `pnpm typecheck`
- `pnpm --filter @convencion/panel build`
- `pnpm --filter @convencion/registro build`
- `pnpm verify:design`

`pnpm verify:design` confirma exports de `@convencion/ui`, utilidades Tailwind generadas, clases tipográficas, decorativos, tamaños de botones, estados de navegación, DayPicker y ausencia de reglas que oculten visualmente elementos `aria-hidden`.

## Decisiones visuales actuales

- MarkNeq mantiene proporciones cuadradas y tamaño controlado por el consumidor; la variante hero permanece compacta en móvil.
- Brush es un lavado de tinta en `radial-gradient` sobre una capa `position: fixed`, anclado a las esquinas de la viewport. Sin SVG, sin `viewBox`, sin rotación. Cada variante apila dos gradientes descentrados para romper la simetría de la elipse. Debajo de 768px los radios se contraen para que el centro quede libre.
- `.t-eyebrow` conserva `--font-fine`, `--fs-eyebrow` y sin transformaciones de texto.
- Input y Select indican foco mediante el borde; Button y DayPicker usan outline rojo.
- Alert usa borde completo por variante y StepIndicator usa una track de 5 px.
- El documento de registro no hace scroll en móvil; `main` es el área desplazable.
- El lockup de bienvenida es `SloganLockup` (`packages/ui/src/components/decorative/SloganLockup.tsx`): un único WebP con el eslogan "Atrévete a ser diferente" y el símbolo ≠ ya compuestos. Reemplaza al `.stack` de 2 spans ("MUY" en `.t-outline`, "PRONTO" en `.t-solid`) y al `MarkNeq size="hero"` que iban debajo. Antes eran 4 repeticiones de "MUY PRONTO" que, capados a `max-w-3xl` (768px) con `--fs-hero` a 128px, se partían en 2 líneas cada uno (243px en vez de 122px). `Hero` ya no tiene `min-height: 100svh`: se dimensiona por contenido.
- El logo se expone por `alt="Atrévete a ser diferente"`, no por un wrapper `role="img"` con `aria-label`. El nombre accesible del hero pasó de ser el copy provisional "Muy pronto" al eslogan real. El ≠ no se nombra por separado porque el `alt` ya cubre la frase completa.
- El eslogan es **light-only por construcción**, igual que el gafete: el arte es tinta sobre transparencia (75.9% del canvas es alfa 0) y no sobrevive un fondo oscuro. `.theme-dark` sigue sin aplicarse en ninguna app.
- El WebP declara `width={1664} height={667}` para reservar el espacio antes de que cargue el bitmap. Son las dimensiones de la **caja del archivo**, no las del artwork: el PNG de origen tenía 5.0% de padding superior y 1.1-1.3% lateral, y recortar el padding del diseñador no es reversible. Usar el ratio del artwork (2.6060) en vez del del archivo (2.4945) dejaría la altura reservada ~1.7% corta y produciría un salto visible.
- El lockup no usa `mix-blend-mode`. El asset tiene canal alfa real, así que se compone directo sobre el paper, el brillo radial y el `paper-noise` sin caja blanca ni costura de textura. `multiply` (el patrón de `Brush`) oscurecería la tinta ~7% y apagaría el rojo; queda reservado para assets que sí traigan fondo.
- El `registro-footer` (80px) se oculta solo en `bienvenida`, donde repite lo que el header ya muestra. `paso` nunca vuelve a `'bienvenida'`, así que el footer aparece desde el primer paso del wizard en adelante.
- Brush no se imprime (`display: none` en `@media print`) porque una capa fija se repite en cada página.
- Brush usa `screen` bajo `.theme-dark`; `multiply` de rojo sobre `#0A0A0A` es negro y la mancha desaparecería. Preventive: `.theme-dark` todavía no se aplica en ninguna app.
- El gafete PNG (`apps/registro/src/lib/gafete.ts`) se dibuja en canvas a 2× y exporta 1280 px de ancho, unos 10.8 × 14.1 cm a 300 DPI, para que sea imprimible. Es **light-only por construcción**: lee `--color-paper-light`, `--color-ink`, `--color-ink-fade` y `--color-red`, nunca los alias `--color-bg` ni `--color-text`, que son los únicos que se intercambian bajo `.theme-dark`. Un gafete oscuro con el QR invertido sería ilegible en la puerta y sobre el papel.
- El fondo del gafete es deliberadamente plano, sin la textura de papel: el asset sigue siendo un placeholder y un tile escalado a 1280 es ruido alrededor de un QR.
- El QR del gafete no lleva logo, marco ni borde propios, y el `--color-red` no se usa en los módulos. Los módulos van `--color-ink` sobre `--color-paper-light` (18.97:1); cualquier color de contraste reducido degrada el escaneo en la puerta y más todavía en impresión.

## Assets y su preparación

El eslogan vive en `packages/ui/src/assets/convencion-eslogan.webp` como copia única del
repo, importada desde el componente. No se replica en `apps/*/public/assets/` (el rodeo que
hoy usa `paper-texture.png`) ni se codifica su URL en las apps.

El diseñador entregó `4xconvencion-eslogan.png`, 4989×2000 RGBA, 1.570 KB. Ojo con el nombre:
**no es 4× del PNG de 845×323 que circulated antes** (que habría sido 3380×1292), es el mismo
arte con 1.1% de padding a la izquierda, 1.3% a la derecha, 5.0% arriba y 1.6% abajo.

Regenerar el `.webp` (cwebp 1.6.0, dos pasos porque `cwebp` no reescala):

```sh
sips -s format png --resampleWidth 1664 4xconvencion-eslogan.png --out /tmp/slogan-1664-src.png
cwebp -q 82 -alpha_q 100 -m 6 -quiet /tmp/slogan-1664-src.png -o packages/ui/src/assets/convencion-eslogan.webp
```

| Salida | Peso |
| --- | --- |
| PNG de origen 4989px | 1.570 KB |
| WebP 4989px q75 | 188 KB |
| **WebP 1664px q82 (el que está)** | **69.5 KB** |

El PNG pesa 1.570 KB porque el 76% del canvas es transparencia y el resto son dos tintas
(`#000000` 61.3%, `#D70202` 0.9%) con antialiasing de 8 bits por canal en un formato de 32
bits. WebP con alpha lo resuelve sin pérdida visible.

**Trade-off aceptado**: 1664px cubre dpr2 hasta 832px CSS, o sea el `max-w-3xl` (768px)
completo. Un hero de 768px a dpr3 necesita 2304px y se verá ~1.3× suave en iPhone. A cambio
son 118 KB menos de precache en el PWA del panel, que se usa en la puerta con señal
degradada. Para revertirlo alcanza con sacar el `--resampleWidth` del comando de arriba; no
requiere tocar specs ni código.

## Pendientes conocidos

- Las viewports cortas **ya no desbordan**. El eslogan reemplazó al `.stack` (243px) más el
  `neq` (224px) por una sola imagen de 231px a `max-w-xl`, y el hero quedó en ~411px contra
  los 677px que ocupaba. El ajuste que se contemplaba antes (`py-12` → `py-8` y `neq` de
  224 → 160px) ya no hace falta y no se aplicó.

  Medido sobre el build (Chrome headless, `deviceScaleFactor: 1`):

  | Viewport | Documento | Header | Eslogan | Bottom del CTA | Resultado |
  | --- | --- | --- | --- | --- | --- |
  | 1366×768 | 768 / 768 | 102px | 576×231 | 463 | sin scroll, 305px de aire |
  | 1280×800 | 800 / 800 | 102px | 576×231 | 463 | sin scroll |
  | 1920×993 | 993 / 993 | 102px | 576×231 | 463 | sin scroll |
  | 1440×813 | 813 / 813 | 102px | 576×231 | 463 | sin scroll |
  | 1024×813 | 813 / 813 | 97px | 576×231 | 457 | sin scroll |
  | 768×813 | 813 / 813 | 96px | 576×231 | 456 | sin scroll |
  | 480×800 | 800 / 800 | 76px | 442×177 | 343 | sin scroll |
  | 390×844 | 844 / 844 | 76px | 358×144 | 309 | sin scroll |

  El `naturalWidth` del bitmap es 1664 contra los atributos `width`/`height` de 1664×667, así
  que el espacio se reserva exacto y no hay salto al cargar. El eslogan queda centrado en los
  ocho anchos y los dos `Brush` siguen en `position: fixed` con `mix-blend-mode: multiply`.
- La pantalla de bienvenida se centra **en ambos ejes** dentro del espacio que deja el header.
  Antes quedaba pegada al techo y en móvil se veía muy arriba. Se logra con
  `.registro-main--centrado` (columna flex que crece) más `margin-block: auto` en su
  `.container`. Se usa `margin-block: auto` en lugar de `justify-content: center` a propósito:
  con `justify-content`, un hijo más alto que su padre overflowea por arriba y la parte
  superior se vuelve inalcanzable al desplazar; los márgenes auto caen a 0 cuando no hay
  espacio. El centrado se aplica **solo** a `bienvenida`, así que los pasos del asistente
  arrancan arriba y se desplazan como siempre.

  Medido sobre el build (Chrome headless, `deviceScaleFactor: 1`). "Arriba" y "abajo" son las
  separaciones entre el borde del área útil y el eslogan, y entre el botón y el borde inferior:

  | Viewport | Eslogan | Arriba | Abajo | Balance | Horizontal |
  | --- | --- | --- | --- | --- | --- |
  | 1366×768 | 576×231 | 177px | 177px | 0px | 0px |
  | 1280×800 | 576×231 | 193px | 193px | 0px | 0px |
  | 1920×993 | 576×231 | 289px | 289px | 0px | 0px |
  | 1440×813 | 576×231 | 199px | 199px | 0px | 0px |
  | 1024×813 | 576×231 | 202px | 202px | 0px | 0px |
  | 768×813 | 576×231 | 202px | 202px | 0px | 0px |
  | 480×800 | 442×177 | 241px | 241px | 0px | 0px |
  | 390×844 | 358×144 | 279px | 279px | 0px | 0px |
  | 360×640 | 328×131 | 183px | 183px | 0px | 0px |

  Ninguno de los nueve desplaza. En viewports donde el contenido no cabe (probado hasta
  360×320) el bloque se ancla arriba sin recortarse: el slogan sigue visible, el botón sigue
  alcanzable y no hay corte superior. El salto del wizard se comprobó en 1366×768 y 390×844:
  al entrar, `registro-main--centrado` desaparece, el indicador de pasos y el footer siguen
  presentes y el primer campo arranca 102px y 76px desde arriba.
- El padding superior del asset (5.0%) baja el centro óptico del eslogan ~2.5% respecto de
  su bounding box visual. Se conserva el padding del diseñador en vez de recortar; si molesta
  en el recorrido visual, se ajusta el `padding-block` del contenedor, no el asset.

## Contraste

- Negro `#0A0A0A` sobre paper `#EDEDED`: 16.91:1.
- Rojo `#D90D0D` sobre paper `#EDEDED`: 4.47:1; solo debe usarse en texto grande o elementos de UI.
- Rojo oscuro `#8E0B12` sobre paper `#EDEDED`: 8.13:1; opción accesible para texto normal.
- White sobre rojo `#D90D0D`: 5.23:1.
- White sobre negro `#0A0A0A`: 19.80:1.

## Verificación manual completada

- Recorrido visual de ambas apps aprobado.
- Breakpoints 480, 768, 1024 y 1280 px aprobados.
- Dark mode aprobado.
- `prefers-reduced-motion` aprobado.
- Auditoría axe-core sin errores pendientes tras las correcciones de ARIA y contraste.
- Contraste verificado tanto automáticamente como en el recorrido manual.
- El lockup del eslogan compone sobre el paper sin caja blanca ni costura de textura, y no
  salta al cargar (dimensiones intrínsecas declaradas).

## Contraste del arte del eslogan

Medido sobre el asset final, no sobre tokens:

- Tinta del eslogan `#000000` sobre paper `#EDEDED`: 17.94:1. Sobre el centro del brillo
  radial `#FAFAFA`: 20.12:1.
- Rojo del símbolo ≠ `#D70202` sobre `#EDEDED`: 4.60:1; sobre `#FAFAFA`: 5.16:1. Supera el
  4.5:1 de WCAG AA para texto normal, así que no queda restringido a texto grande como sí
  pasa con el `--color-red` del sistema (4.47:1).

## Set de favicons

El set entregado en `favicons/` sustituye al `favicon.ico` de la raíz (263 KB, un único
bitmap 256×255 de 32bpp sin comprimir) y al `favicon.svg` provisional. Se distribuye igual en
el `public/` de ambas apps, con checksum idéntico al original.

Medidas sobre los archivos entregados, no sobre su nombre:

| Asset | Tamaño | Peso | Fondo | Margen del glifo |
|---|---|---|---|---|
| `favicon.ico` | 16/32/48 | 4.3 KB | transparente | 5.2% (48 px) |
| `favicon-16x16.png` | 16×16 | 0.5 KB | transparente | 6.3% |
| `favicon-32x32.png` | 32×32 | 1.2 KB | transparente | 6.3% |
| `favicon-48x48.png` | 48×48 | 2.3 KB | transparente | 5.2% |
| `apple-touch-icon.png` | 180×180 | 13.1 KB | blanco opaco | 13.1% |
| `android-chrome-192x192.png` | 192×192 | 20.3 KB | transparente | 7.3% |
| `android-chrome-512x512.png` | 512×512 | 109.1 KB | transparente | 6.9% |
| `maskable-512x512.png` | 512×512 | 53.7 KB | blanco opaco | 20.7% |

El `≠` es rojo `#D80400` sobre transparencia. Los dos iconos que las plataformas componen
sobre un fondo desconocido (apple-touch y maskable) llevan su propio fondo blanco opaco; el
resto se transparency bien contra la barra de pestañas.

Sobre el margen: el maskable ocupa el 59% del lienzo con 20.7% por lado, holgadamente por
encima del 10% que Android exige al recortar en círculo. `android-chrome-512x512.png` queda
en 6.9%, por debajo de ese umbral, pero se declara `purpose: any` y Android no lo recorta,
así que es correcto. Solo el maskable necesita zona segura.

El `head-snippet.html` entregado declara `theme-color` en `#ffffff`; se conservó el
`#0A0A0A` del proyecto, que es el que ambas apps ya usaban. El `site.webmanifest` traía
placeholders `Mi Sitio`, que se completaron con los datos reales de cada app. El panel no
enlaza ese manifest porque `VitePWA` ya genera el suyo, y se le cambiaron los iconos para que
apunten a los PNG entregados.

Precache del PWA del panel: 19 entradas, 1097.35 KiB, por debajo de los 1156.04 KiB que
pesaba la variante con el `.ico` de 263 KB. Al instalar el service worker sobre el build real
se observan 9 peticiones de red, ninguna repetida, y 15 entradas en `workbox-precache`.

## Assets pendientes del diseño

- Textura de papel 512×512.
- Arte final del símbolo ≠ **suelto** (el que llegó va compuesto dentro del lockup del
  eslogan; el `MarkNeq` del header del panel sigue siendo el fallback SVG).
- Pinceles watercolor.
- Líneas orgánicas.
- Mapa de Honduras y uso final de MapPin.
- Fuentes originales con licencia.
