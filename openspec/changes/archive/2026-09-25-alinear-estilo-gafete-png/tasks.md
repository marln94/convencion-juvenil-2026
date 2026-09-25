# Tasks

## 1. Tokens

- [x] 1.1 Declarar `--font-mono` en `packages/ui/src/styles/tokens.css` con el stack
      `ui-monospace, SFMono-Regular, Menlo, monospace`, junto al bloque de tipografía
- [x] 1.2 Exponer `--font-mono` en el `@theme inline` de `apps/registro/src/index.css` y
      `apps/panel/src/index.css` para que `font-mono` resuelva el token en vez del default
      de Tailwind

## 2. Acceso a tokens desde canvas

- [x] 2.1 Agregar en `apps/registro/src/lib/gafete.ts` el helper `token(nombre, respaldo)`
      que resuelve custom properties con `getComputedStyle`, con lectura única del
      `CSSStyleDeclaration` del `document.documentElement`
- [x] 2.2 Definir un resolvedor único de paleta que devuelva fondo, tinta, tinta suave,
      acento y las dos familias tipográficas, leyendo sólo tokens concretos y nunca
      `--color-bg` ni `--color-text`
- [x] 2.3 Borrar `COLOR_INDIGO`, `COLOR_TEXTO`, `COLOR_ID` y las tres constantes
      `FUENTE_*` hardcodeadas

## 3. Precarga de tipografías

- [x] 3.1 Reemplazar el `await document.fonts.ready` por una precarga explícita con
      `document.fonts.load(peso tamaño familia, textoRepresentativo)` para el título, el
      nombre y el `participantId`
- [x] 3.2 Envolver cada `document.fonts.load` en su propio `catch` para que un fallo de
      red degrade a la pila del sistema sin impedir la generación
- [x] 3.3 Confirmar que los pesos pedidos (800, 700, 400) existen en la carga de
      `base.css:4` y que ninguno es 600

## 4. Composición

- [x] 4.1 Exportar `ESCALA_GAFETE` y dimensionar el bitmap a `ANCHO * ESCALA_GAFETE` con
      `ctx.scale(ESCALA_GAFETE, ESCALA_GAFETE)`, dejando las coordenadas en unidades de
      diseño
- [x] 4.2 Sustituir el fondo `#ffffff` por `--color-paper-light`
- [x] 4.3 Dibujar el marco de 2 px en `--color-ink` con radio 0, inset dentro del bitmap
- [x] 4.4 Recomponer la pila vertical: título display 800 en mayúsculas sobre
      `--color-ink`, regla horizontal de 2 px en `--color-red`, nombre display 700 en
      mayúsculas sobre `--color-ink`, QR, y `participantId` monoespaciado 400 sobre
      `--color-ink-fade`
- [x] 4.5 Aplicar `ctx.letterSpacing` al título, protegido por `'letterSpacing' in ctx`
- [x] 4.6 Recibir el nombre de la convención como parámetro en lugar de hardcodearlo, y
      conservarlo envuelto con `envolverTexto` y el alto derivado de la cantidad de
      líneas
- [x] 4.7 Verificar que con nombres de 1, 2 y 3 líneas el QR no se recorta ni se solapa
      con el `participantId`

## 5. Integración en la pantalla

- [x] 5.1 En `apps/registro/src/App.tsx`, derivar el `size` del `QRCodeCanvas` de
      `QR_LADO_UI * ESCALA_GAFETE` e importar `ESCALA_GAFETE` desde `gafete.ts`
- [x] 5.2 Pasar `fgColor` y `bgColor` con valores resueltos por `leerColoresQr()`, nunca
      con `var(--x)`, y reemplazar `includeMargin` por `marginSize={4}`
- [x] 5.3 Pasar `NOMBRE_CONVENCION` a `componerGafete` y eliminar la tercera copia del
      nombre que estaba hardcodeada en `gafete.ts`

## 6. Verificación

- [x] 6.1 `pnpm typecheck`
- [x] 6.2 `pnpm --filter @convencion/registro build`
- [x] 6.3 `pnpm verify:design`
- [x] 6.4 En DevTools, confirmar que el gafete generado dibuja Poppins y no `system-ui`
- [x] 6.5 Imprimir el PNG a 300 DPI y verificar que el nombre y el `participantId` se leen
      sin verse suavizados
- [x] 6.6 Escanear el gafete impreso con la aplicación de check-in real, en condiciones de
      poca luz, y confirmar que el `codigoQr` resuelve al participante correcto
- [x] 6.9 Confirmar que el gafete no usa `var(--x)` en ningún `ctx.fillStyle`, `ctx.strokeStyle`
      ni prop de color de `QRCodeCanvas`: en canvas las custom properties se descartan en
      silencio y el resultado es negro sólido, sin error en consola
- [x] 6.7 Confirmar que un gafete generado antes del cambio sigue siendo escaneable y
      resuelve el mismo participante
- [x] 6.8 Anotar en `DESIGN_NOTES.md` que el gafete es light-only por construcción y que
      su fondo es deliberadamente plano, sin la textura de papel
