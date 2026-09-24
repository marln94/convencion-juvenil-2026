# Tasks

## 1. Composición del gafete en `apps/registro/src/lib/gafete.ts`

- [x] 1.1 Crear `lib/gafete.ts` con `slugDeNombre()` (minúsculas, sin tildes, reemplaza no-alfanuméricos por guiones) y `componerGafete()` que dibuja sobre un canvas offscreen: "CONVENCIÓN JUVENIL 2026" (indigo), nombre del participante con ajuste de línea, el QR vía `drawImage` y el `participantId` en mono gris discreto en la base; verificar con `pnpm --filter @convencion/registro typecheck`
- [x] 1.2 Implementar `descargarArchivo()` con el patrón `URL.createObjectURL` + `<a download>` (igual a `apps/panel/src/vistas/Equipos.tsx:93`) y el fallback a `toDataURL('image/png')` cuando `toBlob` devuelva `null`; verificar con `pnpm --filter @convencion/registro typecheck`

## 2. Integración en la pantalla de confirmación

- [x] 2.1 Reemplazar `QRCodeSVG` por `QRCodeCanvas` con ref en `App.tsx` (`size={512}`, misma escala visual `max-w-[220px]`) y verificar que la pantalla de confirmación se ve idéntica tras `pnpm --filter @convencion/registro build`
- [x] 2.2 Reescribir `compartirResultado()`: componer el `File` PNG, usar `navigator.canShare({ files })` para `navigator.share({ files })`, y si no hay soporte descargar el PNG; eliminar la copia al portapapeles y reemplazar el estado por "Gafete descargado"; verificar con `pnpm --filter @convencion/registro typecheck`

## 3. Verificación de la experiencia final

- [x] 3.1 Correr `pnpm --filter @convencion/registro typecheck` y `pnpm build:registro` y verificar que ambos pasan sin errores
- [x] 3.2 Probar manualmente "Guardar/Compartir" en móvil (iOS Safari y Chrome Android) y verificar que se comparte la imagen del gafete; en Firefox desktop verificar que se descarga el PNG `gafete-<nombre>.png`