# Design

## Context

See proposal.md - Why. El estado actual relevante: el lockup de la pantalla de bienvenida
(`apps/registro/src/App.tsx:321-338`) son dos elementos independientes — un `.stack`
tipográfico con `role="img" aria-label="Muy pronto"` y un `<MarkNeq size="hero">` — y el
login del panel (`apps/panel/src/App.tsx:64-71`) repite el `MarkNeq` con un `<h1>Panel`
propio. Ambos salen del mismo asset.

Restricciones que mandan sobre el diseño:

- `packages/ui` es un paquete de código fuente, no un paquete construido. Su `exports` mapea
  a `./src/...`, y `verify-design-system.mjs` valida que cada export sin `*` resuelva a un
  archivo existente. Un export con wildcard se saltea esa validación.
- Vite no procesa archivos dentro de `public/`: se copian tal cual al `dist/`, sin hash y sin
  transformación. Los imports de assets desde el código sí pasan por el pipeline de Vite.
- `paper-texture.png` vive duplicado en los dos `public/assets/` y `background.css` lo
  referencia por ruta absoluta `/assets/paper-texture.png`. Ese rodeo existe porque `public/`
  es por-app; es el patrón que este change decide no repetir.
- `apps/panel` es PWA con Workbox. `globPatterns` hoy es
  `['**/*.{js,css,html,svg,png,ico,woff2}']` y no cubre `webp` ni `jpeg`.
- Tailwind v4 emite las clases definidas en `@layer components` verbatim, se usen o no. Por
  eso quitar `MarkNeq` del hero no rompe `verify:design`, que exige `.mark-neq` y
  `.hero__neq` en el CSS compilado de ambas apps.

## Goals / Non-Goals

**Goals:**

- Una sola copia del asset en el repo, propiedad del design system.
- Que el lockup se renderice sobre el paper, sin caja blanca ni costura de textura.
- Que el nombre accesible del hero sea el eslogan real.
- Dejar el peso del asset en el orden de los 100 KB sin perder nitidez en dpr2.
- Que el login del panel muestre el lockup sin descarga de red en campo.

**Non-Goals:**

- No rediseñar el hero, el header ni el resto de la pantalla de bienvenida: el `Hero`, los
  `Brush`, el `StepIndicator` de pasos y el CTA quedan como están.
- No unificar el `MarkNeq` del header del panel con el lockup. Siguen siendo dos piezas
  distintas con propósitos distintos.
- No construir un pipeline de optimización de imágenes en el repo.

## Decisions

### 1. El asset vive en `packages/ui/src/assets/` y se importa desde el código, no en `public/`

**Decision**: `packages/ui/src/assets/convencion-eslogan.webp` con un export wildcard
`"./assets/*": "./src/assets/*"` en `package.json`, importado por `SloganLockup.tsx`.

**Rationale**: el lockup es una pieza del design system, igual que `MarkNeq` o `Brush`. Si
viviera en `public/` habría que copiarlo a los dos `apps/*/public/assets/` y quedaría
duplicado como `paper-texture.png`, además de tener que codificar la URL en cada app.
Importándolo desde el código, Vite lo emite con hash al `dist/assets/` de cada build, lo
deduplica por contenido y `SloganLockup` queda siendo el único que conoce la ruta.

**Alternativa considerada**: `apps/*/public/assets/convencion-eslogan.webp` +
`background-image` en CSS. Rechazada: replica el rodeo de `paper-texture.png`, que es un
placeholder de 70 bytes y no un asset real, y obliga a hardcodear la URL en dos archivos.

**Alternativa considerada**: export desde `apps/registro` para que el panel lo importe.
Rechazada: crea una dependencia de package entre apps, que el monorepo no tiene.

### 2. WebP a 1664px, generado por un paso documentado y no commiteado

**Decision**: convertir el PNG de 4989px a WebP de 1664px de ancho con `cwebp`, y versionar
el `.webp` resultante. El comando queda escrito en `DESIGN_NOTES.md` y en el task, no en un
script de build.

**Rationale**: el PNG pesa 1.570 KB porque el 76% del canvas es transparencia y el resto son
casi puros dos tintas con antialiasing de 8 bits por canal en un formato de 32 bits. Medido
sobre el mismo asset:

