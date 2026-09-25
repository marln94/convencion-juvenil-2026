# Spec Delta

## Purpose

Defines accessibility patterns and requirements for the design system components, ensuring WCAG compliance and inclusive experience.

## ADDED Requirements

### Requirement: Stacked headlines accessibility
The system SHALL ensure stacked headlines (.stack) are accessible to screen readers.

#### Scenario: Stacked headlines have aria-label
- **WHEN** .stack contains repeated headline spans
- **THEN** the container has aria-label with the text content once, and all duplicate spans have aria-hidden="true"

#### Scenario: Outline text is decorative only
- **WHEN** .t-outline is used
- **THEN** it is never the sole carrier of information; solid text equivalent exists with aria-hidden="false"

### Requirement: Decorative images marked as presentational
The system SHALL ensure all decorative graphics (brushes, organic lines, textures, ≠ when decorative) are hidden from assistive technology.

#### Scenario: Decorative images have empty alt or role=presentation
- **WHEN** decorative images/elements render
- **THEN** they have alt="" or role="presentation"

### Requirement: Map accessibility
The system SHALL provide accessible map component with text fallback.

#### Scenario: Map has accessible name and text fallback
- **WHEN** map component renders
- **THEN** it has <title>/aria-label describing the map, and the location name (Danlí, El Paraíso) is repeated in visible text

### Requirement: Semantic time elements
The system SHALL use <time> elements for event dates with datetime attributes.

#### Scenario: Dates use semantic time elements
- **WHEN** event dates display (24-27 December)
- **THEN** they use <time datetime="2026-12-24">24</time> – <time datetime="2026-12-27">27 diciembre</time>

### Requirement: Color contrast compliance
The system SHALL meet WCAG contrast ratios for all text and UI elements.

#### Scenario: Text meets contrast requirements
- **WHEN** text renders on paper background
- **THEN** black (#0A0A0A) on paper (#EDEDED) achieves ~17:1 (AAA); red (#D90D0D) on paper achieves ~4.5:1 (valid for large text ≥24px or ≥19px bold and UI elements)

#### Scenario: Red not used for body text
- **WHEN** body text renders
- **THEN** it uses var(--color-ink) or var(--color-ink-soft), never var(--color-red)

#### Scenario: Button contrast meets requirements
- **WHEN** buttons render
- **THEN** white on red (#D90D0D) achieves ~5:1; white on black achieves ~19:1

### Requirement: Focus indicators
The system SHALL provide visible focus indicators for all interactive elements.

#### Scenario: Focus visible on all interactives
- **WHEN** any button, link, input, select receives keyboard focus
- **THEN** it shows 3px solid var(--color-red) outline with 3px offset

### Requirement: Form labels and errors
The system SHALL associate labels with inputs and announce errors.

#### Scenario: Inputs have associated labels
- **WHEN** form fields render
- **THEN** each input has <label> with for/id association, required fields marked, errors announced via aria-invalid and live region

## MODIFIED Requirements

### Requirement: Existing panel accessibility
**FROM**: Panel has basic accessibility (labels, focus rings)
**TO**: Panel meets design system accessibility standards

#### Scenario: Panel forms use design a11y patterns
- **WHEN** user interacts with panel forms
- **THEN** they have proper labels, error announcements, focus management

### Requirement: Existing registro accessibility
**FROM**: Registro has basic accessibility (labels, focus rings, aria on step indicator)
**TO**: Registro meets design system accessibility standards

#### Scenario: Registro wizard uses design a11y patterns
- **WHEN** user completes registration
- **THEN** all steps have proper labels, step indicator has aria, confirmation uses semantic time, QR has alt text