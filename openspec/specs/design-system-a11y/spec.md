# design-system-a11y Specification

## Purpose
Defines accessibility patterns and requirements for the design system components, ensuring WCAG compliance and inclusive experience.

## Requirements

### Requirement: Stacked headlines accessibility

The system SHALL ensure stacked headlines (.stack) are accessible to screen readers.

#### Scenario: Stacked headlines have aria-label
- **WHEN** .stack contains headline spans that repeat or split the same phrase
- **THEN** the container has aria-label with the text content once, and all visually duplicated spans have aria-hidden="true"

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

The system SHALL provide a visible focus state for interactive elements, using outlines for design-system buttons and day cards, a high-contrast border transition for form controls (including the age field's number input and its range slider), and the browser default indicator for navigation buttons.

#### Scenario: Outline focus on design buttons and day cards
- **WHEN** a design-system Button or selectable day card receives keyboard focus
- **THEN** it shows a 3px solid var(--color-red) outline with 3px offset

#### Scenario: Border focus on inputs and selects
- **WHEN** an input or select receives keyboard focus
- **THEN** its existing 2px border changes to var(--color-red-deep) without changing layout dimensions

#### Scenario: Border focus on the age range slider
- **WHEN** the age field's range slider receives keyboard focus
- **THEN** the slider track's 2px border changes to var(--color-red-deep) without changing layout dimensions, matching the form-control family rather than the outline family

#### Scenario: Navigation button focus remains visible
- **WHEN** a navigation button receives keyboard focus
- **THEN** the browser's visible default focus indicator is preserved

### Requirement: Content remains reachable in fixed viewport shells

The system SHALL keep all interactive controls, errors, and confirmation actions reachable when a mobile application disables document-level scrolling.

#### Scenario: Internal content area is keyboard and touch accessible
- **WHEN** a mobile application uses a fixed shell with an internally scrollable main region
- **THEN** users can reach every control and error by scrolling that region, and the viewport resizes when the software keyboard opens

### Requirement: Form labels and errors

The system SHALL associate labels with inputs and announce errors.

#### Scenario: Inputs have associated labels
- **WHEN** form fields render
- **THEN** each input has <label> with for/id association, required fields marked, errors announced via aria-invalid and live region
### Requirement: Age field semantics and announcements

The age field SHALL expose native range semantics for its slider, SHALL name the slider and its number input, and SHALL associate the permitted band's caption and any validation error with the control through a description relationship rather than through color alone.

#### Scenario: Slider exposes native range semantics
- **WHEN** the age field's slider renders
- **THEN** it is a native range input, so it exposes an accessible value, minimum, and maximum, and responds to arrow keys, Home, End, Page Up and Page Down without additional key handling

#### Scenario: Slider has an accessible name
- **WHEN** the slider renders
- **THEN** it has an associated label that names it as an age control, distinct from the number input's label

#### Scenario: Band caption and error are announced descriptively
- **WHEN** a permitted band renders, or the field carries an error
- **THEN** the caption and the error text are associated to the control via aria-describedby, so the condition is not conveyed by color alone

#### Scenario: Out-of-band value sets aria-invalid
- **WHEN** the value falls outside the permitted range for its role
- **THEN** the control is marked aria-invalid, because the band is an acceptance limit and the value will not pass

#### Scenario: Empty value is not treated as out of range
- **WHEN** the field is empty and the form reports only that the age is required
- **THEN** the absence of a value is not reported as an out-of-range condition by the range predicate
