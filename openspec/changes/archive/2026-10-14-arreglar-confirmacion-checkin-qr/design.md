# Design

## Context

Ver `proposal.md` — Why. El check-in tiene un único estado de confirmación
(`confirmacion`) alimentado por `manejarLlegada`, pero la tarjeta que lo renderiza vive dentro
de la rama de modo búsqueda en `Checkin.tsx`. El escaneo y la búsqueda ya comparten estado y
acciones (`registrarLlegada`), así que la corrección consiste en unificar el punto de
renderizado, no en duplicar lógica.

## Goals / Non-Goals

**Goals:**

- Que la tarjeta de confirmación sea visible en ambos modos con una sola implementación.
- No alterar el comportamiento de asignación ni de registro.

**Non-Goals:**

- Rediseñar la vista de check-in o el layout de la cámara.
- Cambiar la lógica de `decidirEquipoParaLlegada` o del reparto equitativo.

## Decisions

### Decisión 1: Renderizar la confirmación una sola vez, fuera del ternario de modo

Se mueve el bloque `{confirmacion ? <Card>…</Card> : null}` fuera del ternario
`modo === 'escanear' ? … : …`, a un punto común a ambos modos.

- **Por qué**: la confirmación es estado del flujo de llegada, no del modo de entrada. Un único
  punto de renderizado evita la divergencia que causó el bug y elimina el riesgo de que vuelva
  al añadir modos futuros.
- **Alternativa considerada**: duplicar la tarjeta dentro de la rama de escaneo. Se descarta
  porque duplica JSX y reproduce la causa raíz.

### Decisión 2: Ubicar la confirmación antes del contenido de cada modo

La tarjeta se coloca inmediatamente después del encabezado y antes del contenido de modo
(escáner o lista de búsqueda), de forma que aparezca en el mismo lugar en ambos modos y no
desplace la cámara ni la ficha del participante.

- **Por qué**: mantiene el orden visual (encabezado → confirmación → contenido) coherente entre
  modos y da feedback prominente sin depender del scroll de la lista.
- **Alternativa considerada**: insertarla al final del contenedor. Se descarta por quedar fuera
  de la vista en modo escaneo, donde el contenido es corto, y por competir con la ficha del
  participante.

### Decisión 3: Mantener el foco y el estado existentes

No se añade confirmación basada en diálogo nativo ni se cambia el manejo de foco/aria. La tarjeta
existente ya incluye las acciones "Asignar y registrar", "Registrar sin equipo" y "Cancelar".

- **Por qué**: minimiza el alcance del cambio y conserva el comportamiento ya validado en modo
  búsqueda.

## Risks / Trade-offs

- [En modo escaneo la tarjeta puede competir visualmente con la ficha del participante] →
  colocarla antes del contenido de modo la hace visible primero; la ficha permanece debajo.
- [Regresión en el layout de la búsqueda al extraer la tarjeta de su columna] → la tarjeta es de
  ancho completo y ya usaba `print-area`/`mb-4`; verificar visualmente ambos modos.

## Migration Plan

Cambio puramente de frontend en `apps/panel`. Sin migración de datos ni despliegue especial;
rollback = revertir el commit.
