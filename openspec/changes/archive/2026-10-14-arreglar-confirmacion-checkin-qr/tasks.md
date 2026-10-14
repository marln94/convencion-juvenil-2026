# Tasks

## 1. Extraer la tarjeta de confirmación

- [x] 1.1 En `apps/panel/src/vistas/Checkin.tsx`, sacar el bloque `{confirmacion ? <Card>…</Card> : null}` de la rama `modo === 'buscar'` y ubicarlo después del `VistaHeader`, antes del ternario que renderiza el escáner o la lista de búsqueda. Verificar que la tarjeta sigue mostrando "Asignar y registrar", "Registrar sin equipo" y "Cancelar" en modo búsqueda.
- [x] 1.2 Ajustar el espaciado/clases de la tarjeta movida (por ejemplo `mb-4`/`print-area`) para que no desplace la cámara en modo escaneo ni la ficha del participante, y verificar visualmente ambos modos con `pnpm dev:panel`.

## 2. Verificación funcional

- [x] 2.1 Escanear el QR de un participante con pago pendiente o rechazado sin equipo, tocar "Registrar llegada" y verificar que aparece la confirmación con las tres opciones; confirmar que "Asignar y registrar" asigna el equipo y registra la llegada.
- [x] 2.2 Repetir el flujo en modo búsqueda por nombre y verificar que la confirmación y el comportamiento son idénticos al escaneo.
- [x] 2.3 Verificar que un participante con pago `pagado` sigue asignándose automáticamente sin confirmación en ambos modos, y que un participante que ya llegó no ofrece registrar.

## 3. Calidad

- [x] 3.1 Ejecutar `pnpm --filter @convencion/panel typecheck` y asegurar que no hay errores.
- [x] 3.2 Ejecutar `pnpm --filter @convencion/panel test` y asegurar que la suite pasa.
- [x] 3.3 Ejecutar `pnpm verify:design` y asegurar que no hay regresiones del design system.
