# Tasks

## 1. Fuente única de validación de contacto

- [x] 1.1 Crear `packages/shared-types/src/contacto.ts` con `PATRON_TELEFONO`, `PATRON_CORREO`, `esTelefono()`, `esCorreo()`, `formatearTelefono()` (dígitos → `dddd-dddd`, guion solo con más de 4 dígitos, máximo 8 dígitos) y `normalizarTelefono()` (acepta `dddd-dddd` o 8 dígitos; devuelve `null` si no es válido), exportarlo desde `index.ts` — verificación: `pnpm --filter @convencion/shared-types build && pnpm --filter @convencion/shared-types typecheck` pasan y los helpers son importables desde `@convencion/shared-types`.

## 2. API: contacto solo teléfono con normalización

- [x] 2.1 Reemplazar en `services/api/src/lib/validacion.ts` los patrones locales por los compartidos; `contactoSchema` pasa a normalizar y exigir teléfono con mensaje `El contacto debe ser un teléfono 8877-9955`; `encargadoContacto` conserva teléfono-o-correo usando los patrones compartidos — verificación: `pnpm --filter @convencion/api typecheck` pasa y `pnpm --filter @convencion/api test` pasa tras actualizar los tests.
- [x] 2.2 Actualizar `services/api/src/lib/validacion.test.ts` y `services/api/src/handlers/registro.test.ts`: los casos con correo en `contacto` ahora esperan 400 con el mensaje nuevo, y agregar caso de normalización (`88779955` se guarda como `8877-9955`) — verificación: `pnpm --filter @convencion/api test` en verde.

## 3. Componente TelefonoInput

- [x] 3.1 Crear `packages/ui/src/components/ui/TelefonoInput.tsx` (envuelve `Input`: `type/inputMode/autocomplete="tel"`, placeholder `8877-9955`, formateo con `formatearTelefono`, sin validación propia) y exportarlo desde `ui/index.ts` — verificación: `pnpm --filter @convencion/ui typecheck` pasa y el build de ambos apps lo resuelve.
- [x] 3.2 Usar `TelefonoInput` en el campo `contacto` de `apps/registro/src/App.tsx` (manteniendo label, touched y error actuales) — verificación: `pnpm --filter @convencion/registro typecheck` pasa y al escribir `88779955` el campo muestra `8877-9955` en `pnpm dev:registro`.

## 4. Panel: formulario in-situ alineado con la web

- [x] 4.1 En `apps/panel/src/vistas/RegistroInsitu.tsx`: label `Teléfono (opcional)`, `TelefonoInput`, validación solo teléfono con `esTelefono`, mensajes idénticos a la web (`El contacto debe ser un teléfono 8877-9955`, `El correo no tiene un formato válido`), correo con `type="email"` — verificación: `pnpm --filter @convencion/panel typecheck` pasa y `validar()` ya no contiene `validarContacto`.
- [x] 4.2 Reemplazar el `Alert` único de error por errores inline por campo (mapa `tocados` + `errorDe(campo)` revalidando en vivo, marcando todos como tocados al enviar), siguiendo el patrón de `apps/registro/src/App.tsx` — verificación: `pnpm --filter @convencion/panel typecheck` pasa y en `pnpm dev:panel` un correo en el campo de teléfono muestra el error junto al campo, que desaparece al corregirlo.
- [x] 4.3 Escribir pruebas unitarias para `formatearTelefono`/`normalizarTelefono`/`esTelefono` en `apps/panel` (vitest ya disponible) cubriendo: 8 dígitos con y sin guion, guion fantasma tras backspace, rechazo de 7 u 9 dígitos — verificación: `pnpm --filter @convencion/panel test` en verde.

## 5. Rechazos veraces en el origen

- [x] 5.1 Hacer que `sincronizarCola` (`apps/panel/src/lib/cola.ts`) devuelva las `OperacionDescartada` de ese pase y que `sincronizar()` (`apps/panel/src/lib/sincronizacion.ts`) las propague; actualizar `cola.test.ts` para cubrir el retorno — verificación: `pnpm --filter @convencion/panel test` en verde.
- [x] 5.2 `RegistroInsitu.tsx`: filtrar las descartadas por su `participantId`; si la del registro fue rechazada, mostrar `Alert` con el motivo en la pantalla de resultado en lugar de "Registro sincronizado con el servidor", sin ofrecer el gafete como confirmado y conservando los datos del formulario — verificación: `pnpm --filter @convencion/panel typecheck` y tests pasan; manualmente (mock de API con 400) la pantalla muestra el motivo.
- [x] 5.3 `Checkin.tsx`: aplicar el mismo filtro por `participantId` y mostrar que la llegada no se registró en el servidor en lugar de "Llegada registrada" cuando su operación fue descartada — verificación: `pnpm --filter @convencion/panel typecheck` pasa y el mensaje de éxito no aparece ante un descarte.

## 6. Detalle de rechazadas en la cabecera

- [x] 6.1 En `IndicadorConexion` (`apps/panel/src/App.tsx`), hacer que la pill "N rechazadas" abra un panel embebido (`Card`) que liste cada descarte con fecha, tipo, participante afectado y motivo usando `listarDescartadas()`, con botón "Marcar como revisadas" que llama `limpiarDescartadas()` + `refrescarPendientes()` — verificación: `pnpm --filter @convencion/panel typecheck` pasa y manualmente el contador, la lista y la limpieza funcionan tras un descarte.

## 7. Verificación integral

- [x] 7.1 Ejecutar `pnpm typecheck`, las suites de `api`, `panel` y `api-client`, `pnpm build` y `pnpm verify:design` — verificación: todo en verde sin regresiones.
- [x] 7.2 Ejecutar `openspec validate --all` y `openspec status --change alinear-contacto-y-rechazos` para confirmar que los deltas siguen válidos antes de archivar — verificación: `openspec validate --all` sin errores en el cambio.
