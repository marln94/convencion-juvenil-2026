# Propuesta Técnica: Sistema de Inscripción y Control de Asistentes
### Convención Anual — Iglesia

Este documento complementa la propuesta funcional y detalla las decisiones técnicas, la arquitectura, el modelo de datos y el andamiaje inicial del proyecto.

---

## 1. Herramienta de infraestructura: AWS CDK

Se evaluaron dos opciones para definir la infraestructura en AWS: **SAM** y **CDK**. Se eligió **CDK con TypeScript** por las siguientes razones:

| | SAM | CDK |
|---|---|---|
| Sintaxis | YAML/JSON (plantillas declarativas) | Código real (TypeScript) |
| Curva de aprendizaje | Más simple para solo Lambdas/API Gateway | Un poco más, pero mucho más poderoso |
| Reutilización de lógica | Difícil de parametrizar cosas complejas | Se pueden crear construcciones/clases reutilizables |
| Mantenimiento en monorepo | Se queda corto si crecen los recursos (S3, Cognito, DynamoDB, etc.) | Ideal — se comparte infraestructura entre stacks fácilmente |
| Tipado | No | Sí — detecta errores antes de desplegar |

Al usar TypeScript tanto en el frontend como en las Lambdas y en el propio CDK, se pueden **compartir tipos** entre todas las capas del proyecto (por ejemplo, la interfaz `Participante` se define una sola vez y se reutiliza en todas partes).

---

## 2. Stack tecnológico

| Capa | Tecnología | Motivo |
|---|---|---|
| Infraestructura | AWS CDK (TypeScript) | Control total, tipado, reutilizable |
| Frontend (Admin + Campo) | React + Vite + Tailwind | Liviano, rápido de compilar |
| App de Campo | PWA (`vite-plugin-pwa`) + `html5-qrcode`/`@zxing/browser` | Funciona sin instalación, soporta escaneo QR y uso con conexión inestable |
| Backend | Node.js + TypeScript en Lambda, con **Hono** como router liviano | Cold starts rápidos, mismo lenguaje en todo el stack, más liviano que Express |
| Base de datos | DynamoDB (modo on-demand) | Milisegundos de respuesta, sin administración, barato a este volumen |
| Gestor de paquetes / monorepo | pnpm workspaces | Rápido, maneja bien dependencias compartidas |

Servicios de AWS involucrados (ver también la sección de costos en la propuesta funcional): **S3 + CloudFront** (hosting de frontend), **Lambda + API Gateway** (backend), **DynamoDB** (datos), **Cognito** (acceso de administradores y staff), **SES** (correos), **S3 privado** (comprobantes de pago), **Route 53 + ACM** (dominio y certificado).

---

## 3. Estructura del monorepo

```
convencion-monorepo/
├── apps/
│   ├── admin/              # React + Vite — panel de administrador
│   └── campo/               # React + Vite (PWA) — app de campo / check-in
├── packages/
│   ├── shared-types/         # Interfaces TS compartidas (Participante, Equipo, etc.)
│   └── api-client/           # Cliente tipado para llamar al backend, usado por ambas apps
├── services/
│   └── api/                  # Lambdas (registro, revisión de pagos, equipos, check-in)
├── infra/
│   └── cdk/                  # Stacks de CDK: API Gateway, Lambdas, DynamoDB, S3, Cognito, SES
├── package.json               # workspaces raíz
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .gitignore
```

Con solo 2 apps y un backend simple, **pnpm workspaces por sí solo es suficiente** — no se necesita Turborepo ni Nx por ahora. Si el proyecto crece, se puede añadir Turborepo sobre los workspaces existentes sin reestructurar nada.

### Paquete `shared-types`

Contiene el modelo de datos y los DTOs de la API en un solo lugar, usados por `apps/admin`, `apps/campo`, `services/api` e indirectamente por `infra/cdk`:

- `Participante`, `ConfiguracionEquipos`
- DTOs: `RegistrarParticipanteInput/Output`, `RevisarPagoInput`, `GenerarEquiposOutput`, `CheckInInput/Output`

### Paquete `api-client`

Cliente HTTP tipado (`createApiClient`) que envuelve todos los endpoints del backend (registrar, listar, revisar pago, generar equipos, check-in), consumido igual por el panel de administrador y por la app de campo.

---

## 4. Modelo de datos (DynamoDB)

### Access patterns identificados

Antes de diseñar las tablas se listaron las formas en que el sistema necesita consultar los datos (en DynamoDB el diseño se guía por los patrones de lectura, no solo por la entidad):

1. Obtener un participante por su QR (check-in en campo)
2. Buscar un participante por nombre (admin)
3. Listar participantes filtrando por estado de pago (pendiente/pagado/rechazado)
4. Listar participantes por equipo/color asignado
5. Obtener todos los "pagados" para generar los equipos
6. Registrar/actualizar el estado de check-in de llegada
7. Distinguir si el registro fue online o in situ, y quién es el encargado (si aplica)

