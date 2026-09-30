# Spec Delta

## ADDED Requirements

### Requirement: Login del panel con el eslogan de la convención
La pantalla de inicio de sesión del panel SHALL mostrar el eslogan de la Convención Juvenil
("Atrévete a ser diferente") junto con el símbolo ≠ como una sola pieza gráfica, y SHALL
exponer ese eslogan como nombre accesible de la imagen.

La pantalla SHALL NOT mostrar un símbolo ≠ separado del eslogan ni el título "Panel" como
elemento de marca propio. El eslogan SHALL componerse sobre el fondo de papel, sin caja
rectangular visible.

Como el eslogan reemplaza al título que era el único encabezado de la página, el sistema
SHALL mantener una jerarquía de encabezados válida: el eslogan SHALL ser el encabezado de
nivel 1 de la pantalla de login, de modo que el documento no quede sin `<h1>` y el nombre
accesible del encabezado no se duplique.

La pantalla SHALL conservar el formulario de usuario y contraseña, el mensaje de credenciales
incorrectas y la separación de vistas por rol que existían antes de este cambio.

Como el panel es una PWA que se usa con conectividad degradada en la puerta, el eslogan
SHALL estar disponible en el precache para que la pantalla de login se renderice completa
sin conexión de red.

#### Scenario: El login muestra el eslogan

- **WHEN** una persona abre el panel sin sesión iniciada
- **THEN** ve el eslogan "Atrévete a ser diferente" con el símbolo ≠ integrado, en lugar del
  símbolo aislado y el título "Panel"

#### Scenario: El eslogan se lee sin ver

- **WHEN** una persona navega la pantalla de login con un lector de pantalla
- **THEN** el eslogan se anuncia una sola vez como "Atrévete a ser diferente" y el símbolo ≠
  no se anuncia por separado

#### Scenario: La pantalla conserva su encabezado

- **WHEN** se inspecciona el árbol de encabezados de la pantalla de login
- **THEN** existe exactamente un encabezado de nivel 1, su nombre accesible es el eslogan, y
  ningún lector de pantalla lo anuncia dos veces

#### Scenario: El login sigue funcionando

- **WHEN** una persona introduce credenciales válidas
- **THEN** el acceso se concede y la persona llega a la vista inicial que le corresponde por
  rol, sin cambios respecto a antes de este cambio

#### Scenario: El login sigue rechazando credenciales incorrectas

- **WHEN** una persona introduce credenciales inválidas
- **THEN** se muestra el mensaje de credenciales incorrectas y el formulario permanece
  disponible

#### Scenario: El login renderiza sin conexión

- **WHEN** el panel se abre sin conexión de red con la aplicación ya instalada
- **THEN** la pantalla de login se renderiza completa, incluido el eslogan, y el formulario
  de acceso sigue visible
