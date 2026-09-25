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
The system SHALL provide Brush components rendering a soft red ink wash anchored to a viewport corner, painted on a `position: fixed; inset: 0` element with `pointer-events: none`, `user-select: none` and `mix-blend-mode: multiply`.

Each wash SHALL be built from layered CSS `radial-gradient` stops rather than clipped SVG geometry, and each gradient SHALL reach zero alpha before the opposite edge of the viewport so that no clip is ever visible.

#### Scenario: Top-right brush renders
- **WHEN** <Brush position="tr" /> is rendered
- **THEN** the wash originates at the top-right corner of the viewport, its densest stop does not exceed 30% red alpha, and it reaches full transparency before reaching the left or bottom edge

#### Scenario: Bottom-left brush renders
- **WHEN** <Brush position="bl" /> is rendered
- **THEN** the wash originates at the bottom-left corner of the viewport, its densest stop does not exceed 34% red alpha, and it reaches full transparency before reaching the right or top edge

#### Scenario: No visible edge at any boundary
- **WHEN** a brush is rendered at any viewport size
- **THEN** the viewport edge, the hero's `overflow: hidden` boundary and the gradient box edge all fall outside the painted area, so no straight or clipped edge is perceptible

#### Scenario: Irregular non-elliptical silhouette
- **WHEN** a brush is rendered
- **THEN** each variant layers at least two gradients with differing centres so the result reads as an irregular stain rather than a single symmetric ellipse

#### Scenario: Narrow viewports keep the centre clear
- **WHEN** the viewport is 767px wide or narrower and both brushes render
- **THEN** the gradient radii contract so the two washes do not overlap behind the headline lockup or the call to action

#### Scenario: Brushes never print
- **WHEN** the registration document is printed
- **THEN** brush layers are not rendered

#### Scenario: Brushes remain legible over text
- **WHEN** a brush overlaps body copy, the headline lockup, or the header
- **THEN** the underlying text retains at least 4.5:1 contrast, which caps the top-right densest stop at 30% red alpha

#### Scenario: Designer watercolor assets are an optional upgrade
- **WHEN** designer-provided transparent watercolor PNG/WebP assets are delivered
- **THEN** they may replace the gradient layers, but the CSS wash is the shipped default and is not a temporary fallback

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
