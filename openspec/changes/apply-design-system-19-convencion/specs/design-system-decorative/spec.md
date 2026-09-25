# Spec Delta

## Purpose

Provides the decorative components that define the event's visual identity: the ≠ symbol (isotipo), watercolor brushes, organic lines, dotted connector, and map pin.

## ADDED Requirements

### Requirement: ≠ symbol component (MarkNeq)
The system SHALL provide a MarkNeq component rendering the red brush ≠ symbol as an inline SVG with a square aspect ratio and caller-controlled dimensions.

#### Scenario: MarkNeq honors rendered dimensions
- **WHEN** <MarkNeq /> is rendered with default, class, or style sizing
- **THEN** it preserves its 1:1 viewBox and renders at the dimensions provided by the caller without adding implicit full-width flow

#### Scenario: Registration hero uses a compact decorative ≠
- **WHEN** the registration welcome screen renders a decorative MarkNeq
- **THEN** the symbol is centered, constrained to a compact responsive size, and hidden from assistive technology

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
