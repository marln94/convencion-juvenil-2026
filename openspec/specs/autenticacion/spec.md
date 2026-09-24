# Autenticacion

## Purpose

Provee la autenticación y autorización del sistema interno: login con Cognito, dos grupos de
usuarios donde admin ⊇ staff y protección de los endpoints de la API según el rol del usuario
autenticado.

## Requirements

### Requirement: Autenticación de solicitudes a la API interna

El sistema SHALL exigir un token válido de Cognito (JWT) en toda solicitud a los endpoints de la
API interna —salvo las rutas públicas de registro: la inscripción en línea
(`tipoRegistro = online`) y la solicitud de subida de comprobante— y SHALL rechazar con 401 las
solicitudes sin token o con token inválido.

#### Scenario: Solicitud autenticada

- **WHEN** una solicitud incluye un token JWT válido de Cognito
- **THEN** el sistema procesa la solicitud con el rol del usuario autenticado

#### Scenario: Solicitud sin token

- **WHEN** una solicitud a un endpoint interno no incluye token de acceso
- **THEN** el sistema responde 401 con un mensaje indicando que se requiere autenticación

#### Scenario: Token inválido o expirado

- **WHEN** una solicitud incluye un token inválido o expirado
- **THEN** el sistema responde 401 con un mensaje indicando que la sesión no es válida

#### Scenario: Registro en línea sin token

- **WHEN** llega una solicitud de inscripción en línea o de subida de comprobante sin token
- **THEN** el sistema la procesa sin exigir autenticación

### Requirement: Grupos de usuarios con jerarquía admin ⊇ staff

El sistema SHALL distinguir dos grupos de usuarios, `admin` y `staff`, donde los usuarios `admin`
acceden a todo lo que los `staff` pueden hacer más las operaciones de administración.

#### Scenario: Staff accede a operaciones de campo

- **WHEN** un usuario del grupo `staff` autenticado llama a un endpoint de campo (check-in,
  registro in situ, búsqueda)
- **THEN** el sistema permite la operación

#### Scenario: Admin accede a operaciones de campo

- **WHEN** un usuario del grupo `admin` llama a un endpoint de campo
- **THEN** el sistema permite la operación

#### Scenario: Admin accede a operaciones de administración

- **WHEN** un usuario del grupo `admin` llama a un endpoint de administración (revisar pagos,
  generar equipos)
- **THEN** el sistema permite la operación

### Requirement: Restricción de endpoints de administración por rol

El sistema SHALL rechazar con 403 las solicitudes de usuarios `staff` a los endpoints de
administración (revisar pagos, generar equipos, configurar equipos) dejando los endpoints de
campo abiertos a ambos roles.

#### Scenario: Staff intenta revisar un pago

- **WHEN** un usuario del grupo `staff` llama al endpoint de revisión de pagos
- **THEN** el sistema responde 403 con un mensaje de permiso denegado

#### Scenario: Staff intenta generar equipos

- **WHEN** un usuario del grupo `staff` llama al endpoint de generación de equipos
- **THEN** el sistema responde 403 con un mensaje de permiso denegado

### Requirement: Manejo de sesión en el cliente de API

El sistema SHALL adjuntar el token de sesión de Cognito (idToken) a cada solicitud del cliente de
la API interna y SHALL distinguir una sesión expirada (401) de otros errores para que la app pueda
solicitar re-login sin perder operaciones pendientes.

#### Scenario: Cliente autenticado llama a la API

- **WHEN** la app interna hace una llamada a la API
- **THEN** el token de sesión se incluye en el encabezado de autorización de la solicitud

#### Scenario: Sesión expirada mientras se opera

- **WHEN** la API responde 401 a una operación de la app
- **THEN** el cliente distingue la falta de sesión de otros errores y puede pedir re-login
  conservando la operación pendiente