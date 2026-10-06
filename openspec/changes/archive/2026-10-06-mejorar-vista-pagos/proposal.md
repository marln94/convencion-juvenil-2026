# Proposal

## Why

La vista de revisión de pagos del panel renderiza cada participante como una tarjeta alta (padding de 1.5rem, tres líneas de texto y una fila de acciones separada), con un pitch de ~180px que sólo permite ver entre 3 y 4 participantes completos en un laptop antes de hacer scroll. Además, el enlace "Comprobante" es rojo (el color de acento/advertencia del sistema), su estado sin comprobante es un `<a href="#">` aparentemente deshabilitado que en realidad navega al hacer clic, y en la bandeja de rechazados no se muestra el motivo del rechazo aunque el sistema lo almacena.

## What Changes

- Las tarjetas de la bandeja pasan de tres filas de contenido a **una sola fila compacta**: nombre + fecha de registro (formato corto) a la izquierda y acciones a la derecha, con `flex-wrap` para pantallas angostas. El correo se omite de la fila.
- El botón de apertura del comprobante dice **"Ver comprobante"** y usa una **nueva variante `ghost`** del design system (neutra, sin rojo), distinguiéndose de "Aprobar" (primary/rojo) y "Rechazar" (outline).
- Cuando el participante no tiene comprobante, la acción se renderiza como `<button disabled>` real con el texto **"Sin comprobante"** (hereda `.btn:disabled`: opacity 0.5 y cursor not-allowed), eliminando el enlace a `#` actual.
- **BREAKING (API)**: `BandejaPagosItem` incorpora el campo opcional `motivoRechazo`, devuelto por `GET /pagos/:estado` para que la bandeja de rechazados muestre el motivo como línea adicional cuando existe.
- El design system expone una tercera variante de `Button` (`ghost`), además de `primary` y `outline`.

## Capabilities

### New Capabilities

<!-- Ninguna: este cambio modifica requisitos existentes. -->

### Modified Capabilities

- `revision-pagos`: el escenario "Participante sin comprobante" pasa a exigir una acción deshabilitada con texto explícito; la bandeja ahora expone `motivoRechazo` en cada item; se añade el requisito de presentar cada participante en una fila compacta (densidad en laptop).
- `design-system-components`: el requisito del componente `Button` pasa de dos variantes a tres, con el nuevo escenario de la variante `ghost`.

## Impact

- **Frontend**: `apps/panel/src/vistas/Pagos.tsx` (fila compacta, botón ver/deshabilitado, pill en línea, línea de motivo).
- **Design system**: `packages/ui/src/components/ui/Button.tsx` (tipo `ButtonVariant`) y `packages/ui/src/styles/components.css` (`.btn--ghost`); se agrega a las variantes consumidas por `apps/registro` sin cambios de comportamiento existente.
- **API**: `services/api/src/handlers/revisar-pago.ts` (mapeo del nuevo campo) y `packages/shared-types/src/dtos.ts` (`BandejaPagosItem`). El campo es opcional y aditivo: no rompe consumidores existentes.
- **Tests**: `services/api/src/handlers/revisar-pago.test.ts` amplía el assert de la bandeja. No hay pruebas de componentes en el panel (sin `@testing-library`), la verificación de UI es typecheck + build + revisión manual.
- **Sin cambios** en infraestructura, esquema de DynamoDB (`motivoRechazo` ya se persiste) ni en las demás vistas del panel.

## Non-goals

- Paginar, virtualizar o limitar la cantidad de ítems de la bandeja.
- Mostrar el correo del participante en la fila (se omite por completo; no se sustituye por tooltips).
- Convertir el formulario de rechazo en un diálogo o modal: se mantiene inline y expandido bajo la tarjeta correspondiente.
- Modificar el orden, la consulta o el índice de la bandeja.
- Cambiar las vistas de check-in, dashboard, equipos o registro.
- Agregar pruebas de componentes React al panel.
