# Tasks

## 1. Tipos compartidos

- [x] 1.1 Agregar en `@convencion/shared-types` el tipo `RolUsuario = 'admin' | 'staff'` y el DTO
      `Sesion { rol: RolUsuario, grupos: string[], expiraEn: number }`, exportados desde `index.ts`.
      **Verificación**: `pnpm --filter @convencion/shared-types typecheck` compila.
- [x] 1.2 Documentar la matriz de roles como constantes tipadas (qué rutas/métodos permiten `staff`
      y cuáles solo `admin`) en `services/api/src/lib/roles.ts`, exportándola para tests y CDK.
      **Verificación**: `pnpm --filter @convencion/api typecheck` compila.

## 2. Middleware de autenticación

- [x] 2.1 Instalar `jose` en `services/api` y crear `src/lib/auth.ts` con `verifyToken(token)` que
      valida el JWT contra el JWKS de Cognito (env `COGNITO_USER_POOL_ID` + región, con cache del
      JWKS) y extrae `sesion` con grupos y rol derivado.
      **Verificación**: test unitario con `jose` firmando tokens de prueba que devuelve la sesión
      con rol correcto y otro que lanza 401 para token inválido.
- [x] 2.2 Crear el middleware Hono `requireAuth(rutasPermitidas?)` que aplica la matriz: 401 sin
      token inválido, 403 si el rol no tiene permiso para la ruta, y soporte de bypass de dev con
      `AUTH_BYPASS_DEV=true`.
      **Verificación**: tests del middleware para 401 sin token, 401 token inválido, 403 de staff a
      ruta admin, 200 de staff a ruta de campo y 200 de admin a todo.
- [x] 2.3 Montar `requireAuth` en los handlers existentes (`registro`, `revisar-pago`,
      `generar-equipos`, `checkin`) preservando las rutas de campo para `staff` y restringiendo
      pagos/equipos a `admin`.
      **Verificación**: `pnpm --filter @convencion/api test` pasa en verde.

## 3. Cliente de API

- [x] 3.1 Ampliar `createApiClient` en `@convencion/api-client` con `getToken` (inyecta
      `Authorization: Bearer`) y `onUnauthorized` (callback al recibir 401), propagando 403 como
      error tipado.
      **Verificación**: `pnpm --filter @convencion/api-client typecheck` compila y test del cliente
      con fetch mockeado verifica el header y el callback de 401.

## 4. Verificación final

- [x] 4.1 Ejecutar `pnpm -r typecheck`, `pnpm -r build` y `pnpm --filter @convencion/api test` en
      verde tras el cambio.
      **Verificación**: los tres comandos terminan sin errores.