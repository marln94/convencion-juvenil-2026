# Spec Delta

## Purpose

Provides layout primitives (Container, Section, Hero, InfoBlock, Split) and responsive breakpoints implementing the 16:9 hero proportion, right-aligned info blocks, and editorial composition rules.

## ADDED Requirements

### Requirement: Container utility (.container)
The system SHALL provide a .container utility for max-width centered content with responsive gutters.

#### Scenario: Container constrains content width
- **WHEN** .container is applied
- **THEN** width is min(100% - var(--gutter)*2, var(--container)) with margin-inline: auto, where --container=1200px, --gutter=clamp(1rem, 4vw, 3rem)

### Requirement: Section utility (.section)
The system SHALL provide a .section utility for consistent vertical padding and positioning context.

#### Scenario: Section provides consistent spacing
- **WHEN** .section is applied
- **THEN** it has padding-block: var(--space-6) (7rem), position: relative, overflow: hidden

### Requirement: Hero component (Hero)
The system SHALL provide a Hero component for full-viewport hero sections respecting 16:9 proportion on desktop.

#### Scenario: Hero fills viewport height
- **WHEN** <Hero /> renders
- **THEN** it has min-height: 100svh, display: grid, place-items: center, position: relative, overflow: hidden

#### Scenario: Hero maintains 16:9 on desktop
- **WHEN** viewport width >= 1024px
- **THEN** hero content area respects 16:9 aspect ratio

### Requirement: InfoBlock component (InfoBlock)
The system SHALL provide an InfoBlock component for right-aligned desktop content (editorial style from Art 2).

#### Scenario: InfoBlock aligns right on desktop
- **WHEN** <InfoBlock /> renders on desktop (>=768px)
- **THEN** it has text-align: right, display: grid, justify-items: end, gap: 0.25rem

#### Scenario: InfoBlock aligns left on mobile
- **WHEN** <InfoBlock /> renders on mobile (<768px)
- **THEN** it has text-align: left, justify-items: start

#### Scenario: InfoBlock typography hierarchy
- **WHEN** InfoBlock contains event info
- **THEN** it renders in order: .t-eyebrow (19 Convención...), .t-solid --fs-hero (UPNFM), .t-outline --fs-h1 (DANLÍ, EL PARAÍSO), .t-date (24 - 27 DICIEMBRE)

### Requirement: Split layout utility (.split)
The system SHALL provide a .split utility for two-column layouts (map left, info right) that stack on mobile.

#### Scenario: Split shows two columns on desktop
- **WHEN** .split renders on desktop (>=768px)
- **THEN** it displays grid with two columns (map ~50%, info ~50%)

#### Scenario: Split stacks on mobile
- **WHEN** .split renders on mobile (<768px)
- **THEN** it stacks to single column

### Requirement: Breakpoints
The system SHALL define responsive breakpoints at 480px, 768px, 1024px, 1280px.

#### Scenario: Breakpoints available in CSS
- **WHEN** media queries use design system breakpoints
- **THEN** they match 480/768/1024/1280px

## MODIFIED Requirements

### Requirement: Existing panel page layout
**FROM**: Panel uses default Tailwind spacing and container patterns
**TO**: Panel uses design system layout primitives

#### Scenario: Panel vistas use design layout
- **WHEN** panel renders dashboard, pagos, equipos, checkin, registro-insitu
- **THEN** content wrapped in .container, sections use .section, consistent spacing

### Requirement: Existing registro page layout
**FROM**: Registro uses max-w-2xl centered container with default spacing
**TO**: Registro uses design system layout primitives with hero, info-block, split patterns

#### Scenario: Registro wizard uses design layout
- **WHEN** user views registration steps
- **THEN** welcome screen uses <Hero>, steps use .container/.section, confirmation uses centered card

#### Scenario: Registro hero follows 16:9 proportion
- **WHEN** user visits welcome screen on desktop
- **THEN** hero area respects 16:9 aspect ratio with stacked headlines and ≠ overlay