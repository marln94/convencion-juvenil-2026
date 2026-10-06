# Spec Delta

## ADDED Requirements

### Requirement: Dashboard con últimos inscritos y filtro por nombre

El dashboard de administración SHALL mostrar la lista de participantes sin que el admin tenga que
filtrar: con el buscador por nombre vacío SHALL mostrar los 10 inscritos más recientes ordenados
por `fechaRegistro` descendente, con el buscador siempre visible por encima de la lista y con un
label que indique que se muestran los registros más recientes primero. Al filtrar por nombre SHALL
mostrar todas las coincidencias, también ordenadas por fecha de registro descendente. Las
estadísticas del dashboard SHALL seguir calculándose sobre el conjunto completo de participantes
independientemente del filtro.

#### Scenario: Lista visible sin filtrar

- **WHEN** el admin abre el dashboard con el buscador vacío
- **THEN** la lista muestra los 10 inscritos más recientes
- **AND** un label indica "Últimos inscritos" con el contador "Mostrando los 10 más recientes de N",
  donde N es el total de participantes

#### Scenario: Orden por fecha de registro

- **WHEN** se muestra la lista sin filtro
- **THEN** los participantes aparecen ordenados del más reciente al más antiguo según su
  `fechaRegistro`

#### Scenario: Filtrado con coincidencias

- **WHEN** el admin escribe un nombre en el buscador
- **THEN** la lista muestra todas las coincidencias, ordenadas por fecha de registro descendente,
  sin un tope artificial de resultados

#### Scenario: Filtrado sin coincidencias

- **WHEN** el texto escrito no coincide con ningún nombre de participante
- **THEN** la lista muestra el aviso "Sin coincidencias"

#### Scenario: Búsquedas en ráfaga

- **WHEN** el admin escribe varias veces seguidas y una búsqueda anterior responde después que una
  posterior
- **THEN** la lista refleja el resultado de la última búsqueda escrita, no el de la anterior
