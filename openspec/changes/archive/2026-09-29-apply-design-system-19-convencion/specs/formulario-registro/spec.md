# Spec Delta

## MODIFIED Requirements

### Requirement: Diseño responsive y mobile friendly

El formulario SHALL funcionar correctamente en celulares y tablets: sin desplazamiento horizontal, con gutters laterales visibles, con campos y botones de toque grandes, y con las acciones principales a ancho completo apiladas cuando la pantalla es angosta. Por debajo de 768px SHALL mantener el header y el footer fuera del área desplazable, SHALL impedir el scroll del documento y SHALL permitir que solo el contenido principal se desplace cuando un paso no quepa en el viewport.

#### Scenario: Uso desde un celular

- **WHEN** el participante completa la inscripción desde un celular
- **THEN** el contenido conserva gutters laterales, los botones de acción son fáciles de tocar y el documento no se desplaza

#### Scenario: Paso más alto que el viewport

- **WHEN** un paso del formulario necesita más altura que el viewport móvil
- **THEN** solo el área principal de contenido se desplaza y el header y el footer permanecen visibles

#### Scenario: Teclado virtual abierto

- **WHEN** el usuario escribe en un campo del formulario y se abre el teclado virtual
- **THEN** el área de contenido se ajusta al viewport reducido y el campo activo permanece alcanzable

#### Scenario: Impresión del resultado

- **WHEN** se imprime la pantalla de confirmación
- **THEN** el documento recupera su flujo normal y el contenido no queda recortado por el shell de altura fija
