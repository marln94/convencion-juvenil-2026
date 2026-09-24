# Proposal

## Contexto

Decisión de arquitectura consolidada: en lugar de dos apps internas (`apps/admin` y `apps/campo`)
habrá **una sola app** `apps/panel` (PWA, mobile-first) con las vistas del equipo organizador
(dashboard, revisión de pagos, equipos, búsqueda) y las de campo (check-in con escaneo QR,
registro in situ, búsqueda). **admin ⊇ staff**: los administradores ven y operan también las
vistas de campo. El lugar del evento es remoto y sin internet garantizado: el primer login exige
señal, pero luego la app debe **tolerar la pérdida de conexión** durante la operación.

## Why

Un solo panel reduce infraestructura, reutiliza componentes (buscador, tarjeta de participante,
render del QR) y permite que los organizadores ayuden directamente en el check-in. Consolidar
además hace obligatorio el modelo offline real del modo campo: la política decidida es que el
check-in **nunca bloquea** — siempre registra la llegada y constata el estado de pago — lo que
permite decidir con datos en caché cuando no hay señal.

## What Changes

- Nueva app `apps/panel` (React + Vite + Tailwind, **PWA** con service worker) en el workspace,
  mobile-first (teléfonos/tablets; layout landscape para la mesa de check-in; laptop tolerado).
- Login con Cognito con landing según grupo: `admin → /dashboard`, `staff → /checkin`. Sesión con
  token persistido (refresco silencioso cuando hay señal).
- **Vista ADMIN**: dashboard (stats: inscritos, pagados, pendientes, in situ, llegados), bandeja de
  revisión de pagos (previsualiza el comprobante y aprueba/rechaza), gestión de equipos (generar,
  ver por color, bloquear, exportar/imprimir), búsqueda de participante. Los admins también ven las
  vistas de campo.
- **Vista STAFF**: check-in (escaneo QR con cámara o búsqueda por nombre; registra la llegada y
  constata el estado de pago, entregando banda siempre) y registro in situ (genera QR al momento).
- **Modo contingencia (offline graceful)**: si se pierde la señal, busca en caché local, acumula
  en cola (check-in e in situ), muestra "X sin sincronizar" y sincroniza al volver la señal; la
  cola persiste en IndexedDB y nada se pierde.
- Registro in situ offline: genera el `participantId` en el dispositivo para mostrar el QR de
  inmediato y lo sube al sincronizar (**BREAKING**: `RegistrarParticipanteInput.participantId?`).
- Check-in en línea: usa `GetItem` real (DynamoDB); en contingencia, decide con el dato en caché.
  El DTO `CheckInOutput.accesoPermitido` se reemplaza por la constatación del estado
  (**BREAKING** sobre `shared-types`).
- `@convencion/api-client`: cliente autenticado con token Cognito y capa de sincronización de la
  cola local.

## Capabilities

### New Capabilities

- `panel`: app única interna con vistas admin y staff, separación por roles, diseño mobile-first y
  modo contingencia offline con cola local y sincronización.
- `check-in`: registro de llegada del asistente por QR o nombre; constata el estado de pago sin
  bloquear el acceso y deja constancia en el registro.

### Modified Capabilities

- Ninguna de las existentes (`registro`, `formulario-registro`) cambia de requisito; el registro
  in situ reutiliza el flujo ya especificado de `registro`.

## Non-goals

- Despliegue/CDN y creación de y recursos AWS: pertenece a `infra-cdk`.
- Creación del pool/grupos Cognito y autorización de la API: pertenece a `auth`.
- Gestión de usuarios (crear cuentas de staff, resetear contraseñas): fuera de alcance.
- Reenvío del QR por correo: la constancia queda en pantalla y en el registro.

## Impact

- **`apps/panel` (nuevo)** : app React + Vite + Tailwind PWA; se agrega al `pnpm-workspace.yaml`.
- **`packages/api-client`**: autenticación de requests, sync de cola, nuevos métodos (pagos,
  equipos, búsqueda, check-in).
- **`packages/shared-types`**: `CheckInOutput` sin `accesoPermitido` (**BREAKING**) y
  `RegistrarParticipanteInput` con `participantId?` (**BREAKING**).
- **`services/api`**: handler `checkin.ts` de stub a implementación (constatación).
- **Dependencias**: consume `auth`, `busqueda-participantes`, `revision-pagos`,
  `generacion-equipos` e `infra-cdk`.