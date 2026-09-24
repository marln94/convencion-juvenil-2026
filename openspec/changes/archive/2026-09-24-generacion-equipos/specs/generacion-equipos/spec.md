# Spec Delta

## Purpose

Divide automáticamente a los participantes con pago confirmado en los 13 grupos de color del
evento mediante un sorteo aleatorio y balanceado, permite consultar la asignación por color o por
participante y bloquear la distribución final.

## ADDED Requirements

### Requirement: Generación aleatoria y balanceada de equipos

El sistema SHALL asignar a cada participante con `estadoPago = pagado` uno de los 13 colores de
equipo de forma aleatoria, procurando que todos los grupos tengan una cantidad de integrantes
similar, con una diferencia máxima de 1 entre el grupo con más y el grupo con menos.

#### Scenario: Generación de equipos válida

- **WHEN** el admin solicita generar los equipos
- **THEN** el sistema asigna `equipoColor` a cada participante pagado
- **AND** la diferencia de integrantes entre el grupo más grande y el más pequeño es de máximo 1

#### Scenario: Solo los pagados participan en el sorteo

- **WHEN** hay participantes con `estadoPago` distinto de `pagado`
- **THEN** el sistema no los incluye en la asignación de equipos

### Requirement: Bloqueo de la asignación

El sistema SHALL impedir regenerar los equipos cuando la asignación está bloqueada y SHALL
permitir al admin bloquear la asignación explícitamente.

#### Scenario: Regenerar con asignación bloqueada

- **WHEN** el admin solicita regenerar y la asignación está bloqueada
- **THEN** el sistema rechaza la operación con un error 409 indicando que la asignación está
  bloqueada

#### Scenario: Bloquear la asignación final

- **WHEN** el admin bloquea la asignación
- **THEN** el sistema marca la configuración como bloqueada y las regeneraciones quedan impedidas

### Requirement: Configuración de colores

El sistema SHALL leer la lista de colores de equipo de la configuración del sistema y SHALL
permitir actualizarla sin cambiar código.

#### Scenario: Generación con colores configurados

- **WHEN** el sistema genera los equipos
- **THEN** usa la lista de colores definida en la configuración (o la lista por defecto si no
  existe)

#### Scenario: Actualización de la lista de colores

- **WHEN** el admin actualiza la lista de colores
- **THEN** las siguientes generaciones usan la nueva lista

### Requirement: Consulta de equipos por color y por participante

El sistema SHALL devolver la asignación completa (participante → color) y la lista de integrantes
de cada color, para que el panel las muestre, imprima o exporte.

#### Scenario: Ver integrantes de un color

- **WHEN** el admin consulta un color
- **THEN** el sistema devuelve la lista de participantes asignados a ese color con sus datos

#### Scenario: Ver la asignación completa

- **WHEN** el admin consulta la asignación de equipos
- **THEN** el sistema devuelve el mapa de participante → color (y agrupado por color)