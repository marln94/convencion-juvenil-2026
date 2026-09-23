# Tasks

## 1. Paquetes compartidos

- [x] 1.1 Ampliar `RegistrarParticipanteInput` con `correo?` y agregar los DTOs
      `SolicitarComprobanteUploadInput` y `SolicitarComprobanteUploadOutput` en
      `packages/shared-types/src/dtos.ts`, exportándolos desde `index.ts`.
      **Verificación**: `pnpm --filter @convencion/shared-types typecheck` pasa.
- [x] 1.2 Agregar al `@convencion/api-client` el método `solicitarComprobanteUpload` (y el
      endpoint correspondiente en `endpoints.ts`), dejando `registrarParticipante` tipado
      con los DTOs ampliados.
      **Verificación**: `pnpm --filter @convencion/api-client typecheck` pasa.

## 2. Dependencias y configuración de pruebas del backend

- [x] 2.1 Instalar en `services/api` las dependencias del diseño: `zod`,
      `@aws-sdk/client-s3` y `@aws-sdk/s3-request-presigner`, más `vitest` como devDep,
      con el script `test`.
      **Verificación**: `pnpm install` termina sin errores y `pnpm --filter @convencion/api test`
      ejecuta vitest (puede ser con 0 archivos todavía).

## 3. Librerías del backend

- [x] 3.1 Crear `services/api/src/lib/comprobante.ts` con `firmarSubidaComprobante(contentType)`
      que genera `s3Key = comprobantes/<uuid>.<ext>`, firma un `PutObjectCommand` de 5
      minutos con `Content-Type` fijado y rechaza tipos fuera de
      `image/png | image/jpeg | application/pdf`.
      **Verificación**: test unitario que devuelve `uploadUrl` con la `s3Key` pedida y otro
      que lanza error de validación (400) para un tipo no permitido.
- [x] 3.2 Crear `services/api/src/lib/validacion.ts` con esquemas zod para
      `RegistrarParticipanteInput` y `SolicitarComprobanteUploadInput` (nombre/contacto
      obligatorios; encargado obligatorio si `esRegistroPorEncargado`; `tipoRegistro` en
      `online | in_situ`; `correo` con formato email; `comprobante` obligatorio solo en
      online) y un traductor a mensaje en español.
      **Verificación**: tests de cada regla del spec (registro sin nombre, sin contacto,
      tipo inválido, correo inválido, online sin comprobante, encargado incompleto).

## 4. Repositorio de participantes

- [x] 4.1 Crear `services/api/src/repos/participantes.ts` con `crearParticipante` (PutItem
      con `ConditionExpression: attribute_not_exists(participantId)` y mapeo de colisión a
      409) y `obtenerParticipante`, sobre el `DynamoDBDocumentClient` memoizado de
      `lib/dynamo.ts`.
      **Verificación**: test con el cliente DocumentClient mockeado que verifica la
      condición de unicidad y que la colisión se mapea a 409.

## 5. Handler de registro

- [x] 5.1 Implementar en `services/api/src/handlers/registro.ts` la ruta
      `POST /inscripciones/comprobante-upload`: valida con zod, devuelve
      `{ uploadUrl, s3Key, contentType }` y responde 400 con `{ message }` si el tipo no
      está permitido.
      **Verificación**: test del handler (`app.request`) que devuelve 200 con la URL
      firmada y otro que devuelve 400 con mensaje para tipo rechazado.
- [x] 5.2 Implementar la ruta `POST /inscripciones` para registros **online**: valida con
      zod, genera `participantId`, guarda el participante con `estadoPago = pendiente` y
      persiste `correo` si viene (sin enviar ningún correo), devolviendo
      `RegistrarParticipanteOutput` con `codigoQr = participantId`.
      **Verificación**: test de caso exitoso (201 con `participante` y `codigoQr`, el
      participante guardado incluye `correo` cuando viene) y test de rechazo 400 cuando
      falta `comprobante`.
- [x] 5.3 Extender la ruta `POST /inscripciones` para registros **in situ**: sin
      comprobante, `estadoPago = pagado` y `tipoRegistro = in_situ`, devolviendo el QR para
      imprimir en el momento.
      **Verificación**: test que devuelve 201 con `estadoPago = pagado`.
- [x] 5.4 Soportar el registro por encargado: cuando `esRegistroPorEncargado = true`,
      persistir `encargadoNombre`/`encargadoContacto` y rechazar con 400 si faltan.
      **Verificación**: test de éxito (respuesta con encargado poblado) y test de 400 por
      encargado incompleto.
- [x] 5.5 Montar `app.onError` en el handler para devolver siempre `{ message }` con
      códigos 400/409 según corresponda, y conservar las exportaciones `handler` y
      `default` para que CDK pueda conectarla después.
      **Verificación**: tests de los errores 400/409 devuelven `{ message }` en español.

