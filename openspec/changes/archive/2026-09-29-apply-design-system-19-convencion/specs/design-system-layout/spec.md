# Spec Delta

## Purpose

Provides layout primitives (Container, Section, Hero, InfoBlock, Split) and responsive breakpoints implementing the 16:9 hero proportion, right-aligned info blocks, and editorial composition rules.

## ADDED Requirements

### Requirement: Container utility (.container)
The system SHALL provide a .container utility for max-width centered content with responsive gutters in every application.

#### Scenario: Container constrains content width
- **WHEN** .container is applied
- **THEN** width is min(100% - var(--gutter)*2, var(--container)) with margin-inline: auto, where --container=1200px, --gutter=clamp(1rem, 4vw, 3rem)

#### Scenario: Applications preserve responsive gutters
- **WHEN** panel or registration content is rendered inside .container
- **THEN** content keeps at least one --gutter of space on each side and remains centered

### Requirement: Section utility (.section)
The system SHALL provide a .section utility for consistent vertical padding and positioning context, with compact spacing on mobile viewports.

#### Scenario: Section provides consistent spacing
- **WHEN** .section is applied
- **THEN** it has padding-block: var(--space-6) (7rem) at 768px and above, padding-block: var(--space-3) below 768px, position: relative, overflow: hidden

### Requirement: Hero component (Hero)
The system SHALL provide a Hero component that fills the viewport on larger screens and sizes to its content on mobile while respecting the 16:9 proportion on desktop.

#### Scenario: Hero fills viewport height on larger screens
- **WHEN** <Hero /> renders at 768px or wider
- **THEN** it has min-height: 100svh, display: grid, place-items: center, position: relative, overflow: hidden

#### Scenario: Hero sizes to content on mobile
- **WHEN** <Hero /> renders below 768px
- **THEN** it uses min-height: auto so the surrounding application shell controls viewport height

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

### Requirement: Responsive application navigation
The system SHALL keep primary application navigation visible at all viewport sizes, adapting its placement and orientation to the available space.

#### Scenario: Desktop sidebar navigation
- **WHEN** an authenticated panel user views the application at 768px or wider
- **THEN** navigation is displayed as a vertical sidebar that remains visible beside the content

#### Scenario: Mobile bottom navigation
- **WHEN** an authenticated panel user views the application below 768px
- **THEN** navigation is displayed as a horizontal bar fixed to the bottom, remains above content, and respects the device bottom safe area

### Requirement: Fixed viewport content shell
The system SHALL allow mobile application content to scroll independently from the surrounding page chrome when content exceeds the viewport.

#### Scenario: Registration content scrolls inside the shell
- **WHEN** the registration wizard is used below 768px
- **THEN** the document itself does not scroll, the header and footer remain fixed, and only the main content area scrolls when needed

#### Scenario: Mobile shell respects device insets and printing
- **WHEN** the viewport includes a safe area or the page is printed
- **THEN** the shell applies top and bottom safe-area spacing, and printing restores normal document flow without clipping content

### Requirement: Breakpoints
The system SHALL define responsive breakpoints at 480px, 768px, 1024px, 1280px.

#### Scenario: Breakpoints available in CSS
- **WHEN** media queries use design system breakpoints
- **THEN** they match 480/768/1024/1280px
