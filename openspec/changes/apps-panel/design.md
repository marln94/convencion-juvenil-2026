# Design

## Context

Ver proposal.md - Why. `apps/registro` ya establece el patrón de app React + Vite + Tailwind
consumiendo `@convencion/api-client`. `auth` deja el token de Cognito en `getToken`, y los changes
de búsqueda, pagos y equipos dejan los handlers listos. Este change construye la app interna única,
mobile-first, con modo contingencia offline en las vistas de campo.

## Goals / Non-Goals

**Goals:**
- Una PWA instalable con vistas protegidas por rol (admin ⊇ staff).
- Offline graceful: cola local persistente + sincronización sin pérdida de datos.
- Mobile-first, con layout adecuado para tablet horizontal y laptop.

**Non-Goals:**
- Infraestructura y despliegue (`infra-cdk`).
- Pool/grupos de Cognito y authorizer de la API (`auth`).
- `apps/registro` (público) — no se toca.

## Decisions

### 1. PWA con precache del shell y caché selectiva de lecturas

`vite-plugin-pwa` precachea el shell de la app (usable sin red). Las respuestas de listados de la
API se cachean con estrategia stale-while-revalidate; **no** se cachean las escrituras.

- **Por qué**: la UI del campo funciona offline sin cargar nada más, y las lecturas de
  administración (pagos/equipos) se mantienen razonablemente frescas con la red.
- **Alternativa considerada**: cachear todo — las bandejas de administración quedarían obsoletas:
  se descarta.

### 2. Capa de estado de conexión explícita y cola en IndexedDB

Un hook global expone `online / offline / syncing` y el contador de pendientes. Las escrituras de
campo (check-in e in situ) pasan siempre por una cola en IndexedDB (lib `idb` + capa de sync
propia): en línea se suben al instante; offline se acumulan y se suben en orden al reconectar,
limpiando la cola solo ante respuesta 2xx.

### 3. Índice local de participantes para búsqueda y check-in offline

Con las respuestas de `listarParticipantes` se mantiene un índice local (id, nombre,
`estadoPago`, `equipoColor`, `checkIn`). El check-in offline busca ahí. Como el acceso nunca se
bloquea (ver spec `check-in`), un índice desactualizado no provoca rechazos de entrada.

### 4. Login con Amplify Auth y token en `api-client`

Se usa `@aws-amplify/auth` con el pool de Cognito para persistir la sesión y refrescar en silencio;
`createApiClient({ getToken, onUnauthorized })` (del change `auth`) inyecta el token y, ante 401,
dispara re-login. El landing se decide por el grupo del usuario.

### 5. Sin librería de server-state por ahora

Buscador de participantes, check-in y registro in situ usan el cliente tipado + caché del SW; no se
introduce react-query en esta fase (se pospone si la complejidad lo pide).

## Risks / Trade-offs

- [Voluntarios confundidos por el indicador "sin sincronizar"] → Mitigación: banner simple con
  mensaje claro y la acción de sincronizar explícita.
- [Dos staff registran el mismo in situ antes de sincronizar] → Mitigación: `participantId` UUID
  generado en el dispositivo; el segundo registro es un participante distinto (no una colisión).
- [Refresh del token falla a mitad de un turno offline] → Mitigación: la cola persiste y la
  sincronización ocurre al recuperar sesión+señal; no se pierde nada.
- [Caché local crece] → Mitigación: índice acotado a ~800 participantes; se trunca con los
  listados paginados.

## Migration Plan

Sin despliegue hasta `infra-cdk`. Rollback = revert del commit. La app es nueva; no hay datos que
migrar.