Con ~800 registros totales, **una sola tabla con un par de índices secundarios (GSI) es suficiente** — no se requiere diseño multi-tabla complejo ni motores de búsqueda externos.

### Tabla `Participantes`

| Atributo | Tipo | Notas |
|---|---|---|
| `participantId` (PK) | String (UUID) | Es también el valor codificado en el QR |
| `nombre` | String | |
| `contacto` | String | Teléfono/correo |
| `esRegistroPorEncargado` | Boolean | |
| `encargadoNombre` | String (opcional) | Solo si aplica |
| `encargadoContacto` | String (opcional) | Solo si aplica |
| `tipoRegistro` | String | `online` \| `in_situ` |
| `estadoPago` | String | `pendiente` \| `pagado` \| `rechazado` |
| `comprobanteS3Key` | String | Referencia al archivo en S3, no la imagen misma |
| `equipoColor` | String (opcional) | Se llena al generar equipos |
| `checkIn` | Boolean | Si ya llegó al evento |
| `checkInTimestamp` | String (ISO) | |
| `fechaRegistro` | String (ISO) | |

**Índices secundarios (GSI):**

| GSI | Partition Key | Sort Key | Para qué sirve |
|---|---|---|---|
| `GSI-EstadoPago` | `estadoPago` | `fechaRegistro` | Bandeja de revisión: listar "pendiente" ordenados por fecha |
| `GSI-Equipo` | `equipoColor` | `nombre` | Ver rápidamente la lista de integrantes de cada banda |

**Búsqueda por nombre:** con 800 registros no se justifica un GSI ni herramienta externa — el panel de administrador carga la lista completa (es ligera) y filtra en el navegador mientras se escribe. Es instantáneo a esta escala y evita infraestructura extra.

### Tabla `Configuracion`

Guarda el estado global de la generación de equipos, para no repetir el dato en cada participante:

| Atributo | Valor ejemplo |
|---|---|
| `configId` (PK) | `equipos` |
| `bloqueado` | `true` / `false` |
| `fechaGeneracion` | ISO |
| `colores` | Lista de los 13 colores/nombres de equipo |

Esto también permite, a futuro, ajustar los 13 colores sin tocar código.

### Generación de equipos (lógica, no tabla nueva)

1. `Query` sobre `GSI-EstadoPago` con `estadoPago = pagado`.
2. Se baraja la lista en memoria y se reparte el color de forma balanceada.
3. `BatchWriteItem` actualiza el campo `equipoColor` de cada participante.
4. Si `Configuracion.bloqueado = true`, se rechaza volver a ejecutar el reparto (protección contra reasignaciones el día del evento).

### Check-in

Es una simple actualización (`UpdateItem`) sobre el ítem del participante: `checkIn = true`, `checkInTimestamp = ahora`. Al escanear el QR, la app de campo hace un `GetItem` por `participantId` — respuesta en milisegundos, al ser el caso más rápido posible en DynamoDB (búsqueda por llave primaria).

---

## 5. Andamiaje inicial del proyecto

Ya se generó la base funcional del monorepo con:

- **Raíz**: `package.json` con scripts (`dev:admin`, `dev:campo`, `cdk:deploy`, etc.), `pnpm-workspace.yaml`, `tsconfig.base.json`, `.gitignore`, `.env.example`.
- **`packages/shared-types`**: interfaces `Participante`, `ConfiguracionEquipos` y los DTOs de la API, como única fuente de verdad del modelo de datos.
- **`packages/api-client`**: cliente HTTP tipado (`createApiClient`) con métodos para cada endpoint, listo para ser usado desde ambas apps.
- **`services/api`**: base de conexión a DynamoDB (`lib/dynamo.ts`) y los 4 handlers Lambda principales, usando Hono como router:
  - `registro.ts` — registro online e in situ (Módulos 1 y 3), genera el `participantId`/QR al finalizar el registro.
  - `revisar-pago.ts` — aprobación/rechazo de comprobantes (Módulo 2).
  - `generar-equipos.ts` — sorteo balanceado entre los 13 colores, con bloqueo de seguridad (Módulo 4).
  - `checkin.ts` — check-in de llegada al escanear el QR (Módulo 6).

**Pendiente de andamiaje:**
- `infra/cdk`: stacks de CDK (DynamoDB, S3, Lambdas, API Gateway, Cognito, SES).
- `apps/admin` y `apps/campo`: scaffolding de React + Vite (+ PWA en el caso de Campo).
- Definición formal de los endpoints/rutas de la API Gateway y su conexión con los handlers ya creados.
- Validación de inputs (por ejemplo, con `zod`) en los handlers.

---

## 6. Próximos pasos técnicos

1. Completar el stack de CDK (`infra/cdk`) con las tablas, buckets, Cognito y la API Gateway conectada a los handlers existentes.
2. Generar el scaffolding de `apps/admin` y `apps/campo`.
3. Definir el contrato completo de endpoints (rutas, métodos, códigos de respuesta).
4. Implementar autenticación de administrador/staff con Cognito.
5. Pruebas locales de los handlers antes del primer despliegue.
