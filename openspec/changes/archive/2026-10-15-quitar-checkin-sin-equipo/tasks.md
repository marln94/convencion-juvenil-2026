# Tasks

## 1. Quitar la acción "Registrar sin equipo" de la confirmación

- [x] 1.1 En `apps/panel/src/vistas/Checkin.tsx`, eliminar el botón "Registrar sin equipo" de la tarjeta de confirmación (líneas 357-363) y actualizar el comentario de `manejarLlegada` (líneas 300-301) para que describa las dos acciones restantes. Verificar con `pnpm --filter @convencion/panel typecheck`.
- [x] 1.2 Revisar que la tarjeta sigue mostrando "Asignar y registrar" y "Cancelar" en ambos modos (escaneo QR y búsqueda). Verificar visualmente en `pnpm dev:panel`.

## 2. Cerrar la rama que registra sin equipo

- [x] 2.1 En `manejarLlegada` de `Checkin.tsx`, cuando `decidirEquipoParaLlegada` no devuelva equipo, mostrar un error con `setErrorLocal` y no llamar a `registrarLlegada`. Verificar con `pnpm --filter @convencion/panel typecheck`.
- [x] 2.2 Confirmar que ningún camino del check-in llama a `registrarLlegada` sin `equipoColor` (revisar la firma y sus llamadas). Verificación: lectura del archivo; la única llamada sin equipo ya no existe.

## 3. Verificación funcional

- [x] 3.1 Escanear y buscar a un participante con pago pendiente o rechazado sin equipo, tocar "Registrar" y verificar que la confirmación solo ofrece "Asignar y registrar" y "Cancelar"; al asignar, el equipo se asigna y la llegada se registra.
- [x] 3.2 Cancelar la confirmación de un participante con pago pendiente o rechazado y verificar que no se asigna equipo ni se registra la llegada.
- [x] 3.3 Confirmar que un participante con pago `pagado` sigue asignándose y registrándose sin confirmación.
- [x] 3.4 Ejecutar la suite del panel con `pnpm --filter @convencion/panel test` y verificar que pasa.
