# Proposal

## Contexto

Módulo 2 de la propuesta funcional: los organizadores confirman **manualmente** cada comprobante
de transferencia bancaria (no hay pasarela de pago). El handler `revisar-pago.ts` es hoy un stub
que responde 501. La revisión es el módulo que determina cuántas personas tienen pago confirmado
antes y durante el evento (alimenta el sorteo de equipos y la constatación de pago en el
check-in).

## Why

Sin revisión de pagos el sistema no puede distinguir `pendiente`/`pagado`/`rechazado`: la
generación de equipos solo sortea a los pagados y el check-in constata el estado de pago al
momento de la llegada. Es el siguiente eslabón después del registro.

## What Changes

- Bandeja de comprobantes: `GET /pagos/pendientes` (y por estado) ordenada por `fechaRegistro`,
  con **URL firmada** para previsualizar la imagen/PDF del comprobante sin exponer el bucket
  privado.
- `POST /pagos/revisar` con `{ participantId, decision: aprobar|rechazar, motivoRechazo? }`:
  actualiza `estadoPago` del participante (`RevisarPagoInput` ya existe en `shared-types`).
- Constancia: el estado queda en el participante; el QR **no cambia** (mismo `participantId`).
- Transiciones permitidas: `pendiente → pagado | rechazado` y `rechazado → pagado` (re-aprobación).

## Capabilities

### New Capabilities

- `revision-pagos`: bandeja de comprobantes, aprobación/rechazo manual con URL firmada de
  previsualización y constancia del estado de pago.

### Modified Capabilities

- Ninguna: `registro` no cambia; la revisión opera sobre sus datos y mantiene el QR intacto.

## Non-goals

- Pasarela de pago automática: la revisión sigue siendo 100% manual.
- Re-subida de comprobante desde el panel: la re-subida se hace por el formulario público (flujo
  ya existente del registro).
- Deshacer una aprobación de forma implícita: la decisión es solo del admin.
- Envío de notificaciones por correo (SES): fuera de alcance, el sistema no envía correos.

## Impact

- **`services/api`**: `revisar-pago.ts` de stub a implementación (bandeja + revisar), repositorio
  (listar por estado, actualizar), firma de URLs de previsualización (reutiliza S3 presigner).
- **`packages/shared-types`**: DTOs de bandeja y respuesta de revisión (amplían los existentes).
- **`packages/api-client`**: métodos de bandeja y `revisarPago` conectados a los endpoints.
- **Dependencias**: endpoint protegido por rol (solo `admin`); requiere `auth` y la previsualización
  requiere CORS/URLs firmadas del bucket privado (`infra-cdk`).