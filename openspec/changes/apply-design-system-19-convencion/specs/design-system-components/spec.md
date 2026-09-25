# Spec Delta

## Purpose

Provides the redesigned primitive UI components (Button, Input, Select, Card, Alert, Pill, Nav, StepIndicator) with sharp corners, uppercase labels, black/red palette, and editorial aesthetic.

## ADDED Requirements

### Requirement: Button component (Button)
The system SHALL provide a Button component with sharp corners (--radius: 0), uppercase text, bold weight, 2px borders, and two variants.

#### Scenario: Primary button renders
- **WHEN** <Button variant="primary" /> renders
- **THEN** it has background var(--color-red), white text, 2px transparent border, hover background var(--color-red-dark), transform translateY(-2px), focus-visible 3px solid var(--color-red) outline

#### Scenario: Outline button renders
- **WHEN** <Button variant="outline" /> renders
- **THEN** it has transparent background, var(--color-ink) text, 2px solid var(--color-ink) border, hover background var(--color-ink) with var(--color-paper) text

#### Scenario: Button uses design typography
- **WHEN** any button renders
- **THEN** it uses --font-display, weight 700, uppercase, letter-spacing 0.06em, padding 0.9rem 1.8rem

### Requirement: Input component (Input)
The system SHALL provide an Input component with sharp corners, black borders, red focus ring, and uppercase labels.

#### Scenario: Input renders with design styling
- **WHEN** <Input /> renders
- **THEN** it has min-height 44px, sharp corners, 2px solid var(--color-ink) border, var(--color-text) text, focus ring 3px solid var(--color-red), label uppercase --font-display weight 600

#### Scenario: Input error state
- **WHEN** input has error
- **THEN** border becomes var(--color-red), focus ring var(--color-red), error message in var(--color-red)

### Requirement: Select component (Select)
The system SHALL provide a Select component matching Input styling.

#### Scenario: Select renders with design styling
- **WHEN** <Select /> renders
- **THEN** it matches Input styling: sharp corners, black border, red focus, uppercase label

### Requirement: Card component (Card)
The system SHALL provide a Card component with sharp corners, 2px black border, paper-light background.

#### Scenario: Card renders with design styling
- **WHEN** <Card /> renders
- **THEN** it has background var(--color-paper-light), 2px solid var(--color-ink) border, sharp corners, padding var(--space-3)

#### Scenario: Card tag accent
- **WHEN** card has .card__tag element
- **THEN** it uses var(--color-red), weight 700, uppercase

### Requirement: Alert component (Alert)
The system SHALL provide an Alert component with sharp corners, black border, paper background, red accent for errors.

#### Scenario: Alert renders with design styling
- **WHEN** <Alert type="error" /> renders
- **THEN** it has sharp corners, 2px solid var(--color-ink) border, background var(--color-paper), text var(--color-text), red accent border-left

#### Scenario: Alert success/info variants
- **WHEN** <Alert type="success|info|warning" /> renders
- **THEN** variants use appropriate accent colors but maintain sharp corners and paper background

### Requirement: Pill/Badge component (Pill)
The system SHALL provide a Pill component with sharp corners, uppercase, tracking-wide, black/red variants.

#### Scenario: Pill renders with design styling
- **WHEN** <Pill variant="default|red|green|amber" /> renders
- **THEN** it has sharp corners, padding 0.75rem 1rem, uppercase, letter-spacing 0.08em, weight 700, size 0.75rem

### Requirement: Navigation component (Nav)
The system SHALL provide a Nav component with transparent/paper background, uppercase Poppins 600 links, red brush-stroke underline on hover/active.

#### Scenario: Nav renders with design styling
- **WHEN** <Nav /> renders
- **THEN** links use --font-display weight 600, uppercase, letter-spacing 0.08em, color var(--color-ink)

#### Scenario: Nav active/hover underline
- **WHEN** nav link is hovered or active
- **THEN** it shows 3px high red underline (var(--color-red)) animated width 0→100% over 250ms

### Requirement: Step indicator component (StepIndicator)
The system SHALL provide a StepIndicator with black track, red progress, numbered circles.

#### Scenario: Step indicator renders with design styling
- **WHEN** <StepIndicator current={2} total={5} /> renders
- **THEN** track is var(--color-ink) at 1px height, progress is var(--color-red), circles are numbered with var(--color-ink) border, active filled var(--color-red)

## MODIFIED Requirements

### Requirement: Existing panel UI components
**FROM**: Panel uses rounded indigo/slate buttons, inputs, cards, nav with indigo accents
**TO**: Panel uses design system components with sharp corners, black/red palette

#### Scenario: Panel login uses design components
- **WHEN** user views login screen
- **THEN** form uses design Input, Button (primary), Card container

#### Scenario: Panel header/nav uses design components
- **WHEN** user views any authenticated panel screen
- **THEN** header uses design Nav, connection indicator uses design Pill

#### Scenario: Panel vistas use design components
- **WHEN** user views dashboard, pagos, equipos, checkin, registro-insitu
- **THEN** tables/cards use design Card, actions use design Button, status use design Pill

### Requirement: Existing registro UI components
**FROM**: Registro uses rounded indigo/slate buttons, inputs, cards, step indicator with indigo accents
**TO**: Registro uses design system components with sharp corners, black/red palette

#### Scenario: Registro wizard uses design components
- **WHEN** user completes registration steps
- **THEN** form uses design Input, Select, CheckboxGroup, Button, StepIndicator, Card, Alert

#### Scenario: Registro confirmation uses design components
- **WHEN** user completes registration
- **THEN** confirmation card uses design Card, QR display, design Button for share/download