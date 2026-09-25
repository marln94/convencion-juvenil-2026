# Spec Delta

## Purpose

Provides the foundational design tokens (colors, typography, spacing, sizing) as CSS custom properties that all other design system capabilities consume.

## ADDED Requirements

### Requirement: Color palette tokens
The system SHALL expose CSS custom properties for the complete event color palette including paper backgrounds, ink texts, red accents, and semantic aliases.

#### Scenario: Color tokens available in CSS
- **WHEN** a stylesheet imports the design tokens
- **THEN** the following custom properties are defined: --color-paper, --color-paper-light, --color-white, --color-ink, --color-ink-soft, --color-ink-fade, --color-red, --color-red-dark, --color-red-deep, --color-bg, --color-text, --color-accent, --color-border

#### Scenario: Dark mode color override
- **WHEN** .theme-dark class is applied to a container
- **THEN** --color-bg becomes #0A0A0A, --color-text becomes #EDEDED, --color-border becomes #FFFFFF

### Requirement: Typography tokens
The system SHALL expose CSS custom properties for font families and fluid type scale matching the design guide.

#### Scenario: Font family tokens available
- **WHEN** a stylesheet imports the design tokens
- **THEN** the following custom properties are defined: --font-display, --font-fine, --font-script, --font-body

#### Scenario: Fluid type scale tokens available
- **WHEN** a stylesheet imports the design tokens
- **THEN** the following custom properties are defined: --fs-hero, --fs-h1, --fs-h2, --fs-h3, --fs-date, --fs-eyebrow, --fs-body, --fs-small with clamp() values matching the guide

### Requirement: Spacing and layout tokens
The system SHALL expose CSS custom properties for container width, gutter, spacing scale, and border radius.

#### Scenario: Layout tokens available
- **WHEN** a stylesheet imports the design tokens
- **THEN** the following custom properties are defined: --container, --gutter, --space-1 through --space-6, --radius (set to 0 for sharp corners)

### Requirement: Google Fonts loading
The system SHALL load Poppins (400,500,700,800), Poiret One, and Sacramento from Google Fonts with preconnect hints.

#### Scenario: Fonts load correctly
- **WHEN** the app loads in a browser
- **THEN** the three font families are available for use in CSS without layout shift

## MODIFIED Requirements

### Requirement: Existing panel capability visual layer
**FROM**: Panel uses default Tailwind indigo/slate theme with rounded components
**TO**: Panel uses design system tokens for all visual styling

#### Scenario: Panel consumes design tokens
- **WHEN** panel app styles are applied
- **THEN** all colors, typography, spacing come from design system tokens

### Requirement: Existing registro capability visual layer
**FROM**: Registro uses default Tailwind indigo/slate theme with rounded components
**TO**: Registro uses design system tokens for all visual styling

#### Scenario: Registro consumes design tokens
- **WHEN** registro app styles are applied
- **THEN** all colors, typography, spacing come from design system tokens