| Salida | Peso | vs PNG |
| --- | --- | --- |
| PNG original 4989px | 1.570 KB | — |
| WebP 4989px q75 | 188 KB | 12% |
| WebP 1664px q82 | **70 KB** | **4.4%** |
| PNG 1664px | 289 KB | 18% |

1664px cubre dpr2 hasta 832px CSS, que alcanza el `max-w-3xl` (768px) completo. El único
caso que se resiente es 768px a dpr3, que necesita 2304px.

**Alternativa considerada**: los 4989px en WebP a 188 KB. Da dpr3-native pero cuesta 118 KB
adicionales de precache en un PWA que se usa en la puerta con señal mala. La diferencia de
nitidez es de 1.3× de suavizado sobre un logo de dos tintas, imperceptible; la diferencia de
118 KB en un service worker no lo es.

**Alternativa considerada**: guardar el PNG tal cual. Son 1.570 KB contra los 70 KB. No.

**Alternativa considerada**: `srcset` con dos anchos. Vite no reescribe `srcset` con hashes por
entrada sin configuración extra, y el caso de uso real (un solo lockup, un solo tamaño por
breakpoint) no lo justifica.

### 3. Sin `mix-blend-mode` en el lockup

**Decision**: `.slogan-lockup` es un `display: block` con sizing y nada más. Sin blend mode.

**Rationale**: el asset entregado tiene canal alfa real — 75.9% del canvas descompuesto es
totalmente transparente — así que el eslogan ya se compone sobre `--color-paper` y sobre el
`paper-noise::before` sin cambios. El blanco no existe que se elimine.

Esto importa porque la primera opción considerada, `mix-blend-mode: multiply` (el patrón que
ya usa `Brush` en `components.css:483`), habría sido necesaria solo para el JPEG de fondo
blanco que el diseñador entregó primero. Con el PNG transparente sería no solo innecesaria
sino dañina: oscurecería la tinta ~7% y apagaría el rojo.

**Alternativa considerada**: `mix-blend-mode: multiply` como red de seguridad si el asset se
reemplaza alguna vez por una versión con fondo. Descartada: tapa la diferencia entre un asset
correcto y uno roto, y arrastra el problema de `.theme-dark` que `Brush` ya tiene documentado.

### 4. `width`/`height` intrínsecos de la caja del archivo, no del artwork

**Decision**: `width={1664} height={667}` en el `<img>`, derivado de la caja del archivo
convertido.

**Rationale**: el PNG entregado mide 4989×2000 (ratio 2.4945) pero su artwork opaco ocupa
`x 56..4924, y 100..1968` (ratio 2.6060) — hay 1.1% de padding lateral y 5.0% superior. El
padding es parte de la caja: el navegador la reserva, y el eslogan se posiciona donde el
diseñador lo puso. Usar el ratio del artwork (2.606) en lugar del del archivo (2.4945)
introduciría un error de layout de ~1.7% en la altura reservada, acumulando un salto visible
cuando la imagen carga.

`width`/`height` explícitos + `max-width: 100%` + `height: auto` dan reserva de espacio sin
CLS y mantienen la proporción sin `aspect-ratio`, que no es necesaria cuando el navegador ya
conoce la proporción intrínseca.

**Alternativa considerada**: recortar el asset al bounding box del artwork para ganar 2% de
densidad. No: descarta el padding deliberado del diseñador y obliga a rehacer el recorte cada
vez que cambia el arte.

### 5. `alt` con el eslogan, sin `role="img"` wrapper

**Decision**: `<img alt="Atrévete a ser diferente">` y nada más. Se elimina el
`role="img" aria-label="Muy pronto"` que hoy envuelve al `.stack`.

**Rationale**: el `alt` de un `<img>` es el nombre accesible que los lectores de pantalla
consumen de forma fiable, sin depender de la combinación `role="img"` + `aria-label` del
contenedor. El nombre accesible del hero pasa de ser el copy provisional "Muy pronto" al
eslogan real, que es una mejora concreta de accesibilidad y no un efecto secundario.

