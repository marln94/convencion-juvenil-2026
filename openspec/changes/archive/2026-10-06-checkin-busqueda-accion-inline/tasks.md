# Tasks

## 1. Rediseño de resultados y card de escaneo

- [x] 1.1 Convertir la fila de resultado de `<button>` a `<div>` flex con columnas (nombre +
      pills a la izquierda; a la derecha botón "Registrar" `variant="primary"` `min-h-11`
      solo si `!checkIn`, o píldora "Llegó" sin elementos interactivos si `checkIn`),
      eliminando el `onClick → setParticipante` — verificar en el navegador que registrar
      desde una fila actualiza esa fila a "Llegó" sin abrir nada al final de la lista
- [x] 1.2 Agregar el aviso de pago como línea propia bajo los pills cuando
      `estadoPago !== 'pagado'`, con la copia nueva de design.md en filas **y** en el card
      de escaneo (reemplazar los textos de las líneas 346-348) — verificar que pendiente y
      rechazado muestran su texto en ambas vistas
- [x] 1.3 Gatear el card de detalle con `modo === 'escanear'` y pasar su botón a usar el
      nuevo estado `procesandoId` — verificar que escanear un QR sigue mostrando la ficha
      completa con su botón, y que la búsqueda nunca muestra el card

## 2. Separación de fases y feedback en `registrarLlegada`

- [x] 2.1 Reemplazar `procesando` (boolean) por `procesandoId: string | null` en la función
      y en los dos UI (fila/card), mostrando "Registrando…" solo en el participante en
      curso — verificar que dos filas no muestran "Registrando…" a la vez
- [x] 2.2 Reestructurar `registrarLlegada` en fases: `try/catch` local sobre
      `encolarOperacion` + `agregarAlIndice` con nuevo estado de error (Alert visible bajo
      el input de búsqueda o la ficha, sin voltea la fila y con `return`), y punto de no
      retorno que actualiza `setResultados` (map a `checkIn: true`) y `setParticipante`
      condicional (`prev?.participantId === id`) — verificar forzando un error de
      almacenamiento que aparece el Alert y la fila no cambia
- [x] 2.3 Envolver `sincronizar()` en `try/catch` vacío (silencioso) tras el punto de no
      retorno, y renderizar el `Alert` de éxito solo con `modo === 'escanear'` — verificar
      que en modo offline el registro de búsqueda funciona sin Alert de error y la píldora
      "N sin sincronizar" del header se incrementa

## 3. Verificación y validación

- [x] 3.1 Ejecutar `pnpm --filter @convencion/panel typecheck`,
      `pnpm --filter @convencion/panel test` y `pnpm verify:design`, corrigiendo cualquier
      fallo — verificar que los tres pasan
- [x] 3.2 Recorrer manualmente el happy path completo en el navegador (búsqueda: registrar
      a un no-llegado, fila cambia a "Llegó"; fila de ya-llegado no clicable; escaneo QR:
      ficha + mensaje de éxito; aviso de pago en ambos modos) y ejecutar
      `openspec validate checkin-busqueda-accion-inline` — verificar que la validación
      pasa
