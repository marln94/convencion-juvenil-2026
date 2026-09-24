# Design

## Context

Ver `proposal.md`. Estado actual: el formulario online (`apps/registro`) y el registro in situ (`apps/panel/src/vistas/RegistroInsitu.tsx`) capturan solo datos básicos. El modelo compartido (`packages/shared-types`) define `RegistrarParticipanteInput` y `Participante` sin los 5 nuevos campos. La validación backend (`services/api/src/lib/validacion.ts`) usa Zod. DynamoDB es schema-less (sin migración requerida).

## Goals / Non-Goals

**Goals:**
- Agregar 5 campos obligatorios a ambos formularios con validación consistente (frontend + backend)
- Hacer `contacto` opcional (era requerido)
- Persistir nuevos campos en DynamoDB sin migración
- Regenerar tipos del `api-client` automáticamente desde `shared-types`

**Non-Goals:**
- Migración de participantes existentes
- Mostrar nuevos campos en gafete/QR/notificaciones
- Validación cruzada región↔localidad
- Lógica de capacidad por día/rol

## Decisions

### 1. Almacenamiento de `region` como string numérica `'1'`–`'13'`
**Rationale:** Compacto, ordenable, coincidente con la lista provista. El label se reconstruye en UI.
**Alternativa:** Label completo (`'Región 1 - Francisco Morazán 1'`) — más verbose, sin ventaja.

### 2. `diasAsistencia` como array de códigos (`'jueves-24'`, etc.)
**Rationale:** Permite multi-selección nativa, extensible, serializable a JSON en DynamoDB.
**Alternativa:** Bitmask o string concatenado — menos legible, más propenso a errores.

### 3. `rol` como enum string `'joven'|'encargado'|'nexo'`
**Rationale:** Valores semánticos, estables, i18n-friendly (labels en UI, códigos en storage).
**Alternativa:** Números o códigos abreviados — menos legibles en logs/DB.

### 4. Validación compartida via Zod en `validacion.ts` como source of truth
**Rationale:** El schema Zod ya existe y se usa en el handler. Frontend replica reglas (no comparte código por ser React vs Node). Mantener sincronía manual es aceptable por bajo número de campos.
**Alternativa:** Compartir schema via `shared-types` + `zod-to-json-schema` — overkill para 5 campos.

### 5. `contacto` opcional en ambos flujos
**Rationale:** Requisito explícito. El backend ya valida formato si se provee; solo se quita el `min(1)`.

### 6. UI: Select nativo para `region` y `rol`, checkbox group para `diasAsistencia`, number input para `edad`, text input para `localidad`
**Rationale:** Controles nativos accesibles, sin dependencias extra. Checkbox group para multi-select de 4 días es estándar UX.

### 7. Paso único 'datos' en formulario online (no nuevo step)
**Rationale:** 5 campos nuevos + existentes caben en una pantalla móvil con scroll. Dividir en steps añade fricción sin beneficio claro.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Frontend/backend validation drift | Tests de integración cubren payloads válidos/inválidos; revisión manual en PR |
| `contacto` opcional rompe consumidores antiguos del API | Documentar breaking change; versionar API si hay consumidores externos (no hay) |
| Checkbox group de 4 días en móvil puede ser estrecho | CSS flex-wrap + gap; labels cortos (`Jue 24`, `Vie 25`, `Sáb 26`, `Dom 27`) |
| Staff in-situ puede no saber región del participante | Placeholder "Seleccioná región" + búsqueda por texto en select (opcional, futura) |
| Edad sin límite superior permite valores irreales (ej. 200) | Validación backend solo positive int; límite superior (ej. 120) añadir si surge problema real |

## Migration Plan

1. **Merge specs + design** → crear tasks
2. **Implementar en orden:**
   - `shared-types` (DTOs + entity)
   - `validacion.ts` (Zod schema)
   - `registro.ts` (handler)
   - `apps/registro` (form online)
   - `apps/panel/RegistroInsitu` (form in-situ)
3. **Build & test:** `pnpm build` + test manual ambos flujos
4. **Deploy:** CDK deploy (Lambda + frontend) — sin migración DB

**Rollback:** Revert commit + redeploy. DynamoDB items nuevos tendrán campos; items antiguos no (compatibles por ser opcionales en lectura).

## Open Questions

- ¿Límite superior para `edad` (ej. 120)? Dejar abierto, añadir si hay datos ruidosos.
- ¿Select de región con búsqueda/filtrado para 13 opciones? Nativo `<select>` basta por ahora; mejorar si UX lo requiere.
- ¿Validar que `diasAsistencia` coincida con días reales de la convención? Hardcodeado en spec; cambiar si fechas cambian.