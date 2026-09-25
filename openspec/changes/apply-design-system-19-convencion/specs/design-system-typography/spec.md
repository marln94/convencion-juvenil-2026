# Spec Delta

## Purpose

Provides reusable text style utilities and the stacked headline component that implements the editorial typography patterns from the design guide (solid, outline, fade, date, eyebrow, script styles).

## ADDED Requirements

### Requirement: Solid headline style (.t-solid)
The system SHALL provide a .t-solid utility class for solid black headlines (e.g., "MUY PRONTO", "UPNFM").

#### Scenario: Solid headline renders correctly
- **WHEN** .t-solid is applied to an element
- **THEN** it uses --font-display at --fs-hero size, weight 800, uppercase, letter-spacing 0.02em, line-height 0.95, color var(--color-ink)

### Requirement: Outline headline style (.t-outline)
The system SHALL provide a .t-outline utility class for outline-only headlines using -webkit-text-stroke.

#### Scenario: Outline headline renders correctly
- **WHEN** .t-outline is applied to an element
- **THEN** it uses --font-display at --fs-hero size, weight 600, uppercase, transparent fill, 2px stroke in var(--color-ink), paint-order stroke fill

#### Scenario: Outline fallback when text-stroke unsupported
- **WHEN** browser does not support -webkit-text-stroke
- **THEN** .t-outline falls back to solid var(--color-ink) text

### Requirement: Fade gradient text style (.t-fade)
The system SHALL provide a .t-fade utility class for gradient fade text effect (as seen on "PRONTO").

#### Scenario: Fade text renders correctly
- **WHEN** .t-fade is applied to an element
- **THEN** it uses linear-gradient(90deg, var(--color-ink) 0%, var(--color-ink-fade) 45%, var(--color-ink) 100%) with background-clip: text

### Requirement: Red date style (.t-date)
The system SHALL provide a .t-date utility class for red uppercase dates (e.g., "24 - 27 DICIEMBRE").

#### Scenario: Date text renders correctly
- **WHEN** .t-date is applied to an element
- **THEN** it uses --font-display at --fs-date size, weight 700, uppercase, letter-spacing 0.01em, color var(--color-red)

### Requirement: Fine eyebrow style (.t-eyebrow)
The system SHALL provide a .t-eyebrow utility class for fine labels using the --font-fine family.

#### Scenario: Eyebrow text renders correctly
- **WHEN** .t-eyebrow is applied to an element
- **THEN** it uses --font-fine at --fs-eyebrow size, letter-spacing 0.03em, color var(--color-ink)

### Requirement: Script accent style (.t-script)
The system SHALL provide a .t-script utility class for handwritten script accents (e.g., "Diferente").

#### Scenario: Script text renders correctly
- **WHEN** .t-script is applied to an element
- **THEN** it uses --font-script at clamp(1.5rem, 3vw, 2.5rem) size, color var(--color-ink)

### Requirement: Stacked headline component (.stack)
The system SHALL provide a .stack component for vertically stacking repeated headlines alternating solid/outline with tight line-height.

#### Scenario: Stacked headlines render with correct pattern
- **WHEN** .stack contains alternating .t-outline and .t-solid spans
- **THEN** they display as grid with line-height 0.9, each span as block

#### Scenario: Stacked headlines accessibility
- **WHEN** .stack is used for repeated headlines
- **THEN** container has aria-label with the text content, and duplicate spans have aria-hidden="true"
