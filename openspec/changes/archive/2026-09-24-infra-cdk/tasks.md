# Tasks

## 1. Scaffolding del workspace

- [x] 1.1 Crear `infra/cdk` (App CDK TypeScript con `aws-cdk-lib` y `constructs` como deps,
      runtime Node 20), agregar el workspace a `pnpm-workspace.yaml` y los scripts
      `cdk:synth`/`cdk:deploy` en la raíz.
      **Verificación**: `pnpm install` pasa y `pnpm --filter @convencion/infra-cdk build` compila un
      app vacío.

## 2. Stacks

- [x] 2.1 **AuthStack**: Cognito User Pool con los grupos `admin` y `staff` según el contrato del
      change `auth`, exponiendo el id del pool y región para los demás stacks.
      **Verificación**: `cdk synth` genera el template y contiene el pool con ambos grupos.
- [x] 2.2 **DataStack**: DynamoDB on-demand — tabla `Participantes` (PK `participantId`, GSI de
      `estadoPago` → `fechaRegistro` y GSI de `equipoColor` → `nombre`) y tabla `Configuracion`.
      **Verificación**: `cdk synth` genera ambos `AWS::DynamoDB::Table` con los `GlobalSecondaryIndex`
      esperados.
- [x] 2.3 **StorageStack**: bucket público de hosting + CloudFront para `apps/registro` y
      `apps/panel`, y bucket privado `comprobantes` con política CORS (orígenes de las apps) y
      regla de lifecycle para objetos huérfanos.
      **Verificación**: `cdk synth` genera los buckets, el CORS en el privado y la distribución de
      CloudFront.
- [x] 2.4 **ApiStack**: API Gateway REST con `CognitoUserPoolsAuthorizer` y las rutas conectadas a
      cada handler (registro, listar-participantes, revisar-pago, generar-equipos, checkin) con las
      env vars de tablas/buckets inyectadas.
      **Verificación**: `cdk synth` genera el gateway, el authorizer conectado al pool del
      AuthStack y los endpoints por ruta.

## 3. Publicación de las apps y PWA

- [x] 3.1 Pipeline de build: compila `apps/registro` y `apps/panel`, sube los bundles al bucket
      público, invalida CloudFront al desplegar y sirve el service worker de la PWA sin cache del
      JS del SW.
      **Verificación**: tras un deploy de prueba, la PWA se instala y el SW se descarga con las
      cabeceras correctas.
- [ ] 3.2 (Opcional) Dominio propio con Route53 + ACM detrás de config.
      **Verificación**: si se configura, la URL del dominio sirve las apps por HTTPS.

## 4. Verificación final

- [x] 4.1 Ejecutar `cdk synth` sin errores y `pnpm -r typecheck`/`pnpm -r build` en verde; documentar
      el flujo de bootstrapping (`cdk bootstrap`) y las variables en `.env.example`.
      **Verificación**: síntesis limpia y `cdk deploy` de un entorno de prueba levanta el stack
      completo (tablas, buckets, gateway, authorizer, hosting).