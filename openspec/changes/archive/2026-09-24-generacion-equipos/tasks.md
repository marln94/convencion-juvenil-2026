# Tasks

## 1. Tipos compartidos

- [x] 1.1 En `@convencion/shared-types`, ampliar los DTOs de equipos: `ConfiguracionEquiposInput`
      (`colores`), `EquiposAsignacionOutput` (participante → color y agrupado por color) y
      `BloquearEquiposOutput`, exportándolos.
      **Verificación**: `pnpm --filter @convencion/shared-types typecheck` compila.

## 2. Repositorio y librerías

- [x] 2.1 Crear `services/api/src/repos/configuracion.ts` con `obtenerConfiguraciónEquipos()`,
      `bloquearEquipos()` y `actualizarColores(colores)` sobre la tabla `Configuracion`.
      **Verificación**: tests con client mockeado del get, del bloqueo idempotente y del update de
      colores.
- [x] 2.2 Crear `services/api/src/lib/sorteo.ts` con `sortearEquipos(ids, colores)` que baraja
      (Fisher–Yates con semilla) y reparte balanceado con diferencia máxima de 1.
      **Verificación**: tests de balance (diferencia ≤ 1) con N no divisible por 13 y de
      determinismo con la misma semilla.

## 3. Handler

- [x] 3.1 Implementar en `services/api/src/handlers/generar-equipos.ts`: `POST /equipos/generar`
      (query de pagados por `GSI-EstadoPago`, sorteo, `BatchWriteItem` en chunks de 25 con la
      condición de bloqueo; 409 si `bloqueado`), `POST /equipos/bloquear`, `POST /equipos/config` y
      `GET /equipos/:color`/`GET /equipos` (asignación por color y completa vía `GSI-Equipo`).
      **Verificación**: tests con `app.request` para generación balanceada, bloqueo (regenerar
      bloqueado → 409), actualización de colores y consultas por color/completa.

## 4. Cliente de API

- [x] 4.1 Conectar en `@convencion/api-client` los métodos `generarEquipos`, `bloquearEquipos`,
      `configEquipos` y las consultas por color/completa con los DTOs nuevos.
      **Verificación**: `pnpm --filter @convencion/api-client typecheck` compila.

## 5. Verificación final

- [x] 5.1 Ejecutar `pnpm -r typecheck`, `pnpm -r build` y `pnpm --filter @convencion/api test` en
      verde.
      **Verificación**: los tres comandos terminan sin errores.