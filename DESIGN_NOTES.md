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
- El lockup de bienvenida son 2 spans: "MUY" en `.t-outline` y "PRONTO" en `.t-solid`. Antes eran 4 repeticiones de "MUY PRONTO" que, capados a `max-w-3xl` (768px) con `--fs-hero` a 128px, se partían en 2 líneas cada uno (243px en vez de 122px). `Hero` ya no tiene `min-height: 100svh`: se dimensiona por contenido.
- El `registro-footer` (80px) se oculta solo en `bienvenida`, donde repite lo que el header ya muestra. `paso` nunca vuelve a `'bienvenida'`, así que el footer aparece desde el primer paso del wizard en adelante.
- Brush no se imprime (`display: none` en `@media print`) porque una capa fija se repite en cada página.
- Brush usa `screen` bajo `.theme-dark`; `multiply` de rojo sobre `#0A0A0A` es negro y la mancha desaparecería. Preventive: `.theme-dark` todavía no se aplica en ninguna app.
- El gafete PNG (`apps/registro/src/lib/gafete.ts`) se dibuja en canvas a 2× y exporta 1280 px de ancho, unos 10.8 × 14.1 cm a 300 DPI, para que sea imprimible. Es **light-only por construcción**: lee `--color-paper-light`, `--color-ink`, `--color-ink-fade` y `--color-red`, nunca los alias `--color-bg` ni `--color-text`, que son los únicos que se intercambian bajo `.theme-dark`. Un gafete oscuro con el QR invertido sería ilegible en la puerta y sobre el papel.
- El fondo del gafete es deliberadamente plano, sin la textura de papel: el asset sigue siendo un placeholder y un tile escalado a 1280 es ruido alrededor de un QR.
- El QR del gafete no lleva logo, marco ni borde propios, y el `--color-red` no se usa en los módulos. Los módulos van `--color-ink` sobre `--color-paper-light` (18.97:1); cualquier color de contraste reducido degrada el escaneo en la puerta y más todavía en impresión.

## Pendientes conocidos

- Las viewports cortas siguen desbordando, y es un problema de contenido, no de layout. A 1366×768 la página mide 770px contra 681 de viewport y el CTA queda 41px bajo el fold; a 1280×800 mide 755 contra 713. El header son 102px y el hero 652–677px según el `--fs-hero` fluido. Para llegar a cero desborde en un 1366×768 hay que achicar el hero (`py-12` → `py-8` y el `neq` de 224 → 160px).
- Sin scroll: 1920×993, 1440×813, 1024×813, 768×813. CTA sobre el fold en todas salvo 1366×768.

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

## Assets pendientes del diseño

- Textura de papel 512×512.
- Arte final del símbolo ≠.
- Pinceles watercolor.
- Líneas orgánicas.
- Mapa de Honduras y uso final de MapPin.
- Fuentes originales con licencia.
