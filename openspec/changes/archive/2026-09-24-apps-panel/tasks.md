# Tasks

## 1. Ajustes de contrato y backend de check-in

- [x] 1.1 En `@convencion/shared-types`: eliminar `CheckInOutput.accesoPermitido` (**BREAKING**) a
      favor de devolver el `participante` (con `estadoPago` y `checkIn`) y agregar
      `participantId?` en `RegistrarParticipanteInput` (**BREAKING**) para el in-situ offline.
      **Verificación**: `pnpm --filter @convencion/shared-types typecheck` compila y los DTOs no
      referencian `accesoPermitido`.
- [x] 1.2 Implementar `services/api/src/handlers/checkin.ts`: `POST /checkin` con `GetItem` por
      `participantId` (404 si no existe), marca `checkIn = true` + `checkInTimestamp`, respeta el
      `participantId` provisto en el in-situ (colisión → 409) y devuelve el participante con su
      `estadoPago` constatado.
      **Verificación**: tests con `app.request` para check-in exitoso, repetido (mantiene la
      llegada), QR desconocido 404 e in-situ con `participantId` provisto.

## 2. Scaffolding de la app

- [x] 2.1 Crear `apps/panel` (React + Vite + Tailwind, `vite-plugin-pwa`), agregar `panels` al
      workspace y scripts `dev:panel`/`build:panel`; instalar `@convencion/api-client`,
      `@aws-amplify/auth` y el escáner de QR (`@zxing/browser`).
      **Verificación**: `pnpm --filter @convencion/panel build` compila y la PWA genera el service
      worker en el build.

## 3. Autenticación y navegación por rol

- [x] 3.1 Implementar login con Amplify Auth, guard de rutas por grupo (landing admin → `/dashboard`,
      staff → `/checkin`; staff NO ve pagos/equipos) y `getToken`/`onUnauthorized` sobre
      `createApiClient`.
      **Verificación**: `pnpm --filter @convencion/panel build` compila; prueba manual con dos
      cuentas (admin y staff) verifica el landing y la ocultación de vistas.

## 4. Vistas de administración

- [x] 4.1 Dashboard: tarjetas de stats (inscritos, pagados, pendientes, in situ, llegados) derivadas
      de `listarParticipantes`, con búsqueda por nombre (filtro client-side).
      **Verificación**: build compila y prueba manual muestra los conteos correctos contra datos de
      prueba.
- [x] 4.2 Vista de revisión de pagos: bandeja por estado, previsualiza el comprobante
      (`vistaComprobanteUrl`) y aprueba/rechaza; al aprobar/rechazar actualiza la bandeja.
      **Verificación**: build compila y prueba manual con un pendiente verifica previsualización y
      transición de estado.
- [x] 4.3 Vista de equipos: genera (con confirmación), muestra por color, bloquea y ofrece
      imprimir/exportar el listado.
      **Verificación**: build compila y prueba manual genera y bloquea la asignación.

## 5. Vistas de campo

- [x] 5.1 Vista de check-in: escaneo de QR con cámara y búsqueda por nombre; muestra nombre + estado
      de pago, registra la llegada (constatando el estado, sin bloquear) y avisa si el QR es
      desconocido.
      **Verificación**: build compila y prueba manual con un QR real registra la llegada y muestra
      constancia del estado.
- [x] 5.2 Vista de registro in situ: formulario (datos + encargado si aplica), genera el QR en el
      momento y marca el pago confirmado.
      **Verificación**: build compila y prueba manual crea un registro y muestra el QR.

## 6. Modo contingencia offline

- [x] 6.1 Crear la capa de cola local (IndexedDB con `idb`): encola check-ins y registros in situ,
      estado global `online/offline/syncing`, indicador "X sin sincronizar" y sincronización en
      orden al reconectar (limpia la cola solo con 2xx).
      **Verificación**: prueba manual con red desactivada (DevTools offline) verifica que la
      operación funciona, queda en cola, persiste al recargar y se sincroniza al volver la red.
- [x] 6.2 Índice local de participantes (id, nombre, `estadoPago`, `equipoColor`, `checkIn`) usado
      por el check-in y la búsqueda off-line, mantenido con las respuestas de `listarParticipantes`.
      **Verificación**: build compila y la búsqueda/check-in funcionan con la red desactivada.

## 7. Diseño mobile-first

- [x] 7.1 Layout responsive del panel (vertical/horizontal, tablets, laptop): controles táctiles
      grandes, sin scroll horizontal, check-in full-screen.
      **Verificación**: `pnpm --filter @convencion/panel build` compila y revisión visual en 3
      tamaños de pantalla.

## 8. Verificación final

- [x] 8.1 Ejecutar `pnpm -r typecheck`, `pnpm -r build` y `pnpm --filter @convencion/api test` en
      verde.
      **Verificación**: los tres comandos terminan sin errores.