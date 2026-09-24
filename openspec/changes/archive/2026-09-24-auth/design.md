# Design

## Context

Ver proposal.md - Why. Hoy los handlers de `services/api` exponen todas las rutas sin validar
credencial alguna. El stack comparte TypeScript en toda la pila y los tests de handlers usan
Vitest con los SDKs de AWS mockeados, sin AWS real. `infra-cdk` creará el pool de Cognito y el
authorizer del API Gateway; este change define y aplica el contrato de roles en el código de la
API y en el cliente.

## Goals / Non-Goals

**Goals:**
- Matriz de roles ejecutable y testeable en el borde de la API (middleware).
- Tipos compartidos del rol y DTOs de sesión.
- Cliente de API que adjunta el token y diferencia 401 de otros errores.

**Non-Goals:**
- Crear el pool de Cognito, los grupos o el authorizer del API Gateway (viven en `infra-cdk`).
- Pantalla de login y persistencia de sesión (viven en `apps-panel`).

## Decisions

### 1. Verificación del JWT con JWKS en el middleware; el grupo se lee del token

Cognito firma el token; el middleware valida la firma contra el JWKS del pool (env vars
`COGNITO_USER_POOL_ID` y `COGNITO_REGION`, o `COGNITO_JWKS_URL` para dev) con `jose`, lee el
claim `cognito:groups` y aplica la matriz de roles. El authorizer del API Gateway (`infra-cdk`)
valida el token en la puerta (401); el middleware aplica el grupo (403).

- **Por qué**: un solo mecanismo de verificación portable a dev local y tests, independiente de la
  topología del API Gateway; el rol viaja en el token.
- **Alternativa considerada**: Lambda authorizer que además chequea grupos — duplica la matriz en
  CDK; se descarta, el middleware es la fuente de verdad y CDK copia solo el contrato de grupos.

### 2. Matriz de roles como constantes compartidas

La matriz `staff → { campo }`, `admin → { campo, administración }` se define con constantes
tipadas (ruta + método), no strings dispersos, para que los tests y `infra-cdk` referencien el
mismo contrato.

### 3. Bypass de desarrollo controlado por env var

En el servidor de dev (Hono local) se admite un rol de prueba solo si `AUTH_BYPASS_DEV=true`
está activa (ausente en producción). Los tests del middleware cubren ambos caminos.

### 4. cliente con `getToken` y `onUnauthorized`

`createApiClient({ getToken, onUnauthorized })` adjunta `Authorization: Bearer <token>` y, ante
401, invoca `onUnauthorized` para que `apps-panel` pida re-login. Los 403 se propagan como error
tipado.

## Risks / Trade-offs

- [Fetch del JWKS en cada cold start] → Mitigación: cachear el JWKS en memoria con TTL.
- [Token sin grupo o grupo desconocido] → Mitigación: se responde 403, no 401 (el token es válido
  pero la persona no tiene permiso).
- [Bypass de dev mal encendido en producción] → Mitigación: la env var se valida y el despliegue
  (`infra-cdk`) no la define.

## Migration Plan

Sin despliegue hasta `infra-cdk`. Rollback = revert del change: los handlers vuelven a no exigir
token. El bypass de dev queda documentado para que el server local no se vea afectado.

## Open Questions

Ninguna que cambie specs o tareas.