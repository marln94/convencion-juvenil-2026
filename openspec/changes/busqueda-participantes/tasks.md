# Tasks

## 1. Tipos compartidos

- [x] 1.1 En `@convencion/shared-types`, crear `ResumenParticipante` (id, nombre, `estadoPago`,
      `equipoColor`, `checkIn`) y los DTOs `ListarParticipantesInput/Output` (con
      `pagination { nextToken?, total }`) y `ObtenerParticipanteOutput`, exportándolos.
      **Verificación**: `pnpm --filter @convencion/shared-types typecheck` compila.

## 2. Repositorio

- [x] 2.1 Ampliar `services/api/src/repos/participantes.ts` con `listarParticipantes(filtros)` que
      use `Query` sobre `GSI-EstadoPago` (filtro de estado) o `Scan` paginado (sin filtro) con
      `LastEvaluatedKey`, y `obtenerParticipante(id)` existente.
      **Verificación**: tests con DynamoDB client mockeado que cubren el query con filtro, el scan
      paginado y el detalle por id.

## 3. Handlers

- [x] 3.1 Crear `services/api/src/handlers/listar-participantes.ts` con `GET /inscripciones`
      (paginación y filtros `estadoPago`, `tipoRegistro`, `checkIn`) y `GET /inscripciones/:id`
      (404 si no existe), montando las rutas en `serve.ts` y exportando `handler`/`default`.
      **Verificación**: tests con `app.request` para listado con y sin filtro, paginación, detalle
      exitoso y 404.

## 4. Cliente de API

- [x] 4.1 Conectar en `@convencion/api-client` los métodos `listarParticipantes` y
      `obtenerParticipante` al router (`endpoints.ts` ya los declara) con tipado de los DTOs
      nuevos.
      **Verificación**: `pnpm --filter @convencion/api-client typecheck` compila.

## 5. Verificación final

- [x] 5.1 Ejecutar `pnpm -r typecheck`, `pnpm -r build` y `pnpm --filter @convencion/api test` en
      verde.
      **Verificación**: los tres comandos terminan sin errores.