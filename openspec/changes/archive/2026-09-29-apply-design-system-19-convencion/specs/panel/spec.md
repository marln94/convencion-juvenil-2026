# Spec Delta

## MODIFIED Requirements

### Requirement: Diseño mobile-first

El sistema SHALL funcionar correctamente en teléfonos y tablets (orientación vertical y horizontal), con controles táctiles grandes, sin desplazamiento horizontal y con navegación principal siempre visible. En viewports de 768px o más SHALL presentar la navegación en una barra lateral vertical; por debajo de 768px SHALL presentarla como una barra horizontal fija en la parte inferior, respetando el safe area del dispositivo. El sistema SHALL seguir siendo usable desde un laptop en la mesa de check-in.

#### Scenario: Check-in desde un teléfono

- **WHEN** el staff usa la app desde un teléfono
- **THEN** la vista de check-in se ve y opera a pantalla completa, la navegación inferior permanece visible y los controles de toque son grandes

#### Scenario: Navegación lateral en tablet o laptop

- **WHEN** un usuario autenticado usa la app en un viewport de 768px o más
- **THEN** la navegación aparece como una barra lateral vertical junto al contenido y la vista activa se distingue visualmente

#### Scenario: Safe area de la navegación móvil

- **WHEN** el dispositivo tiene un inset de seguridad en la parte inferior
- **THEN** la navegación móvil respeta ese inset y el contenido principal reserva el espacio necesario para no quedar oculto

#### Scenario: Uso desde un laptop

- **WHEN** el staff usa la app desde un laptop en la mesa de check-in
- **THEN** las vistas mantienen un layout legible sin romperse
