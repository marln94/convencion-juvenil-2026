# Design

## Context

Ver `proposal.md` — Why. La app pública de registro (`apps/registro`) muestra en la
pantalla de confirmación un QR generado con `QRCodeSVG` y un botón "Guardar/Compartir"
que hoy comparte/copía el `participantId` como texto. El condicionante técnico clave: el
botón debe poder ofrecer una **imagen** del QR, y la composición de esa imagen ocurre
enteramente en el navegador (sin servidor). `qrcode.react` v4 expone `QRCodeCanvas`,
que dibuja en un `<canvas>` accesible por ref; es la misma dependencia ya presente.

## Goals / Non-Goals

**Goals:**

- Compartir el gafete como PNG vía el diálogo nativo (Web Share API `files`).
- Descargar el mismo PNG cuando el navegador no soporta compartir archivos.
- Mantener intacto el aspecto de la pantalla de confirmación actual.
- Reutilizar el patrón de descarga ya usado en el repo (`Equipos.tsx`).

**Non-Goals:**

- No tocar el panel (`RegistroInsitu.tsx`) ni el backend.
- No componer la imagen en el servidor ni generar PDF.
- No enviar `title`/`text` junto a los archivos (el spec Web Share los ignora).

## Decisions

### 1. `QRCodeCanvas` + ref, en lugar de `QRCodeSVG`, para obtener el bitmap

`QRCodeCanvas` acepta un ref al `<canvas>` subyacente. Se renderiza con `size={512}`
(interno) y se escala con CSS al tamaño visual actual (`max-w-[220px]`), garantizando
nitidez al componer el PNG. Es el mismo componente librería; solo cambia el tag.

- Alternativa descartada: serializar el SVG y compartirlo como archivo — las apps de
  mensajería suelen rechazar `image/svg+xml`; `canvas.toBlob()` a PNG es fiable en todos
  los navegadores con Web Share.

### 2. Composición del gafete en un canvas offscreen (`lib/gafete.ts`)

Se dibuja sobre un canvas de ~640×780 px: título "CONVENCIÓN JUVENIL 2026" (indigo),
nombre del participante (con ajuste de línea), el QR centrado (`drawImage` desde el
canvas del componente) y el `participantId` en tipografía mono pequeña y discreta en la
base (gris claro, sin resaltar).

- La pantalla NO se convierte en un canvas: se mantiene el HTML/Tailwind actual y el
  PNG se compone solo al pulsar el botón.
- Alternativa descartada: convertir todo el gafete visible en un canvas — perdería
  estilos Tailwind, y obligaría a redibujar en cada cambio de tamaño.
- Para que las tipografías rendericen de forma consistente, se espera
  `document.fonts.ready` antes de dibujar (promesa cacheada desde el primer render; al
  momento del click ya suele estar cumplida).

### 3. Flujo de compartir/descargar (sin portapapeles)

```
compartirResultado()
  blobs = componerGafete(...)          → File("gafete-<slug>.png", image/png)
  si navigator.canShare?.({files})  → navigator.share({ files })   [imagen]
  si no                             → descargarArchivo(file)       [download]
```

- La descarga usa el patrón existente en `apps/panel/src/vistas/Equipos.tsx:93`
  (`URL.createObjectURL` + `<a download>`), localizada en el helper.
- Se elimina `navigator.clipboard.writeText` y el estado "Identificador copiado"; el
  botón pasa a confirmar con "Gafete descargado" en el caso de descarga.
- El nombre de archivo deriva del nombre del participante (slug: minúsculas, sin
  tildes, no-alfanuméricos → guiones), p.ej. `gafete-maria-lopez.png`.

### 4. Guardas y cancelación

- Si `canvas.toBlob` devuelve `null`, se cae a `toDataURL('image/png')` para descarga
  (y no se intenta compartir).
- Si el usuario cancela el diálogo nativo de compartir, se ignora (como hoy).

## Risks / Trade-offs

- Web Share requiere contexto seguro y gesto del usuario → la composición es rápida
  (<100 ms) y corre dentro del click; `document.fonts.ready` ya resuelto al estar la
  página renderizada. → Mitigación: cachear la promesa de fuentes al primer render.
- Mixing `text` + `files` invalida el share en iOS → se envía solo `files`,
  deliberadamente.
- Firefox desktop no soporta `canShare({files})` → cae a descarga (comportamiento
  esperado y deseado para "Guardar").
- `toBlob` ausente en navegadores antiguos → esos no tienen Web Share; el fallback
  `toDataURL` cubre la descarga.
- La imagen desplegada en pantalla y el PNG compartido no son idénticos píxel a píxel
  (el PNG es un gafete de mensajería, sin botones) → aceptable y esperado; solo varía
  el encuadre, no el contenido (QR + nombre + UUID).

## Migration Plan

Cambio solo de frontend: se despliega la app `registro`; rollback = revertir el commit
y redesplegar. No hay migración de datos ni cambios de API.