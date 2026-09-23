# Design

## Context

El monorepo ya tiene el andamiaje: `services/api` expone handlers Hono como stubs, la tabla
`Participantes` está definida en `@convencion/shared-types`, y el modelo de datos fija
DynamoDB como única base de datos. Este diseño implementa el registro (handler `registro.ts`
+ formulario web `apps/registro`) sin infraestructura desplegada todavía: la conexión a AWS
se hace por env vars y los AWS SDKs, de modo que el mismo código funciona cuando `infra/cdk`
apunte Lambda/API Gateway/S3.

## Goals / Non-Goals

**Goals:**
- Registro online e in situ con un único handler `POST /inscripciones`.
- El comprobante se sube directo a S3 vía presigned URL, nunca a través de Lambda.
- El valor del QR (`codigoQr`) se entrega en la respuesta; la imagen la renderiza
  `apps/registro` al finalizar el registro, sin envío por correo.
- DTOs y cliente tipados en los paquetes compartidos; validación con zod en el borde.
- Código testeable sin AWS real (SDKs inyectados / stubbeados en tests).

**Non-Goals:**
- API Gateway, CDK y Cognito: se integran en su propio change (`infra/cdk`).
- `apps/admin` y `apps/campo` (PWA con tolerancia offline): sus changes.
- Envío de correo con el QR: explícitamente fuera de esta fase (el `correo` se guarda).
- Lógica de revisión de pagos, equipos y check-in (otros handlers ya stubeados).

## Decisions

### 1. Subida de comprobante con presigned URL (PUT directo a S3)

Flujo: el cliente pide `POST /inscripciones/comprobante-upload` con `{ contentType,
nombreArchivo }` → la API genera `s3Key = comprobantes/<uuid>.<ext>`, firma un
`PutObjectCommand` (5 min de validez, con `Content-Type` fijado) y devuelve
`{ uploadUrl, s3Key, contentType }`. El cliente hace el PUT directo a S3 y luego completa
`POST /inscripciones` con `comprobante.s3Key`.

- **Por qué presigned vs multipart vía Lambda**: los archivos no pasan por el backend
  (límites de payload de API Gateway de 10 MB y latencia/costo de Lambda por cada byte);
  es el patrón estándar de AWS para este caso.
- **Alternativa considerada**: recibir base64 en el JSON — descartada por costo y por
  duplicar el tamaño en memoria.
- Límite de 5 MB: firmado con encabezado de `Content-Type`; el tamaño se controla del lado
  del cliente y, a futuro, con un event de S3 (fuera de alcance).

### 2. QR cuyo valor ES el `participantId`; la imagen se genera en el navegador

`codigoQr` en la respuesta es el `participantId`. El backend NO rasteriza ninguna imagen:
solo entrega el valor. `apps/registro` renderiza el QR con `qrcode.react` al finalizar el
registro.

- **Por qué**: el check-in (Módulo 6) hace `GetItem` por llave primaria, el caso más rápido
  en DynamoDB y sin tabla extra de tokens.
- **Determinismo**: el dato codificado es siempre el mismo (`participantId`), y el render es
  determinista si se mantiene la misma librería (`qrcode.react`) con el mismo nivel de
  corrección fijado (`M`) y la misma string. Aunque otra librería rasterizara distinto, el
  decodificado en el check-in (`@zxing/browser`/`html5-qrcode`) es siempre el `participantId`,
  porque lo que se lee es el dato, no el píxel.
- **Alternativa considerada**: token firmado independiente del id — añade una indirección y
  una clave de cifra sin beneficio a esta escala.

### 3. `correo` almacenado, sin envío

`correo?: string` se valida con formato de email y se persiste en el participante cuando
viene; el sistema NO envía ningún correo en esta fase. `contacto` sigue siendo el dato
general (teléfono o correo) y sigue siendo obligatorio.

- **Por qué**: la propuesta funcional pide guardar el correo para usos futuros; posponer SES
  elimina dependencias, configuración de dominio verificado y riesgos de sandbox en esta fase.
