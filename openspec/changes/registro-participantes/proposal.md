# Proposal

## Contexto

El repositorio es el monorepo `convencion-juvenil-2026` del sistema de inscripción para la
Convención Anual (hasta 800 asistentes). Ya existe el andamiaje (pnpm workspaces,
`@convencion/shared-types`, `@convencion/api-client` y los handlers de `services/api` como
stubs con TODO). El flujo del sistema empieza por el registro de participantes: sin él no
hay revisión de pagos, equipos ni check-in.

## Why

El módulo de registro es el corazón del sistema: todo lo demás (pagos, equipos, check-in)
depende de que un participante exista con un QR. Hoy el handler `registro.ts` solo devuelve
`501 Not Implemented`; hay que convertirlo en la operación que da de alta a los asistentes,
ya sea por el formulario en línea o directamente en el evento.

## What Changes

- Implementar el handler `registro` (POST `/inscripciones`):
  - Alta de participante **online**: estado `pendiente`, con comprobante de pago subido a
    S3 privado y `correo` (opcional) guardado en el registro.
  - Alta **in situ**: estado `pagado` (confirmado por el staff en el momento), sin esperar
    revisión de comprobante.
  - Generar `participantId` (UUID) al finalizar el registro; ese valor **es** el código QR.
- Soporte de registro por **encargado** (un adulto que inscribe a un participante), dejando
  ambos vinculados en el mismo registro.
- Subida del comprobante de pago (imagen/PDF) a un bucket S3 privado mediante **pre-signed
  URL**, para que el archivo nunca pase por Lambda.
- Entrega del valor del código QR (`codigoQr = participantId`) en la respuesta del registro;
  la imagen QR la genera y muestra el formulario web al finalizar el proceso (sin envío por
  correo).
- Validación de inputs con **zod** en el handler (la propuesta técnica lo deja pendiente de
  andamiaje; se incorpora como parte de este cambio).
- Ajustes a `@convencion/shared-types` (DTOs de registro, comprobante y pre-signed URL) y a
  `@convencion/api-client` (métodos para registrar y obtener la URL de subida).
- Refactor del stub `lib/dynamo.ts` para tipar las operaciones de participación.
- Nueva app pública **`apps/registro`** (React + Vite + Tailwind) con el formulario web:
  flujo propio/encargado, captura de datos, carga del comprobante (PUT directo a S3) y
  pantalla final que muestra el QR del participante para guardar o imprimir.

## Capabilities

### New Capabilities
- `registro`: alta de participantes (online e in situ) con QR y carga de comprobante de
  pago a S3, sin envío de correo.
- `formulario-registro`: formulario público web para que el participante (o su encargado)
  complete los datos, cargue el comprobante y obtenga su QR al finalizar.

### Modified Capabilities
- Ninguna: no existen specs previas en el proyecto.

## Non-goals

- PWA de campo e infraestructura CDK: se abordan en changes propios cuando corresponda.
- Envío del QR por correo: el `correo` se almacena, pero no se despacha ninguna notificación
  en esta fase.
- Revisión de pagos (bandeja de aprobación), generación de equipos y check-in de llegada:
  son módulos posteriores con sus propios handlers.
- Autenticación de administradores/staff (Cognito).
- Notificación de comprobante rechazado (es parte del módulo de revisión de pagos).

## Impact

- **`services/api`**: `src/handlers/registro.ts` (de stub a implementación), `src/lib/dynamo.ts`
  (tipado + operaciones de participación), nueva `src/repos/participantes.ts`, y las
  librerías `src/lib/comprobante.ts` (S3 pre-signed) y `src/lib/validacion.ts` (zod).
- **`packages/shared-types`**: DTOs `RegistrarParticipanteInput/Output` ampliados (con
  `correo?`), nuevos DTOs de pre-signed URL.
- **`packages/api-client`**: método `solicitarComprobanteUpload` y ajuste de
  `registrarParticipante`.
- **`apps/registro` (nuevo)**: app React + Vite + Tailwind en el workspace; consume
  `@convencion/api-client` y usa `qrcode.react`; se agrega `apps/*` a `pnpm-workspace.yaml`.
- **Dependencias nuevas backend**: `zod`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
  (+ `vitest` como dev). **Frontend**: `qrcode.react`.
- **No afecta**: handlers de pagos, equipos y check-in; apps/admin y apps/campo;
  infraestructura CDK.