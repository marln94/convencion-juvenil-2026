# Tasks

## 1. DTO y backend

- [x] 1.1 Agregar `fechaRegistro: string` a `ResumenParticipante` en `packages/shared-types/src/dtos.ts` y
      verificar que `pnpm --filter @convencion/shared-types typecheck` pase
- [x] 1.2 Poblar `fechaRegistro` en `aResumen()` de `services/api/src/repos/participantes.ts` y verificar con
      `pnpm --filter @convencion/api test` (esperado: fallan las expectativas `toEqual` de
      `repos/participantes.test.ts`, ver 1.3)
- [x] 1.3 Actualizar fixtures/expectativas de tests del API: `repos/participantes.test.ts` (los `toEqual` de
      listado que comparan el resumen completo) y `handlers/generar-equipos.test.ts` (fixture
      `resumenRojo`), verificando que `pnpm --filter @convencion/api test` quede en verde
- [x] 1.4 Agregar un escenario de cobertura al test de `listarParticipantes` que afirme que cada ítem
      incluye `fechaRegistro` y verificar que el test pasa

## 2. Constructores del panel (quiebre de tipos esperado)

- [x] 2.1 Actualizar `aResumen()` en `apps/panel/src/vistas/Checkin.tsx:13` para incluir
      `fechaRegistro: participante.fechaRegistro` y verificar con `pnpm --filter @convencion/panel typecheck`
- [x] 2.2 Actualizar `agregarAlIndice(...)` en `apps/panel/src/vistas/Pagos.tsx:50` para incluir
      `fechaRegistro: resultado.participante.fechaRegistro` y verificar el typecheck del panel
- [x] 2.3 Actualizar `agregarAlIndice(...)` en `apps/panel/src/vistas/RegistroInsitu.tsx:144` para incluir
      `fechaRegistro: new Date().toISOString()` y verificar el typecheck del panel
- [x] 2.4 Actualizar el fixture `resumen()` de `apps/panel/src/lib/cola.test.ts:50` y verificar con
      `pnpm --filter @convencion/panel test`

## 3. Dashboard: lista por defecto, orden y labels

- [x] 3.1 Derivar `ordenados` en `VistaDashboard` con `useMemo` sobre `todos` ordenado por
      `fechaRegistro` descendente (con guard `?? ''`) y hacer que la lista sin filtro muestre
      `ordenados.slice(0, 10)`; verificar que `pnpm --filter @convencion/panel typecheck` pasa
- [x] 3.2 Quitar el `slice(0, 30)` de los resultados de búsqueda para mostrar todas las coincidencias y
      ordenar también `resultados` por `fechaRegistro` descendente
- [x] 3.3 Agregar la guarda de obsolescencia al efecto de búsqueda (contador de solicitud; solo aplica si es
      la más reciente) y verificar que un resultado viejo no pisa al nuevo
- [x] 3.4 Agregar los labels en `Dashboard.tsx`: encabezado `<h2>` "Últimos inscritos" con
      "Mostrando los 10 más recientes de {todos.length}" sin filtro, y "{n} coincidencias para
      «{texto}»" / "Sin coincidencias" con filtro; verificar el marcado con
      `pnpm verify:design`
- [x] 3.5 Verificar manualmente con `pnpm dev:panel` en `#/dashboard`: sin filtro se ven 10 filas con el
      label y el contador; al filtrar se ven todas las coincidencias ordenadas; filtrando un nombre
      inexistente aparece "Sin coincidencias"; borrar el filtro restaura la lista de 10

## 4. Verificación integral

- [x] 4.1 Correr `pnpm typecheck` y `pnpm build` en la raíz del monorepo y verificar que terminan sin errores
- [x] 4.2 Correr la suite completa del repo (tests de `services/api` y `apps/panel`) y verificar que pasa
- [x] 4.3 Validar el cambio con `openspec validate dashboard-ultimos-inscritos --strict` y verificar que aprueba
