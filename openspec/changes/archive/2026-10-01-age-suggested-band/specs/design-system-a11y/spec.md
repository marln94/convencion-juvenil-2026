# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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