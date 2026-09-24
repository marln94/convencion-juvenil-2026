# Design

## Context

Ver proposal.md - Why. El monorepo no tiene aún el workspace `infra/cdk`; los handlers corren
local contra env vars y DynamoDB de desarrollo (`services/api/.env.local`). La propuesta técnica
eligió CDK TypeScript y ya modeló la tabla, los GSI y los servicios (S3 + CloudFront, Lambda + API
Gateway, DynamoDB, Cognito). El change `auth` define el contrato de grupos que este despliegue
debe materializar.

## Goals / Non-Goals

**Goals:**
- Despliegue reproducible del stack completo con `cdk deploy`.
- Env vars inyectadas a cada Lambda y CORS del bucket privado listo para la subida del navegador.

**Non-Goals:**
- Pipeline CI/CD automático (se deploya por comandos por ahora).
- Multi-región o réplicas.
- Aprovisionamiento del dominio propio como requisito (opcional detrás de config).

## Decisions

### 1. Una App CDK con stacks separados por responsabilidad

`AuthStack` (Cognito pool + grupos `admin`/`staff`), `DataStack` (DynamoDB + GSI), `StorageStack`
(S3 público + CloudFront; S3 privado + CORS + lifecycle), `ApiStack` (Lambda + API Gateway +
authorizer). Se comunican por propiedades, no por refs cross-stack frágiles.

### 2. Lambda bundled con `NodejsFunction` (esbuild)

CDK compila el TypeScript de `services/api` directamente; no hay paso de build manual antes del
deploy. Se comparte el runtime Node 20.

### 3. Authorizer Cognito en la puerta + middleware de roles en la Lambda

`CognitoUserPoolsAuthorizer` valida el token (401 si no autenticado); el middleware del change
`auth` aplica la matriz de grupos (403 si el rol no corresponde). El contrato de grupos vive en el
change `auth` y se referencia aquí.

### 4. CORS del bucket de comprobantes y lifecycle

Se publican los orígenes de `apps/registro` y `apps/panel` en la política CORS (PUT pre-firmado) y
se agrega una regla de lifecycle que expira objetos huérfanos (p. ej. 30 días).

### 5. Hosting de las apps y PWA

`apps/registro` y `apps/panel` se construyen y se suben al bucket público, con invalidation de
CloudFront al desplegar y cabeceras correctas para el service worker (no cache del JS del SW).

## Risks / Trade-offs

- [Cold starts de Lambda en el check-in] → Mitigación: funciones pequeñas, sin dependencias
  pesadas, runtime Node 20; el volumen de la puerta es bajo.
- [Costos mensuales] → Mitigación: DynamoDB on-demand, S3 + CloudFront y Lambda solo por uso; se
  mantiene el estimado de la propuesta funcional (< $10 USD/mes).
- [CORS mal configurado rompe la subida de comprobantes] → Mitigación: la config CORS vive en CDK
  (fuente única) y se valida en las pruebas manuales de `apps/registro` contra el bucket real.
- [Sin canal de notificación a los participantes] → Asumido: el sistema no envía correos; la
  constancia del estado queda en el panel/admin.

## Migration Plan

1. `cdk bootstrap` del account (una vez).
2. `cdk deploy` sube los stacks en orden de dependencia.
3. Rollback: `cdk destroy` o síntesis planificada de una versión anterior. No hay migración de
   datos (tablas nuevas).