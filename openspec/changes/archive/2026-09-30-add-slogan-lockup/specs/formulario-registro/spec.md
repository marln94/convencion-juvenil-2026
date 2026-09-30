# Spec Delta

## ADDED Requirements

### Requirement: Pantalla de bienvenida con el eslogan de la convención
La pantalla de bienvenida del formulario SHALL mostrar el eslogan de la Convención Juvenil
("Atrévete a ser diferente") junto con el símbolo ≠ como una sola pieza gráfica, y SHALL
exponer ese eslogan como nombre accesible de la imagen.

La pantalla SHALL NOT mostrar el texto provisional "MUY PRONTO" ni un símbolo ≠ separado del
eslogan. El eslogan SHALL componerse sobre el fondo de papel, de modo que no se perciba
ninguna caja rectangular alrededor del arte ni una interrupción de la textura.

La pantalla SHALL mantener el llamado a la acción "Comenzar inscripción" como su acción
principal y SHALL seguir iniciando el asistente de inscripción.

Como la pantalla muestra una sola acción, su contenido SHALL quedar centrado horizontal y
verticalmente en el espacio que deja el header, y no pegado al techo con el resto del
viewport vacío debajo. El centrado SHALL funcionar en móvil, donde antes el eslogan quedaba
demasiado arriba. Este centrado SHALL NOT aplicarse a los pasos del asistente: el formulario
debe seguir empezando en su parte superior y desplazándose con normalidad.

Cuando el contenido no cabe en el viewport, el sistema SHALL anclarlo arriba y SHALL mantener
lo que no cabe alcanzable por desplazamiento, en vez de recortarlo por arriba.

#### Scenario: La bienvenida muestra el eslogan

- **WHEN** una persona abre el formulario público sin haber iniciado el asistente
- **THEN** ve el eslogan "Atrévete a ser diferente" con el símbolo ≠ integrado, sin el texto
  "MUY PRONTO" ni un símbolo ≠ aislado debajo

#### Scenario: El eslogan se lee sin ver

- **WHEN** una persona navega la pantalla de bienvenida con un lector de pantalla
- **THEN** el eslogan se anuncia una sola vez como "Atrévete a ser diferente" y el símbolo ≠
  no se anuncia por separado

#### Scenario: El eslogan se apoya sobre el papel

- **WHEN** la pantalla de bienvenida se renderiza
- **THEN** el eslogan se compone sobre el color de papel, el brillo radial y la textura de
  papel, sin un borde rectangular visible ni una costura de ruido alrededor del arte

#### Scenario: La bienvenida completa arranca el asistente

- **WHEN** la persona pulsa "Comenzar inscripción"
- **THEN** el asistente avanza al primer paso de captura de datos, igual que antes de este
  cambio

#### Scenario: La bienvenida no desborda en pantallas bajas

- **WHEN** la pantalla de bienvenida se renderiza en 1366×768 y en 1280×800
- **THEN** el eslogan, los pincelados y el botón "Comenzar inscripción" quedan dentro del
  viewport sin desplazamiento

#### Scenario: La bienvenida se centra en ambos ejes

- **WHEN** la pantalla de bienvenida se renderiza en un viewport con espacio vertical de sobra,
  en móvil y en escritorio
- **THEN** el espacio entre el borde superior del área útil y el eslogan es igual al espacio
  entre el botón y el borde inferior, y el eslogan queda centrado en el eje horizontal

#### Scenario: El centrado no afecta a los pasos del asistente

- **WHEN** una persona pulsa "Comenzar inscripción" y el asistente avanza al primer paso
- **THEN** el formulario de ese paso y los siguientes empiezan en su parte superior, sin
  centrarse verticalmente, y conservan su desplazamiento normal

#### Scenario: Un viewport más bajo que el contenido no recorta

- **WHEN** la pantalla de bienvenida se renderiza en un viewport tan bajo que el eslogan y el
  botón no caben
- **THEN** el contenido se ancla arriba, no se recorta por arriba, y sigue siendo alcanzable
  desplazándose
