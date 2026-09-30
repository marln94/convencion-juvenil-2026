# Spec Delta

## ADDED Requirements

## REMOVED Requirements

### Requirement: ≠ symbol component (MarkNeq)

Reason: this requirement bundled the component's contract with one of its placements, and
that placement no longer exists. The registration welcome screen used to render a standalone
decorative MarkNeq; it now renders the SloganLockup, which carries the slogan and the symbol
in one image. The scenario asserting a compact decorative ≠ in the registration hero is
therefore false and cannot be carried forward.

Migration: the component survives unchanged. Its contract is re-added below under
"≠ symbol component (MarkNeq) for compact chrome", which keeps every surviving scenario
(rendered dimensions, the panel header, the favicon) and drops only the registration-hero
claim. Callers of `<MarkNeq />` in the registration welcome screen move to `<SloganLockup />`;
the panel header keeps `<MarkNeq />` as-is.

This is also why the archived `apply-design-system-19-convencion` shipped MarkNeq with
provisional art (its task 12.2 stayed blocked on the designer's `neq-red.svg`): only the
header placement remains to be finalized, narrowing that work to a single compact use.

## ADDED Requirements

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
