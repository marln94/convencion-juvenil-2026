# Proposal

## Why

El formulario de registro actual captura solo datos básicos de contacto (nombre, teléfono/correo, encargado). La organización necesita recolectar información adicional obligatoria para la logística de la convención: ubicación geográfica (localidad y región), edad, días de asistencia y rol del participante (joven/encargado/nexo). Esto permite planificación de equipos, alojamiento, alimentación y materiales por día.

## What Changes

**Campos nuevos obligatorios en ambos formularios (online + in-situ):**
- `localidad` (texto libre) — ciudad/pueblo del participante
- `region` (select, 13 opciones) — región administrativa, almacenada como `'1'`–`'13'`
- `edad` (número entero positivo) — input numérico con min=1
- `diasAsistencia` (array de códigos, mínimo 1) — checkbox group: `jueves-24`, `viernes-25`, `sabado-26`, `domingo-27`
- `rol` (select, 3 opciones) — `joven` | `encargado` | `nexo`

**Campo existente modificado:**
- `contacto` pasa de obligatorio a opcional (ya no es requerido)
- `correo` ya era opcional, sin cambios

**BREAKING:** El contrato `RegistrarParticipanteInput` cambia: se agregan 5 campos requeridos y `contacto` deja de ser requerido. Consumers del API deben actualizarse.

## Capabilities

### New Capabilities
- `registration/extended-fields`: Captura y validación de campos extendidos de inscripción (localidad, region, edad, diasAsistencia, rol) en ambos formularios de registro

### Modified Capabilities
- `registration/online`: Se modifican los campos requeridos del formulario online (contacto opcional, 5 nuevos requeridos)
- `registration/in-situ`: Se modifican los campos requeridos del formulario in-situ (contacto opcional, 5 nuevos requeridos)

## Impact

**Código afectado:**
- `packages/shared-types/src/dtos.ts` — `RegistrarParticipanteInput` + exports
- `packages/shared-types/src/participante.ts` — `Participante` entity
- `services/api/src/lib/validacion.ts` — Zod schema `registrarParticipanteSchema`
- `services/api/src/handlers/registro.ts` — creación de participante
- `apps/registro/src/App.tsx` — formulario online (step 'datos')
- `apps/panel/src/vistas/RegistroInsitu.tsx` — formulario in-situ

**Dependencias:**
- Regenerar `packages/api-client` tras cambios en `shared-types`
- Build completo del monorepo (`pnpm build`)

**Sistemas:**
- DynamoDB: nuevos atributos en items de Participantes (schema-less, sin migración)
- Panel admin: vistas existentes (Pagos, Checkin, Equipos) leen Participante — compatibles por defecto

## Non-goals

- No se migran participantes existentes (campos nuevos solo para nuevos registros)
- No se agregan campos al gafete/QR ni a notificaciones
- No hay validación cruzada entre región y localidad
- No hay lógica de capacidad por día/rol

## Contexto

Convención Juvenil 2026: 4 días (jueves 24 – domingo 27 dic), hasta ~800 asistentes. 13 regiones administrativas predefinidas. Roles: joven (participante), encargado (adulto responsable de menores), nexo (enlace local). Registro online público + registro in-situ por staff en campo.