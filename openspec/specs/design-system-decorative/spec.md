# design-system-decorative Specification

## Purpose
Provides the decorative components that define the event's visual identity: the ≠ symbol (isotipo), watercolor brushes, organic lines, dotted connector, and map pin.

## Requirements

### Requirement: ≠ symbol component (MarkNeq) for compact chrome
The system SHALL provide a MarkNeq component rendering the red brush ≠ symbol as an inline SVG with a square aspect ratio and caller-controlled dimensions.

MarkNeq remains the ≠ symbol for compact chrome placements such as the panel header, and it SHALL remain the fallback when no final artwork has been delivered for a specific placement. It SHALL NOT be the symbol used by the registration welcome screen: that screen SHALL render the SloganLockup, which carries the slogan and the symbol together.

#### Scenario: MarkNeq honors rendered dimensions
- **WHEN** <MarkNeq /> is rendered with default, class, or style sizing
- **THEN** it preserves its 1:1 viewBox and renders at the dimensions provided by the caller without adding implicit full-width flow

#### Scenario: Panel header keeps the compact ≠
- **WHEN** the panel header renders
- **THEN** the symbol is rendered by MarkNeq at a compact fixed size, sized by the caller, and hidden from assistive technology

#### Scenario: Welcome screen no longer uses a separate symbol
- **WHEN** the registration welcome screen renders
- **THEN** the slogan and the ≠ symbol are rendered together by a single SloganLockup, and no separate MarkNeq is rendered alongside it

#### Scenario: Favicon ≠ symbol
- **WHEN** a browser or platform requests the favicon
- **THEN** it serves the delivered ≠ mark in red on transparency, from a size-complete icon set rather than from a single oversized bitmap

### Requirement: Size-complete favicon set
Both applications SHALL serve the delivered favicon set covering every size a browser tab,
an iOS home screen and an Android install actually request, and SHALL NOT ship a single
oversized bitmap as the only icon.

The set SHALL include a multi-size `.ico` for legacy browsers, explicit PNG icons at 16, 32
and 48 px, a 180 px apple-touch icon, 192 and 512 px Android icons, and a 512 px maskable
icon whose glyph keeps its content inside the safe zone Android applies when it crops a
launcher icon to a circle. The mark is red ink on transparency, so the icons that platforms
composite over an unknown background SHALL carry their own opaque background.

The applications SHALL NOT declare a scalable icon that would take preference over the
delivered bitmaps, and the PWA manifest SHALL reference the same PNG sizes the head declares
so the installed app and the browser tab show the same mark.

#### Scenario: Every requested icon decodes at its declared size
- **WHEN** each declared icon is fetched from either application
- **THEN** it returns 200 with an image content type and decodes at exactly the size it declares, and the `.ico` exposes its 16, 32 and 48 px entries

#### Scenario: Maskable icon survives Android's circular crop
- **WHEN** the maskable icon is measured
- **THEN** its glyph occupies no more than roughly 60% of the canvas, leaving at least a 10% margin per side so Android's circular and squircle masks do not clip the ≠

#### Scenario: Tab icon does not dominate the precache budget
- **WHEN** the PWA precache manifest is measured
- **THEN** the favicon assets add well under 250 KB in total, and a tab icon is not shipped as an uncompressed full-size bitmap

### Requirement: Slogan lockup component (SloganLockup)
The system SHALL provide a SloganLockup component that renders the event's final slogan
artwork ("Atrévete a ser diferente") together with the ≠ symbol as a single image, sourced
from the design system's own assets rather than from either application's public directory.

The artwork SHALL have a real alpha channel so the slogan composites over the paper
background, the radial glow and the paper noise without a white box or a texture seam. The
component SHALL NOT require a blend mode to remove a background, because the delivered asset
has none.

The component SHALL expose the slogan as the image's accessible name, SHALL declare the
image's intrinsic dimensions so layout is reserved before the bitmap loads, and SHALL NOT be
taller than the hero budget allows at short viewports.

The asset SHALL be light-only by construction, like the badge: the slogan artwork is ink on
transparency and does not survive a dark background. The system SHALL NOT claim dark mode
support for it.

#### Scenario: Lockup renders over the paper background
- **WHEN** SloganLockup renders on the registration welcome screen or the panel login
- **THEN** the slogan and the ≠ symbol are visible over the paper color, the radial glow and the paper noise, with no rectangular edge and no interruption of the noise texture around the artwork

#### Scenario: Lockup exposes the slogan as its accessible name
- **WHEN** a screen reader reaches the lockup
- **THEN** it announces "Atrévete a ser diferente" once, and the ≠ symbol is not announced separately because the name already carries the full phrase

#### Scenario: Lockup does not shift layout while loading
- **WHEN** the page renders before the lockup bitmap finishes downloading
- **THEN** the space the lockup will occupy is already reserved at its intrinsic aspect ratio, and the content below it does not move when the image loads

#### Scenario: Lockup stays inside the hero budget on short viewports
- **WHEN** the registration welcome screen renders at 1366×768 and at 1280×800
- **THEN** the hero, the lockup and the primary call to action all fit above the fold without scrolling

#### Scenario: Dark mode is not offered for the lockup
- **WHEN** the system documents the lockup's capabilities
- **THEN** it is recorded as light-only, with the reason that the ink artwork is not legible on a dark background

### Requirement: Lockup asset ownership and delivery
The system SHALL keep exactly one copy of the slogan artwork in the design system package and
SHALL reference it from code, so that neither application carries its own duplicate and no
asset URL is hardcoded in application source.

The delivered asset SHALL be a WebP of no more than 1664px wide derived from the designer's
4989×2000 PNG, so that the full asset stays under 100 KB and covers a 768px hero at device
pixel ratio 2. This trades sharpness for a 768px hero at device pixel ratio 3, which SHALL be
recorded as an accepted trade-off rather than silently inherited.

The application, when it is a PWA, SHALL include the lockup in its precache so the login
screen does not depend on network availability.

#### Scenario: Single asset copy
- **WHEN** both applications are built
- **THEN** the lockup bitmap is emitted by the build pipeline from the design system's assets directory, and no application directory contains its own copy of the file

#### Scenario: Asset is under the size budget
- **WHEN** the lockup asset is measured
- **THEN** it is a WebP of at most 1664px wide and under 100 KB, down from the 1570 KB of the source PNG

#### Scenario: Login works without network
- **WHEN** the panel PWA loads its login screen while offline
- **THEN** the lockup is served from the precache and renders without a network request

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
