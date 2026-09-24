# Proposal

## Contexto

Hoy nada está desplegado: el backend corre local (env vars + SDKs de AWS) y las apps son builds de
desarrollo. Para que el sistema sea utilizable por la congregación y el staff, hay que publicar en
AWS: frontends en S3 + CloudFront, Lambdas detrás de API Gateway, DynamoDB con los GSI definidos
en el diseño, buckets (público y privado) con CORS para las subidas de comprobantes y Cognito con
los grupos del change `auth`. El monorepo no tiene aún el workspace
`infra/cdk` que la propuesta técnica define como pendiente de andamiaje.

## Why

Todo el trabajo de los changes funcionales (registro, pagos, equipos, panel) solo tiene valor si
el sistema está publicado y accesible por HTTPS. `infra/cdk` es el habilitador del despliegue:
sin él no hay URLs reales, ni authorizer conectado, ni bucket con CORS que permita la subida de
comprobantes desde el navegador.

## What Changes

- Nuevo workspace `infra/cdk` (TypeScript) en el monorepo con los stacks:
  - **AuthStack**: Cognito User Pool con los grupos `admin`/`staff` según el contrato definido por
    el change `auth`.
  - **DataStack**: DynamoDB on-demand — tabla `Participantes` (PK `participantId`, GSI de
    `estadoPago`, GSI de `equipoColor`) y tabla `Configuracion`.
  - **StorageStack**: bucket privado `comprobantes` con CORS y regla de lifecycle (objetos
    huérfanos), y bucket público + CloudFront para hospedar las apps.
  - **ApiStack**: API Gateway REST con authorizer de Cognito sobre las rutas, conectando cada
    handler Lambda existente (`registro`, `revisar-pago`, `generar-equipos`, `checkin`, búsqueda).
- Variables de entorno inyectadas por CDK a cada handler (nombres de tabla, bucket, ids del pool).
- CORS del bucket privado configurado para el PUT directo del navegador (comprobantes) desde los
  dominios de las apps.
- Empuje de los builds de `apps/registro` y `apps/panel` al bucket público (PWA servida con
  service worker).
- Dominio propio con Route53 + ACM (opcional, detrás de config).
- Scripts pnpm `cdk:synth` y `cdk:deploy` en la raíz.

## Capabilities

### New Capabilities

- `despliegue`: el sistema queda accesible por HTTPS con los recursos AWS necesarios — tablas con
  GSI, buckets con CORS, API Gateway con authorizer Cognito — y los handlers conectados a las
  rutas publicadas.

### Modified Capabilities

- Ninguna: la infraestructura no altera los requisitos de comportamiento de las capabilities
  existentes; las habilita en producción.

## Non-goals

- Migración o backfill de datos de eventos anteriores.
- Aprovisionamiento del dominio público como requisito (es opcional).
- Escalamiento multi-región o réplicas.
- Pipeline CI/CD de despliegue automático (se deploya con scripts por ahora).

## Impact

- **`infra/cdk` (nuevo)** : stacks CDK TypeScript; dependencias `aws-cdk-lib`, `constructs`,
  `@aws-sdk` types en el workspace.
- **Root**: scripts `cdk:synth`/`cdk:deploy`, documentación de variables en `.env.example`.
- **Consume**: handlers de `services/api`, builds de `apps/registro` y `apps/panel`, contrato de
  grupos de `auth`.
- **Requisitos externos**: bootstrap del account y credenciales AWS configuradas por el operador.