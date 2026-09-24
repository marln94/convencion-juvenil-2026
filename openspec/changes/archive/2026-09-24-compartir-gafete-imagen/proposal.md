# Proposal

## Why

Al tocar "Guardar/Compartir" en la pantalla de confirmación del registro en línea se
comparte únicamente el texto del identificador (UUID), no la imagen del QR. En la puerta,
el check-in solo puede leer un QR escaneando una imagen o buscando por nombre; un UUID en
formato texto no es escaneable ni buscable, así que el botón no permite llevar la
credencial a otra persona y no cumple su propósito.

## What Changes

- Al tocar "Guardar/Compartir", el sistema comparte el gafete como una **imagen PNG** vía el
  diálogo nativo de compartir del dispositivo (Web Share API con archivos).
- El PNG es un mini-gafete que muestra: "Convención Juvenil 2026", el nombre del
  participante, el código QR y el `participantId` en tipografía pequeña y sutil en la base.
- Cuando el navegador no soporta compartir archivos (p.ej. Firefox desktop), el sistema
  **descarga** la imagen PNG en lugar de copiar el identificador.
- Se reemplaza `QRCodeSVG` por `QRCodeCanvas` (misma librería `qrcode.react`, mismas
  props) con un ref para obtener el bitmap del QR y componer el PNG.
- Se elimina la acción de copiar el identificador al portapapeles como salida del botón.

## Capabilities

### New Capabilities

- Ninguna.

### Modified Capabilities

- `formulario-registro`: cambia el comportamiento de la pantalla final; el requisito
  "Pantalla final con el código QR" ya no comparte el identificador como texto sino que
  comparte/guarda el gafete como imagen PNG.

## Non-Goals

- No modificar el registro in situ del panel (`RegistroInsitu.tsx`) ni su QR en pantalla.
- No modificar la API, DTOs ni infraestructura: el QR sigue codificando el `participantId`.
- No compartir texto junto a la imagen (el spec Web Share ignora `title`/`text` al
  compartir archivos, y en iOS mezclarlos invalida el share).
- No generar un PDF ni un endpoint público para visualizar o compartir el gafete.
- No llevar el gafete a imagen en el servidor; toda la composición ocurre en el navegador.

## Impact

- `apps/registro/src/App.tsx`: botón "Guardar/Compartir" y bloque del QR en la
  pantalla de confirmación.
- `apps/registro/src/lib/gafete.ts` (nuevo): composición del PNG y helpers de descarga.
- Dependencia existente `qrcode.react` (usa `QRCodeCanvas`).
- Sin cambios en `services/api`, `packages/shared-types` ni `infra`.

## Contexto

`apps/registro` es la app pública de inscripción (React + Vite + Tailwind). La pantalla de
confirmación (`App.tsx`) muestra el QR con `QRCodeSVG`, el `participantId` y el botón
"Guardar/Compartir". `codigoQr === participantId` (un UUID): el QR codifica ese UUID y el
check-in del panel lo lee con `@zxing/browser` escaneando la cámara. Compartir el texto
crudo por tanto no sirve para el ingreso; solo la imagen del QR es utilizable. El proyecto
ya usa el patrón de descarga vía `URL.createObjectURL` + `<a download>` en
`apps/panel/src/vistas/Equipos.tsx`.