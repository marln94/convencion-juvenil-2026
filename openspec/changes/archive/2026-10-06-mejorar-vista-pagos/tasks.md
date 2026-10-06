# Tasks

## 1. API: motivo de rechazo en la bandeja

- [x] 1.1 Agregar `motivoRechazo?: string` a `BandejaPagosItem` en `packages/shared-types/src/dtos.ts` y mapearlo en `services/api/src/handlers/revisar-pago.ts` desde `participante.motivoRechazo` — verificar con `pnpm --filter @convencion/shared-types typecheck && pnpm --filter @convencion/api typecheck`
- [x] 1.2 Ampliar `services/api/src/handlers/revisar-pago.test.ts` para cubrir el item con `motivoRechazo` presente y el que no lo incluye — verificar con `pnpm --filter @convencion/api test`

## 2. Design system: variante ghost

- [x] 2.1 Agregar `"ghost"` a `ButtonVariant` en `packages/ui/src/components/ui/Button.tsx` y crear `.btn--ghost` / `.btn--ghost:hover` en `packages/ui/src/styles/components.css` (fondo transparente, texto `--color-ink`, borde transparente, hover `var(--color-paper)`, sin `color-mix()`) — verificar con `pnpm --filter @convencion/ui typecheck` y que `.btn--ghost` aparezca en el CSS construido
- [x] 2.2 Verificar que `pnpm build && pnpm verify:design` pase (selectores requeridos y ratios de contraste siguen cumpliendo)

## 3. UI: fila compacta en Pagos.tsx

- [x] 3.1 Reescribir el `Card` de `apps/panel/src/vistas/Pagos.tsx` como fila única `flex flex-wrap items-center gap-2 p-2` con nombre + fecha corta (`dateStyle: 'short', timeStyle: 'short'`), sin correo, pill en línea para estados no pendientes y acciones alineadas a la derecha — verificar con `pnpm --filter @convencion/panel typecheck`
- [x] 3.2 Reemplazar el `<a href="#">` por `<a class="btn btn--ghost btn--sm" target="_blank">Ver comprobante</a>` cuando `tieneComprobante && vistaComprobanteUrl`, o `<button disabled type="button">Sin comprobante</button>` cuando no — verificar con `pnpm --filter @convencion/panel typecheck`
- [x] 3.3 Renderizar `item.motivoRechazo` como línea `text-xs` bajo la fila sólo cuando exista, manteniendo el formulario de rechazo inline — verificar con `pnpm --filter @convencion/panel typecheck`
- [x] 3.4 Revisión manual con `pnpm dev:panel`: ≥8 filas visibles en laptop, botón fantasma neutro, "Sin comprobante" no navega ni es enfocable, fila envuelve sin encimar en viewport angosto, motivo visible en la pestaña Rechazados

## 4. Verificación integral

- [x] 4.1 Ejecutar `openspec validate mejorar-vista-pagos --strict` y `pnpm typecheck` — sin errores
- [x] 4.2 Ejecutar `pnpm --filter @convencion/api test`, `pnpm --filter @convencion/panel test` y `pnpm build && pnpm verify:design` — todo en verde
