# Spec Delta

## Purpose

Provides the decorative components that define the event's visual identity: the ≠ symbol (isotipo), watercolor brushes, organic lines, dotted connector, and map pin.

## ADDED Requirements

### Requirement: ≠ symbol component (MarkNeq)
The system SHALL provide a MarkNeq component rendering the red brush ≠ symbol as an SVG/PNG image.

#### Scenario: MarkNeq renders at default size
- **WHEN** <MarkNeq /> is rendered
- **THEN** it displays as inline-block with clamp(48px, 8vw, 96px) size, aspect-ratio 1, background SVG centered/contain

#### Scenario: Hero ≠ overlay (hero__neq)
- **WHEN** .hero__neq class is applied
- **THEN** it positions absolute at center (inset: 50% auto auto 50%, transform: translate(-50%, -50%)), width clamp(200px, 40%, 520px), mix-blend-mode: multiply, pointer-events: none

#### Scenario: Favicon ≠ symbol
- **WHEN** favicon is requested
- **THEN** it serves ≠ red on white circle

### Requirement: Watercolor brush components (Brush)
The system SHALL provide Brush components for large red watercolor stains positioned at viewport edges.

#### Scenario: Top-right brush renders
- **WHEN** <Brush position="tr" /> is rendered
- **THEN** it positions absolute top: -4%, right: -6%, width clamp(160px, 22vw, 340px), rotated 8deg, pointer-events: none, z-index: 0

#### Scenario: Bottom-left brush renders
- **WHEN** <Brush position="bl" /> is rendered
- **THEN** it positions absolute bottom: -6%, left: -5%, width clamp(180px, 24vw, 380px), rotated -12deg, pointer-events: none, z-index: 0

#### Scenario: Brushes use transparent PNG/WebP assets
- **WHEN** brush components render
- **THEN** they use designer-provided transparent assets (2-3 variants), never over legible text

### Requirement: Organic lines component (OrganicLines)
The system SHALL provide OrganicLines component rendering thin black SVG curves (1-2px stroke, no fill).

#### Scenario: Organic lines render as SVG
- **WHEN** <OrganicLines /> is rendered
- **THEN** it outputs SVG with stroke: var(--color-ink), fill: none, stroke-width: 1.5

### Requirement: Dotted connector utility (.dotted-connector)
The system SHALL provide a .dotted-connector CSS utility for L-shaped dotted lines connecting elements.

#### Scenario: Dotted connector renders
- **WHEN** .dotted-connector is applied
- **THEN** it shows border-left: 4px dotted var(--color-ink) and border-bottom: 4px dotted var(--color-ink)

### Requirement: Map pin component (MapPin)
The system SHALL provide a MapPin component for the location map pin (white circle with ≠ inside).

#### Scenario: Map pin renders correctly
- **WHEN** <MapPin /> is rendered
- **THEN** it displays as clamp(40px, 6vw, 88px) circle, white background, centered ≠ symbol, box-shadow 0 2px 8px rgba(0,0,0,.25)

#### Scenario: Map pin integrates with map
- **WHEN** map pin is placed on map
- **THEN** it connects via dotted connector to info block, map paths use var(--color-ink) fill with var(--color-white) stroke

## MODIFIED Requirements

### Requirement: Existing panel decorative elements
**FROM**: Panel has no decorative event branding
**TO**: Panel uses ≠ symbol, brushes, organic lines on key screens

#### Scenario: Panel login shows ≠ watermark
- **WHEN** user visits panel login
- **THEN** ≠ symbol appears as subtle watermark/decoration

### Requirement: Existing registro decorative elements
**FROM**: Registro has no decorative event branding
**TO**: Registro uses ≠ symbol, brushes on hero and confirmation screens

#### Scenario: Registro hero shows stacked headlines with ≠ overlay
- **WHEN** user visits registration welcome screen
- **THEN** hero displays stacked "MUY PRONTO" with .hero__neq overlay, brushes in corners