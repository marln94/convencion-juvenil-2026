# Design

## Context

Ver proposal.md - Why. El handler `revisar-pago.ts` es un stub. La tabla `Participantes` define
`GSI-EstadoPago` (`estadoPago` → `fechaRegistro`) y el comprobante vive en S3 (la subida por
presigned URL ya está implementada en `registro.ts`).

## Goals / Non-Goals

**Goals:**
- Bandeja por estado + previsualización con URL firmada de lectura.
- Transición de estado con validación y constancia.

**Non-Goals:**
- Pasarela de pago automática.
- Re-subida del comprobante desde el panel.
- Envío de notificaciones por correo (SES).

## Decisions

### 1. Previsualización con presigned URL de lectura (GET directo), no proxy por Lambda

Se reutiliza la lib de presigner para firmar un `GetObjectCommand` de lectura (5 min). El navegador
abre la URL directo del bucket privado.

- **Por qué**: mismo patrón ya usado en la subida; cero bytes pasando por Lambda.
- **Alternativa considerada**: endpoint proxy que sirve el archivo — más costo y complejidad,
  innecesarios a este volumen.

### 2. Transiciones de estado validadas en el handler

Solo se permiten `pendiente → pagado | rechazado` y `rechazado → pagado`; cualquier otra se
responde 409. El `UpdateItem` fija `estadoPago`, `revisadoEn` (timestamp) y `motivoRechazo?`.

## Risks / Trade-offs

- [Admin aprueba sin mirar el comprobante] → Mitigación: UX del panel (`apps-panel`) obliga a
  previsualizar antes de la decisión.
- [Rechazo que deja al participante sin aviso] → Mitigación: el motivo queda constatado en el
  registro y es visible para el admin en la bandeja; no hay canal de notificación (sin SES).

## Migration Plan

Sin despliegue previo; rollback = revert del commit. Los estados ya existen en el modelo, no hay
migración de datos.