El símbolo ≠ sigue siendo decorativo en el sentido de que no lleva información propia: el
`alt` ya nombra el eslogan completo, y el ≠ es la forma, no un dato adicional.

**Alternativa considerada**: mantener el `role="img"` con `aria-label` por simetría con el
markup actual. Rechazada: es markup más complejo que accomplish menos.

### 6. Un solo requisito nuevo en `design-system-decorative`; `MarkNeq` se modifica, no se borra

**Decision**: agregar el requisito de `SloganLockup` a `design-system-decorative` y modificar
el de `MarkNeq` para reflecting que ya no es el símbolo del hero.

**Rationale**: `MarkNeq` sigue en uso en el header del panel (`App.tsx:157`) y en el login
antes de este change; después sigue en el header. Borrar el requisito sería incorrecto. Lo
que cambia es su rol en el hero, y eso es comportamiento de spec, no detalle de
implementación — de ahí que vaya en delta y no solo en el código.

### 7. `webp` entra al precache del PWA

**Decision**: sumar `webp` a `globPatterns` de Workbox en `apps/panel/vite.config.ts`.

**Rationale**: sin esto el logo del login no se precachea y se baja de red en cada carga. El
panel ya declara tolerancia offline como requisito de spec, y el staff lo usa en la puerta
con señal degradada. El costo es ~70 KB en el precache, que es exactamente por lo que la
decisión 2 optimizó el asset.

`globPatterns` no incluye `jpeg`, así que el JPEG con fondo blanco tampoco habría entraado.
Con WebP el problema desaparece por el lado del formato.

## Risks / Trade-offs

- **El asset se ve suave a 768px en dpr3** → 1664px quedan por debajo de los 2304px que
  necesitaría un iPhone a `max-w-3xl`. Mitigación: documentado en `DESIGN_NOTES.md`; si en
  el recorrido visual molesta, la decisión 2 se revierte subiendo el mismo comando a 4989px
  por 188 KB. No requiere cambiar specs ni código, solo el asset.

- **La conversión WebP no es reproducible por cualquiera que no lea `DESIGN_NOTES.md`** → el
  comando exacto queda escrito ahí y en el task, con los valores medidos. Riesgo aceptado:
  un script de build de imágenes para un solo asset es más infraestructura de la que
  justifica.

- **El `cwebp` no está en las devDependencies del repo** → es una dependencia de la máquina
  del designer, no del proyecto. Si alguien regenera el asset sin la herramienta, el `.webp`
  commiteado sigue funcionando. Mitigación: el task registra la versión usada (1.6.0).

- **Cambiar `globPatterns` altera el precache y por lo tanto la revisión del service worker**
  → Workbox va a generar un `sw.js` distinto. Con `registerType: "autoUpdate"` ya está
  configurado, los clientes toman el service worker nuevo en la siguiente carga. Mitigación:
  verificar el `sw.js` regenerado en el build del panel.

- **Quitar `MarkNeq` del hero deja su coreografía de entrada sin uso en el registro** →
  `animate-neq-enter` y `.hero__neq` quedan en el CSS y en `verify:design` pero sin
  instancia en `apps/registro`. Mitigación: se conservan; el símbolo sigue usándose en el
  panel, y borrarlos sería limpiar código que otro change puede necesitar.

- **El padding superior del asset (5.0%) descuadra el centro óptico del hero** → el eslogan
  se ve 2.5% más bajo de lo que sugiere su bounding box visual. Mitigación: se conserva el
  padding del diseñador en vez de recortar, y se revisa en el recorrido visual; si molesta,
  se ajusta el `padding-block` del contenedor, no el asset.

## Migration Plan

1. Mergear el change con el asset ya commiteado; no hay dependencia de orden con runtime.
2. Build de ambas apps y `verify:design`.
3. El PWA del panel sube un `sw.js` nuevo por el cambio de `globPatterns`; con
   `registerType: "autoUpdate"` se aplica solo en la siguiente carga de cada cliente.
4. Rollback: revertir el commit del change. No hay migración de datos, ni estado en
   DynamoDB, ni cambio de API. El `.webp` queda en el repo como archivo no referenciado,
   inofensivo.
