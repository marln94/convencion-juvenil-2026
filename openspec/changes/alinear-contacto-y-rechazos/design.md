# Design

## Context

Ver `proposal.md` para el motivo. Contexto técnico relevante:

- Los patrones `PATRON_TELEFONO`/`PATRON_CORREO` están copiados en tres archivos
  (`apps/registro/src/App.tsx`, `apps/panel/src/vistas/RegistroInsitu.tsx`,
  `services/api/src/lib/validacion.ts`) y la semántica de `contacto` divergió entre ellos.
- `@convencion/shared-types` ya es dependencia de la API, de ambos apps y devDependency de
  `@convencion/ui`, y ya aloja lógica en runtime (`edad.ts` con `rangoEdadPermitido`).
- La cola del panel (`apps/panel/src/lib/cola.ts`) ya persiste los descartes en el store
  `descartadas` con `status` y `motivo`, y `listarDescartadas`/`limpiarDescartadas` existen
  pero no tienen consumidor de UI. Lo que falta es el reporte veraz en el momento del alta y
  la visualización del detalle.
- No existe componente de diálogo/modal en `@convencion/ui`; sí `Pill`, `Card`, `Alert`.

## Goals / Non-Goals

**Goals:**

- Una sola fuente de verdad para patrones/helpers de teléfono y correo consumida por API y
  ambos formularios.
- Semántica idéntica de `contacto`/`correo` en `/registro`, en el registro in-situ y en la API.
- Formato telefónico automático (`dddd-dddd`) sin escribir el guion.
- Errores inline por campo en el formulario in-situ.
- Rechazos del servidor veraces en la pantalla de origen y consultables desde la cabecera.

**Non-Goals:**

- Cambiar `encargadoContacto`, migrar datos existentes, soporte `+504`, enviar correos.
- Componente `Dialog` genérico en el design system (el detalle de rechazadas usa un panel
  embebido bajo la pill de la cabecera).
- Revertir el flag de check-in local cuando un check-in encolado se descarta.

## Decisions

1. **Los helpers viven en `@convencion/shared-types` (`src/contacto.ts`) en lugar de un paquete
   nuevo.** Alternativa descartada: paquete `packages/validacion` — sería más limpio en
   nombre, pero agrega un workspace más para dos funciones y `shared-types` ya cumple ese rol
   con `edad.ts`. Queda claro que el paquete es "tipos y reglas compartidas", no solo tipos.

2. **`contacto` = solo teléfono también en la API (breaking controlado).** Solo afecta
   escrituras nuevas; no hay migración porque `contacto`/`correo` no se leenan en ninguna otra
   vista. Los dos clientes que existen (web y panel) se actualizan en el mismo cambio, así que
   no queda ningún emisor que envíe correos en `contacto`. `encargadoContacto` conserva
   teléfono-o-correo: es un único campo para el encargado.

3. **Normalización server-side**: `normalizarTelefono` acepta `dddd-dddd` o exactamente 8
   dígitos (los guarda formateados) y rechaza cualquier otra cosa. Alternativa descartada:
   exigir el guion (más estricto, pero obliga a cada cliente a formatear bien); la
   normalización da robustez casi gratis y beneficia a llamadas manuales a la API.

4. **`TelefonoInput` como componente en `@convencion/ui`, no como helper en cada app.**
   Envuelve `Input` (reutiliza label/error/estilos), centraliza `type="tel"`,
   `inputMode="tel"`, `autoComplete="tel"`, el límite de 8 dígitos y el formateo. Reglas:
   se conservan solo dígitos; al **escribir** un dígito extra se ignora (los primeros 8 son el
   valor anterior); al **pegar** más de 8 dígitos se conservan los primeros 8; el guion se
   inserta solo cuando hay más de 4 dígitos, de modo que backspace sobre `8877-` produce
   `8877` sin rebote. Trade-off aceptado: al reformatear, el cursor queda al final del valor
   (edición en el medio del campo es rara en un número de 8 dígitos).

5. **Errores inline en el panel replicando el patrón de `/registro`**: mapa de `tocados` +
   `errorDe(campo)` que revalida en vivo, y al enviar se marcan todos los campos como tocados.
   Se elimina el `Alert` único de error. Alternativa descartada: mantener banner + errores
   inline (dos canales de error para lo mismo).

6. **Reporte de descartes sin cambiar la firma de `encolarOperacion`**: `sincronizarCola`
   devuelve `OperacionDescartada[]` del pase y `sincronizar()` lo propaga. El registro
   in-situ y el check-in filtran por su `participantId`/`participantId` para saber si **su**
   operación fue la rechazada. Alternativa descartada: que `encolarOperacion` devuelva el id
   de la operación — requeriría hilar ids por ambas vistas sin ganar nada (el payload ya
   lleva el `participantId`).

7. **Detalle de rechazadas como panel embebido bajo la pill** de la cabecera (`App.tsx`), con
   `Card` y los helpers ya existentes. Alternativa descartada: nuevo `Dialog` del design
   system (overhead de accesibilidad y de delta de spec para algo acotado) y vista nueva en la
   nav (ruido de navegación para información operativa puntual).

8. **Reparación de formato en `openspec/specs/registro/spec.md`**: el header
   `### Requirement: Registro por encargado` estaba pegado al final de la línea anterior, con
   lo que el parser no lo reconocía como requisito (contaba 6 en lugar de 7). Se separa a su
   propia línea; es un arreglo estructural sin cambio de comportamiento, necesario para que
   los deltas MODIFIED tengan límites de bloque correctos.

## Risks / Trade-offs

- [Alguien enviaba correos dentro de `contacto` vía API] → es intencional (breaking
  documentado en la propuesta); el error 400 lo explica y ambos formularios ya no lo permiten.
- [Un registro rechazado dejó un QR impreso en flujos previos] → con el reporte veraz la
  pantalla de éxito ya no se muestra ante un rechazo; el QR solo se ofrece si la
  sincronización confirmó.
- [El formateo controlado mueve el cursor al final al editar en el medio] → aceptado: campo
  corto de entrada numérica; se reconsideraría si hubiera edición frecuente en el medio.
- [Operaciones rechazadas sin conexión solo se ven al reconectar] → ya era así; el detalle
   con motivo reduce el silencio, y el pill de cabecera es persistente hasta revisar.
- [Tests de UI inline ausentes en el panel] → la validación compartida se cubre desde la API
  (zod) y `cola.test.ts` cubre el retorno de descartes; el comportamiento visual de errores
  inline se replica del patrón ya probado en `/registro` (tampoco con tests de UI hoy).

## Migration Plan

1. Desplegar API y frontends en el mismo despliegue (el cambio de validación es simultáneo al
   cambio de formularios).
2. Sin migración de datos; la validación nueva aplica a escrituras nuevas.
3. Rollback: revert del commit + redeploy; los datos escritos con el formato anterior siguen
   siendo consultables (no se renombra ningún campo).

## Open Questions

Ninguna.
