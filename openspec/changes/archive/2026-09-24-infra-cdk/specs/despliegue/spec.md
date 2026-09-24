# Spec Delta

## Purpose

Despliega el sistema en AWS: frontends publicados por HTTPS, API Gateway con los handlers
conectados y authorizer de Cognito, tablas DynamoDB con sus índices y buckets con CORS, de modo
que las apps funcionen con la infraestructura real.

## ADDED Requirements

### Requirement: Publicación de los frontends

El sistema SHALL publicar las apps web en un hosting estático servido por HTTPS y SHALL servir la
PWA con su service worker para que se pueda instalar.

#### Scenario: Las apps se sirven por HTTPS

- **WHEN** un usuario accede a la URL de una aplicación
- **THEN** el sistema sirve la app por HTTPS desde el hosting estático

#### Scenario: La PWA sirve su service worker

- **WHEN** se carga la aplicación de campo (panel)
- **THEN** el service worker se sirve sin conflictos de caché del CDN y la app se puede instalar

### Requirement: API Gateway con lambdas y authorizer

El sistema SHALL exponer la API por HTTPS con cada handler Lambda conectado a sus rutas y SHALL
exigir un token de Cognito válido en las rutas de la API interna.

#### Scenario: Las rutas del backend responden

- **WHEN** una solicitud llega a una ruta de la API
- **THEN** el API Gateway enruta a la Lambda correspondiente (registro, búsqueda, revisar-pago,
  equipos, check-in)

#### Scenario: La API interna exige token

- **WHEN** una solicitud a una ruta interna llega sin token válido
- **THEN** el authorizer rechaza la solicitud antes de llegar a la Lambda

### Requirement: Respuestas de la API con CORS

El sistema SHALL incluir cabeceras CORS en las respuestas de la API —tanto de éxito como de
error— y en el rechazo del authorizer, de modo que el navegador pueda leerlas desde los dominios
de las apps.

#### Scenario: El navegador lee las respuestas de la API

- **WHEN** una app del panel o de registro consulta la API desde su dominio
- **THEN** las respuestas de las lambdas incluyen `Access-Control-Allow-Origin`
- **AND** el rechazo del authorizer (`401`) también la incluye

### Requirement: Tablas DynamoDB con índices

El sistema SHALL crear las tablas `Participantes` y `Configuracion` en DynamoDB on-demand con los
índices secundarios definidos (GSI por `estadoPago` y GSI por `equipoColor`), de modo que los
handlers encuentren los recursos que esperan por variables de entorno.

#### Scenario: Los handlers consultan las tablas

- **WHEN** un handler opera sobre DynamoDB
- **THEN** las tablas y los GSI existen con la estructura que el handler espera
- **AND** los handlers reciben los nombres de tabla y bucket por variables de entorno

### Requirement: Buckets de almacenamiento

El sistema SHALL crear el bucket privado de comprobantes con CORS habilitado para la subida
directa del navegador y con regla de lifecycle que caduque los objetos subidos, junto con los
buckets públicos de hosting de las apps.

#### Scenario: Subida directa de comprobante con CORS

- **WHEN** el navegador hace PUT a una URL firmada del bucket privado
- **THEN** el bucket acepta la subida gracias a la configuración CORS

#### Scenario: Caducidad de los comprobantes subidos

- **WHEN** un objeto bajo la ruta de comprobantes ha sido subido hace más del período configurado
- **THEN** la regla de lifecycle lo elimina automáticamente