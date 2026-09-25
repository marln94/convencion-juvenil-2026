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
- Brush usa fallback SVG con offsets, rotations y sizes responsive.
- `.t-eyebrow` conserva `--font-fine`, `--fs-eyebrow` y sin transformaciones de texto.
- Input y Select indican foco mediante el borde; Button y DayPicker usan outline rojo.
- Alert usa borde completo por variante y StepIndicator usa una track de 5 px.
- El documento de registro no hace scroll en móvil; `main` es el área desplazable.

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
