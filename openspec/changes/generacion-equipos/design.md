# Design

## Context

Ver proposal.md - Why. El handler `generar-equipos.ts` es un stub. La tabla `Configuracion`
guarda `bloqueado` y `colores`; `GSI-EstadoPago` permite obtener los pagados y `GSI-Equipo` listar
por color (definidos en la propuesta técnica y materializados en `infra-cdk`). El algoritmo de la
propuesta técnica es: query de pagados → barajar → repartir balanceado → `BatchWriteItem` del
`equipoColor` → rechazar si `bloqueado`.

## Goals / Non-Goals

**Goals:**
- Sorteo balanceado con diferencia ≤ 1.
- Bloqueo de la asignación atómico y idempotente.
- Colores configurables desde `Configuracion`.

**Non-Goals:**
- Ajustes manuales de equipos post-generación.
- Historial de generaciones anteriores.

## Decisions

### 1. Reparto "deal" balanceado sobre una lista barajada

Se baraja la lista de participantes pagados (Fisher–Yates) y se reparten los colores en rondas
(uno por color por ronda). Con N ≤ 800 la lista cabe en memoria del Lambda.

- **Por qué**: cumple la diferencia ≤ 1 y es trivial de testear con determinismo de semilla.
- **Alternativa considerada**: round-robin sobre colores sin barajar — produce el mismo balance
  pero sin aleatoriedad real si el orden de entrada es estable.

### 2. `BatchWriteItem` en chunks de 25

DynamoDB acepta hasta 25 ítems por `BatchWriteItem`; se parten los `UpdateItem` de `equipoColor`
en chunks y se reintenta por chunk ante fallo parcial.

### 3. Bloqueo atómico con condición en `Configuracion`

Regenerar solo procede si `Configuracion.bloqueado` no es `true` (condición en el `UpdateItem`);
dos generaciones simultáneas no pueden pisarse. `bloquear` es un `UpdateItem` simple de
`bloqueado = true` con `fechaGeneracion` actualizada.

### 4. Colores con default en código

Si `Configuracion` no tiene `colores`, se usa la lista por defecto de 13 colores; al actualizarla
se persiste en la tabla y las siguientes generaciones la usan.

## Risks / Trade-offs

- [Regenerar descarta la asignación anterior (incluyendo check-ins ya constatados)] → Mitigación:
  el bloqueo protege la versión final; antes del evento se regenera libremente. Si ya hubo
  check-ins, el admin lo acepta al desbloquear/re-generar.
- [Fallos parciales de `BatchWriteItem`] → Mitigación: reintento por chunk y logueo; a 800 ítems es
  infrecuente.

## Migration Plan

Sin despliegue previo; rollback = revert del commit. Los GSI se materializan en `infra-cdk`.