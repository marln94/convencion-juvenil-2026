# Tasks

## 1. Tipos compartidos

- [x] 1.1 En `@convencion/shared-types`, agregar `BandejaPagosItem` (con `tieneComprobante` y
      `vistaComprobanteUrl`) y ampliar `RevisarPagoOutput` con `revisadoEn` y `motivoRechazo?`,
      exportándolos.
      **Verificación**: `pnpm --filter @convencion/shared-types typecheck` compila.

## 2. Repositorio y librerías

- [x] 2.1 Ampliar `services/api/src/repos/participantes.ts` con `listarPorEstadoPago(estado)`
      (Query sobre `GSI-EstadoPago`) y `actualizarEstadoPago(id, { estado, motivoRechazo? })` que
      valide la transición (`pendiente → pagado | rechazado`, `rechazado → pagado`) y responda 409
      a transiciones inválidas.
      **Verificación**: tests con client mockeado para cada transición válida y una inválida que
      produce 409.
- [x] 2.2 Crear `services/api/src/lib/comprobante.ts` (o ampliar la existente) con
      `firmarLecturaComprobante(s3Key)` para presignar un `GetObjectCommand` de lectura de 5
      minutos.
      **Verificación**: test que devuelve una `vistaUrl` firmada para la `s3Key` pedida.

## 3. Handler

- [x] 3.1 Implementar en `services/api/src/handlers/revisar-pago.ts` las rutas `GET /pagos/:estado`
      (bandeja con `vistaComprobanteUrl` opcional) y `POST /pagos/revisar` (aprueba/rechaza,
      constancia sin cambiar el QR), preservando `handler`/`default` y agregando `app.onError`.
      **Verificación**: tests con `app.request` para bandeja de pendientes, aprobación, rechazo,
      re-aprobación, transición inválida 409 y constancia del motivo al rechazo.

## 4. Cliente de API

- [x] 4.1 Conectar en `@convencion/api-client` los métodos de bandeja (`listarBandejaPagos`) y
      `revisarPago` con los DTOs ampliados.
      **Verificación**: `pnpm --filter @convencion/api-client typecheck` compila.

## 5. Verificación final

- [x] 5.1 Ejecutar `pnpm -r typecheck`, `pnpm -r build` y `pnpm --filter @convencion/api test` en
      verde.
      **Verificación**: los tres comandos terminan sin errores.