## 6. Frontend apps/registro

- [x] 6.1 Crear `apps/registro` con el template React + Vite + Tailwind v4 (plugin
      `@tailwindcss/vite`), agregar `apps/*` a `pnpm-workspace.yaml` y los scripts
      `dev:registro`/`build:registro` en la raíz; instalar `@convencion/api-client` y
      `qrcode.react`; documentar `VITE_API_BASE_URL` en `.env.example`.
      **Verificación**: `pnpm install` pasa y `pnpm --filter @convencion/registro build` compila.
- [x] 6.2 Configurar `createApiClient` con `VITE_API_BASE_URL` e implementar el flujo de
      inicio: elegir entre "inscribirse a sí mismo" y "inscribir como encargado", mostrando
      los campos correspondientes.
      **Verificación**: `pnpm --filter @convencion/registro dev` muestra la pantalla inicial
      y alterna los campos del encargado según la opción elegida.
- [x] 6.3 Implementar el formulario con validación visible: nombre/contacto obligatorios,
      correo con formato válido, y encargado completo si aplica; impedir el envío con
      mensajes de error en pantalla.
      **Verificación**: prueba manual intentando enviar sin nombre, sin contacto, con correo
      inválido y con encargado incompleto; el envío se bloquea mostrando el error.
- [x] 6.4 Implementar la carga del comprobante: selección de archivo → `solicitarComprobanteUpload`
      → PUT directo a `uploadUrl` → asociar `s3Key`/`contentType` al registro; mostrar error
      y permitir reintentar sin perder los datos ingresados para tipos no permitidos o fallos
      de subida.
      **Verificación**: prueba manual contra un bucket con CORS (o mock de la subida) para un
      archivo permitido y un archivo no permitido.
- [x] 6.5 Implementar la pantalla final: al completar el registro, mostrar el QR
      (`qrcode.react` con nivel de corrección `M`) a partir de `codigoQr`, el `participantId`
      y el estado "pendiente de revisión", con opción de imprimir/guardar.
      **Verificación**: prueba manual de un registro exitoso que muestra QR y `participantId`,
      y `pnpm --filter @convencion/registro build` compila.
- [x] 6.6 Mostrar los errores de la API (400) como mensajes legibles manteniendo los datos
      del formulario para corregir.
      **Verificación**: prueba manual simulando un rechazo de la API y verificando que el
      mensaje se muestra y los datos persisten.

## 7. Verificación final

- [x] 7.1 Ejecutar la batería completa: `pnpm -r typecheck`, `pnpm -r build` y
      `pnpm --filter @convencion/api test` en verde, y commitear el avance del change.
      **Verificación**: los tres comandos terminan sin errores y `git log` muestra el
      commit del cambio.

## 8. Validaciones de formato

- [x] 8.1 Ajustar el esquema de validación del backend: `nombre` sin números, al menos dos
      palabras (nombre y apellido), y `contacto` (participante y encargado) que se valide
      como correo si contiene `@` o como teléfono con formato `8877-9955` (`xxxx-xxxx`) en
      caso contrario; mensajes de error en español por regla (que no queden tapados por el
      genérico).
      **Verificación**: `pnpm --filter @convencion/api test` pasa con los casos nuevos
      (7/9 dígitos, sin guion, separadores inválidos, nombre numérico, nombre sin apellido,
      encargado inválido, etc.).
- [x] 8.2 Espejar las mismas reglas en la validación visible del formulario para nombre,
      contacto, encargadoNombre y encargadoContacto (incluido el requisito de nombre y
      apellido), y actualizar el placeholder del campo contacto a `8877-9955 o correo@gmail.com`.
      **Verificación**: `pnpm --filter @convencion/registro build` compila.
- [x] 8.3 Mostrar los errores junto al campo que falla y actualizarlos en tiempo real
      mientras el usuario corrige, y limpiarlos al volver a pasos anteriores.
      **Verificación**: `pnpm --filter @convencion/registro build` compila.
- [x] 8.4 Hacer el formulario responsive y mobile friendly (inputs y botones con toque
      grande, acciones a ancho completo en pantallas angostas, QR que escala).
      **Verificación**: `pnpm --filter @convencion/registro build` compila.
- [x] 8.5 Reemplazar la opción de imprimir en la pantalla final por "Guardar/Compartir":
      abre el diálogo nativo de compartir (Web Share) si está disponible y, si no, copia el
      identificador al portapapeles con confirmación.
      **Verificación**: `pnpm --filter @convencion/registro build` compila.
- [x] 8.6 Actualizar las specs (registro y formulario-registro), el contrato y los escenarios:
      contacto inválido, nombre con números, nombre sin apellido, datos del encargado
      inválidos, validación en tiempo real, reset de errores al volver, Guardar/Compartir y
      diseño responsive.
      **Verificación**: las specs listan los escenarios nuevos.