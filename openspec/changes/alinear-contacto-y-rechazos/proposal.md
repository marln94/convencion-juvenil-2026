# Proposal

## Why

El formulario de registro in-situ del panel y el formulario público de `/registro` no coinciden
en los campos `contacto` y `correo`: el panel acepta un correo dentro de `contacto` (residuo de
un campo único de contacto) mientras que la web exige solo teléfono, y la API acepta ambos — de
modo que la web es más estricta que su propio spec. Además, la validación de teléfono/correo está
copiada en tres lugares sin fuente compartida, el guion del teléfono debe escribirse a mano, y
cuando el servidor rechaza una operación encolada el panel muestra "Registro sincronizado" en
verde y el detalle del rechazo queda invisible (solo un contador en la cabecera).

## What Changes

- **BREAKING (API)**: `contacto` pasa a aceptar **solo teléfono** `8877-9955` (antes: teléfono o
  correo). El servidor además **normaliza**: acepta 8 dígitos seguidos y los guarda con guion.
  `correo` sigue siendo el único campo de correo, opcional, sin cambios.
- Fuente única de patrones y helpers de contacto (`PATRON_TELEFONO`, `PATRON_CORREO`,
  `esTelefono`, `esCorreo`, `formatearTelefono`, `normalizarTelefono`) en
  `@convencion/shared-types`, consumida por la API y ambos formularios (elimina la triplicación).
- Nuevo componente `TelefonoInput` en `@convencion/ui`: `type="tel"`, `maxLength=9` y guion
  automático entre los dos grupos de 4 dígitos al escribir; lo usan `/registro` y el panel.
- El formulario in-situ del panel se alinea con la web: label `Teléfono (opcional)`,
  validación y mensajes idénticos, correo con `type="email"`, y **errores inline por campo**
  (reemplaza el único banner de error al enviar).
- Rechazos del servidor visibles y veraces:
  - `sincronizar()` reporta las operaciones descartadas en ese pase; el registro in-situ y el
    check-in dejan de mostrar éxito cuando su operación fue rechazada (muestran el motivo).
  - La pill "N rechazadas" de la cabecera abre un panel con el detalle de cada descarte
    (fecha, tipo, participante, motivo) y permite marcarlos como revisados.

## Capabilities

### New Capabilities

<!-- Ninguna: todos los cambios caen en capacidades existentes. -->

### Modified Capabilities

- `design-system-components`: nuevo requisito `TelefonoInput` (formato telefónico automático
  con guion).
- `registro`: el campo `contacto` de la API acepta solo teléfono (antes teléfono o correo) y el
  servidor normaliza 8 dígitos a `dddd-dddd`; `encargadoContacto` no cambia.
- `formulario-registro`: el campo `contacto` del formulario público se valida y se reporta como
  teléfono únicamente (mensaje sin "o un correo válido").
- `panel`: nuevos requisitos para los campos de contacto del registro in-situ (alineados a la
  web, con errores inline) y para la visibilidad de las operaciones rechazadas por el servidor.

## Non-goals

- Cambiar la regla de `encargadoContacto` (sigue aceptando teléfono o correo: es un único campo
  para el encargado y no existe `encargadoCorreo`).
- Migrar o limpiar datos existentes: ni `contacto` ni `correo` se muestran en ninguna otra vista
  hoy; la validación nueva aplica solo a escrituras nuevas.
- Revertir el flag de check-in local cuando un check-in encolado se descarta (comportamiento
  actual documentado en la cola).
- Soporte de prefijo internacional `+504` o máscaras de formato más allá del guion `dddd-dddd`.
- Enviar correos u otras notificaciones por los campos de contacto.

## Contexto

Sistema de inscripción y control de asistentes para la Convención Anual (registro online e
in-situ, revisión manual de comprobantes, 13 equipos por color, check-in por QR). Monorepo pnpm
con TypeScript en toda la pila: `apps/registro` (formulario público), `apps/panel` (PWA interna
con cola offline en IndexedDB), `services/api` (Hono + zod + DynamoDB), `packages/shared-types`
(modelo y helpers compartidos) y `packages/ui` (design system). Los textos de interfaz están en
español y los specs viven en `openspec/specs/`.

## Impact

- `packages/shared-types/src/` (nuevo módulo de contacto + export), `packages/ui` (nuevo
  `TelefonoInput`).
- `services/api/src/lib/validacion.ts` y sus tests; `services/api/src/handlers/registro.test.ts`.
- `apps/registro/src/App.tsx`, `apps/panel/src/vistas/RegistroInsitu.tsx`,
  `apps/panel/src/vistas/Checkin.tsx`, `apps/panel/src/App.tsx` (indicador de conexión),
  `apps/panel/src/lib/cola.ts`, `apps/panel/src/lib/sincronizacion.ts` y sus tests.
- Specs modificados: `registro`, `formulario-registro`, `panel`, `design-system-components`.