- **Alternativa considerada**: despachar con SESv2 — descartada mientras no se necesite.
- La validación de formato se mantiene aunque no haya envío: es calidad de dato.

### 4. `apps/registro` como app pública en el workspace

Nueva app React + Vite + Tailwind (Tailwind v4 vía `@tailwindcss/vite`) bajo `apps/*`
(se agrega el glob al `pnpm-workspace.yaml`). Consume `@convencion/api-client`
(`createApiClient`) con la base URL en `VITE_API_BASE_URL`. Flujo de 4 pasos:
inicio (sí mismo / encargado) → formulario con validación visible → carga del comprobante
(PUT a la `uploadUrl` presigned) → confirmación con QR + `participantId` + estado
"pendiente de revisión" y opción de imprimir/guardar.

- **Por qué app propia y no parte de `apps/admin`**: es pública y sin login; usa una
  audiencia y un despliegue distintos a admin/campo.
- **CORS**: el PUT del navegador al bucket exige CORS habilitado en el bucket S3. Es
  configuración de `infra/cdk` (fuera de alcance); en desarrollo se prueba con un bucket
  configurado manualmente o con un mock de la subida.

### 5. Validación con zod en el borde del handler (backend) y validación visible (frontend)

`lib/validacion.ts` define esquemas zod para `RegistrarParticipanteInput` y
`SolicitarComprobanteUploadInput`; el handler responde 400 con `{ message }` al fallar (vía
`app.onError`). Reglas: `nombre`/`contacto` obligatorios; si `esRegistroPorEncargado = true`,
`encargadoNombre` y `encargadoContacto` obligatorios; `tipoRegistro` dentro de
`online | in_situ`; `correo` con formato de email; `comprobante` obligatorio solo para
`online`. El formulario replica estas reglas en pantalla para UX; el backend sigue siendo la
fuente de verdad.

### 6. Acceso a la tabla vía un repositorio tipado

Se agrega `src/repos/participantes.ts` con operaciones tipadas (`crearParticipante`,
`obtenerParticipante`) sobre el `DynamoDBDocumentClient` memoizado de `lib/dynamo.ts`
(constantes de tabla desde env, con el sufijo `Convencion-` del `.env.example`). El `PutItem`
usa `ConditionExpression: attribute_not_exists(participantId)` para hacer la colisión de
UUID imposible de sobrescribir (ante una colisión se responde 409).

## Risks / Trade-offs

- **PUT del navegador necesita CORS en el bucket**: sin CORS el presign vale pero la subida
  falla en el navegador → Mitigación: configurar CORS al crear el bucket (manual en dev,
  `infra/cdk` después); documentar en la tarea de la subida.
- **Objetos huérfanos en S3**: si el usuario pide la URL pero no completa el registro →
  Mitigación: `s3Key` con UUID y bucket con regla de lifecycle para borrar objetos sin
  referencia (config de `infra/cdk`, no bloquea).
- **Tamaño del comprobante no verificable en la firma** → Mitigación: validación del lado
  del cliente en el formulario; validación servidor en un change futuro vía S3 events.
- **Sin correo, el QR solo vive en la pantalla final** → Mitigación: pantalla de impresión;
  el reenvío por correo se habilita en una fase futura cuando se integre SES.
- **Render de QR distinto entre librerías** → Mitigación: fijar `qrcode.react` con nivel de
  corrección `M` en todos los render (form público y futuros gafetes); el dato decodificado
  es el mismo, de modo que el escaneo en check-in no se ve afectado.

## Migration Plan

Sin despliegue hasta que `infra/cdk` exista. El cambio se integra y prueba con mocks de los
SDKs (Vitest) y, para pruebas manuales, con DynamoDB local o bucket/almacenamiento de
desarrollo. Rollback = revert de commit (no hay schema migrado: la tabla ya contempla los
campos nuevos con valores opcionales).