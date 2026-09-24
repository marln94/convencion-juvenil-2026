# Proposal

## Contexto

El panel consolidado (`apps/panel`) agrupa en una sola app las vistas de administración y de
campo, con dos grupos de usuarios donde **admin ⊇ staff** (los administradores pueden operar
también las tareas de campo). Hoy los handlers de `services/api` no validan ninguna credencial:
cualquier petición HTTP puede registrar participantes, revisar pagos o generar equipos. Antes de
exponer el panel a voluntarios eventuales hay que proteger la API con login y roles.

## Why

Sin autenticación, cualquiera que conozca la URL de la API podría aprobar comprobantes de pago o
reasignar equipos. La consolidación en `apps/panel` hace que la separación por roles sea un
requisito duro desde el inicio: el staff (voluntarios reclutados para el check-in) solo debe
acceder a operaciones de campo; los admins, a todo.

## What Changes

- Middleware de autenticación para los handlers de `services/api`: valida el JWT de Cognito y
  mapea el grupo (`admin` | `staff`) del usuario autenticado.
- Matriz de roles aplicada en el borde de la API:

  | Rol | GET /inscripciones | POST /inscripciones (in situ) | POST /checkin | POST /pagos/revisar | POST /equipos/generar |
  |---|---|---|---|---|---|
  | staff | sí | sí | sí | — | — |
  | admin | sí | sí | sí | sí | sí |

- Respuestas `401` (sin token o token inválido) y `403` (rol sin permiso), siempre con `{ message }`.
- `@convencion/api-client`: adjunta el token de acceso a cada request y distingue 401 (sesión
  expirada → re-login) de otros errores.
- DTOs de sesión/rol en `@convencion/shared-types`.
- Contrato de los grupos de Cognito (nombre de grupos y endpoints por rol) que `infra-cdk` consume
  para crear el pool, los grupos y el authorizer del API Gateway.

## Capabilities

### New Capabilities

- `autenticacion`: login con Cognito, grupos `admin`/`staff` con `admin ⊇ staff`, y protección de
  los endpoints de la API según el rol del usuario.

### Modified Capabilities

- Ninguna: `registro` y `formulario-registro` no cambian su comportamiento.

## Non-goals

- Crear los recursos AWS físicos (Cognito pool, grupos, authorizer del API Gateway): se materializan
  en el change `infra-cdk`, que consume el contrato definido aquí.
- Login y gestión de sesión en el frontend (`apps/panel`): es parte del change `apps-panel`.
- El registro público `apps/registro` NO requiere login: queda explícitamente fuera de este change.
- Recuperación de contraseña o administración de usuarios desde la app.

## Impact

- **`services/api`**: nuevo middleware de auth montado en los handlers existentes (registro,
  revisar-pago, generar-equipos, checkin) y en los de búsqueda.
- **`packages/shared-types`**: DTOs de rol/sesión y tipo `RolUsuario = 'admin' | 'staff'`.
- **`packages/api-client`**: attach del token y manejo de 401/403.
- **`infra-cdk`**: consume el contrato de grupos y endpoints para el authorizer.
- **No afecta**: `apps/registro` (público, sin login) y el modelo de datos.