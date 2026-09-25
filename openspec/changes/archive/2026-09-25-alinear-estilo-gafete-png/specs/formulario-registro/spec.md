# Spec Delta

## ADDED Requirements

### Requirement: Identidad visual del gafete PNG

El gafete que el sistema genera como imagen PNG SHALL seguir el sistema de diseño de la
Convención Juvenil 2026 en lugar de composición de una paleta propia. El sistema SHALL
derivar colores, tipografía y grosores de borde de los tokens del proyecto en tiempo de
ejecución, SHALL usar fondo `--color-paper-light`, marco de 2 px en `--color-ink` con
radio 0, y SHALL posicionar la información en el orden convención, regla de acento,
nombre del participante, código QR, `participantId`.

El código QR SHALL conservar su presupuesto de contraste completo: los módulos SHALL
usar `--color-ink` sobre `--color-paper-light`, SHALL mantener la zona de silencio de 4
módulos exigida por la especificación, SHALL NOT llevar logo embebido, SHALL NOT llevar
marco ni borde propios, y el sistema SHALL NOT usar `--color-red` ni ningún otro color de
contraste reducido para los módulos, porque el gafete se escanea con la cámara del
teléfono y también se imprime.

El sistema SHALL componer el gafete en una resolución de exportación que lo haga
imprimible a 300 DPI y SHALL NOT escalar hacia arriba el bitmap del QR al componerlo.
Las familias y los pesos tipográficos usados SHALL corresponder a los que la carga de
fuentes del proyecto realmente provee, y el sistema SHALL solicitar explícitamente su
descarga antes de dibujar, de modo que el gafete no se genere con la pila de fuentes del
sistema por defecto. Si la descarga de fuentes falla, el sistema SHALL degradar a la pila
del sistema y SHALL continuar generando el gafete.

#### Scenario: Gafete generado tras completar el registro

- **WHEN** el sistema genera el gafete PNG
- **THEN** el fondo es `--color-paper-light` y el artefacto lleva un marco de 2 px en `--color-ink` con esquinas rectas
- **AND** el nombre de la convención se dibuja en la tipografía display en peso 800, en mayúsculas y en `--color-ink`
- **AND** una regla horizontal de 2 px en `--color-red` separa el nombre de la convención del nombre del participante
- **AND** el nombre del participante se dibuja en la tipografía display en peso 700, en mayúsculas y en `--color-ink`
- **AND** el `participantId` se dibuja en tipografía monoespaciada en peso 400 sobre `--color-ink-fade`

#### Scenario: Lectura del QR con la cámara del teléfono

- **WHEN** el staff escanea el gafete en la puerta con la aplicación de check-in
- **THEN** los módulos del QR se leen con el contraste de `--color-ink` sobre `--color-paper-light`
- **AND** el QR mantiene su zona de silencio de 4 módulos, sin logo, marco ni borde que la reduzcan
- **AND** el `codigoQr` codificado es el mismo que antes del cambio, de modo que los gafetes ya compartidos siguen siendo válidos

#### Scenario: Impresión del gafete

- **WHEN** el staff imprime el gafete a 300 DPI
- **THEN** la imagen exportada tiene resolución suficiente para que el nombre y el `participantId` se lean sin verse suavizados
- **AND** el texto se rasteriza a la resolución de exportación y no se escala desde una imagen de menor resolución

#### Scenario: Falla de descarga de las tipografías

- **WHEN** la descarga de las tipografías del proyecto falla al momento de generar el gafete
- **THEN** el sistema dibuja el gafete con la pila de fuentes del sistema
- **AND** el gafete se genera y se comparte o descarga igual, sin quedar bloqueado

#### Scenario: Vista del QR en la pantalla de confirmación

- **WHEN** el participante ve la pantalla de confirmación en el navegador
- **THEN** el QR se dibuja con `--color-ink` sobre `--color-paper-light`, sin costura de fondo blanco dentro de la card que lo contiene
