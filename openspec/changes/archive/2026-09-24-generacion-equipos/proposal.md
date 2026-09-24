# Proposal

## Contexto

Módulo 4 de la propuesta funcional: con la lista de participantes pagados, el sistema divide a los
asistentes en los **13 grupos** identificados por bandas de color. El handler
`generar-equipos.ts` es hoy un stub 501. La asignación es la que permite entregar la banda de
color el día del evento en el check-in, y alimenta el snapshot de la vista de campo del panel.

## Why

Sin asignación de equipos no hay bandas de color que entregar. Además, la generación debe poder
repetirse cuantas veces se quiera antes del evento y **bloquearse** en la versión final para evitar
cambios de último momento.

## What Changes

- `POST /equipos/generar`: consulta participantes con `estadoPago = pagado` (vía
  `GSI-EstadoPago`), baraja en memoria y reparte los 13 colores de forma **balanceada** (diferencia
  máxima de 1 integrante entre grupos), y `BatchWrite` actualiza `equipoColor`.
- Bloqueo: si `Configuracion.bloqueado = true` se rechaza una regeneración con 409 y mensaje;
  `POST /equipos/bloquear` fija el bloqueo de la asignación final.
- Configuración de colores: los 13 colores se leen de la tabla `Configuracion` (campo `colores`)
  y se pueden actualizar sin tocar código (`POST /equipos/config`).
- Consulta: `GET /equipos` devuelve la asignación (por participante y por color) y
  `GET /equipos/:color` lista los integrantes de una banda (vía `GSI-Equipo`) para exportar/imprimir.
- Regla: solo participan los pagados; si no hay suficientes, se reparte entre los que hay.
- `GenerarEquiposOutput` (asignación + bloqueado) ya existe; se amplía con el listado por color.

## Capabilities

### New Capabilities

- `generacion-equipos`: sorteo aleatorio y balanceado en 13 bandas de color, bloqueo de la
  asignación final, configuración de colores y consulta por color/participante.

### Modified Capabilities

- Ninguna: opera sobre `registro` sin cambiar sus requisitos (usa su `estadoPago`).

## Non-goals

- Ajuste manual de equipos (mover personas entre colores): la generación es automática; los
  ajustes puntuales se consideran en un change posterior.
- Exportación a PDF/impresión del listado: es render del frontend (`apps-panel`) sobre la lista
  que devuelve la API.
- Regenerar equipos con `bloqueado = true` incluso durante el evento: intencional (protección).

## Impact

- **`services/api`**: `generar-equipos.ts` de stub a implementación (generar, bloquear, config,
  listar), repositorio `configuracion` (bloqueo/colores) y lib de sorteo balanceado.
- **`packages/shared-types`**: DTOs de configuración de equipos y listado por color.
- **`packages/api-client`**: métodos `generarEquipos`, `bloquearEquipos`, `configEquipos` y
  consulta por color.
- **Dependencias**: requiere `GSI-EstadoPago` y `GSI-Equipo` en DynamoDB (materializados en
  `infra-cdk`) y la constancia de pagos de `revision-pagos`.