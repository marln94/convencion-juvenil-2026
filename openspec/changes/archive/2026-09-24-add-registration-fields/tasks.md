# Tasks

## 1. Shared Types (packages/shared-types)

- [x] 1.1 Actualizar `RegistrarParticipanteInput` en `dtos.ts`: agregar `localidad: string`, `region: string`, `edad: number`, `diasAsistencia: string[]`, `rol: 'joven'|'encargado'|'nexo'`; hacer `contacto?: string` opcional — **verificar: `pnpm build` en shared-types pasa**
- [x] 1.2 Actualizar `Participante` en `participante.ts`: agregar los 5 nuevos campos — **verificar: `pnpm build` en shared-types pasa**
- [x] 1.3 Regenerar tipos del api-client: `cd packages/api-client && pnpm build` — **verificar: tipos generados incluyen nuevos campos**

## 2. Backend Validation & Handler (services/api)

- [x] 2.1 En `validacion.ts`: agregar constantes `REGIONES`, `DIAS_ASISTENCIA`, `ROLES`; actualizar `registrarParticipanteSchema` con validaciones de los 5 campos nuevos + hacer `contacto` opcional — **verificar: tests existentes pasan (`pnpm test` en services/api)**
- [x] 2.2 En `registro.ts`: incluir los 5 nuevos campos al crear el objeto `participante` — **verificar: `pnpm build` en services/api pasa**
- [x] 2.3 Tests unitarios: agregar casos para validación de nuevos campos (region inválida, edad no positiva, diasAsistencia vacío, rol inválido, contacto opcional) — **verificar: nuevos tests pasan**

## 3. Frontend Online (apps/registro)

- [x] 3.1 En `App.tsx`: extender `DatosFormulario` con 5 nuevos campos; agregar `REGIONES`, `DIAS_ASISTENCIA`, `ROLES` constants — **verificar: TypeScript compila sin errores**
- [x] 3.2 En step 'datos': agregar UI para 5 campos (input localidad, select region, number edad, checkbox group diasAsistencia, select rol); quitar `requerido` de contacto — **verificar: formulario renderiza correctamente en móvil y desktop**
- [x] 3.3 En `validarCampo`: agregar validaciones para 5 nuevos campos — **verificar: errores aparecen en tiempo real y se limpian al corregir**
- [x] 3.4 En `enviarRegistro`: incluir nuevos campos en payload API (`edad` como number, `diasAsistencia` array, `rol` string) — **verificar: registro online completo con datos válidos devuelve QR**
- [x] 3.5 Test manual: registro online con todos los campos válidos; registro sin contacto; registro con campo extendido faltante muestra error — **verificar: flujos funcionan end-to-end**

## 4. Frontend In-Situ (apps/panel)

- [x] 4.1 En `RegistroInsitu.tsx`: extender `DatosFormulario` con 5 nuevos campos; agregar constants — **verificar: TypeScript compila sin errores**
- [x] 4.2 En formulario: agregar UI para 5 campos (input localidad, select region, number edad, checkbox group diasAsistencia, select rol); quitar requerido de contacto — **verificar: formulario renderiza correctamente**
- [x] 4.3 En `validar()`: agregar validaciones para 5 nuevos campos — **verificar: errores mostrados correctamente**
- [x] 4.4 En `enviar()`: incluir nuevos campos en payload (`edad` number, `diasAsistencia` array, `rol` string) — **verificar: registro in-situ crea participante con QR**
- [x] 4.5 Test manual: registro in-situ con todos los campos; sin contacto; campos extendidos faltantes bloquean envío — **verificar: flujos funcionan end-to-end**

## 5. Build & Integration Verification

- [x] 5.1 Build completo monorepo: `pnpm build` desde raíz — **verificar: todos los workspaces compilan sin errores**
- [ ] 5.2 Test integración local: levantar stack local (docker-compose) y probar ambos formularios contra API local — **verificar: registros se crean en DynamoDB con nuevos campos**
- [ ] 5.3 Verificar panel admin (Pagos, Checkin, Equipos) sigue funcionando con nuevos campos — **verificar: vistas no rompen, datos legibles**