# design-system-components Specification

## Purpose
Provides the redesigned primitive UI components (Button, Input, Select, Card, Alert, Pill, Nav, StepIndicator) with sharp corners, uppercase labels, black/red palette, and editorial aesthetic.

## Requirements

### Requirement: Button component (Button)

The system SHALL provide a Button component with sharp corners (--radius: 0), uppercase text, bold weight, 2px borders, and two variants.

#### Scenario: Primary button renders
- **WHEN** <Button variant="primary" /> renders
- **THEN** it has background var(--color-red), white text, 2px transparent border, hover background var(--color-red-dark), transform translateY(-2px), focus-visible 3px solid var(--color-red) outline

#### Scenario: Outline button renders
- **WHEN** <Button variant="outline" /> renders
- **THEN** it has transparent background, var(--color-ink) text, 2px solid var(--color-ink) border, hover background var(--color-ink) with var(--color-paper) text

#### Scenario: Button uses design typography
- **WHEN** any button renders
- **THEN** it uses --font-display, weight 700, uppercase, letter-spacing 0.06em, with default padding of 1.25rem horizontally and 0.625rem vertically; the small and large variants override those spacing tokens

### Requirement: Input component (Input)

The system SHALL provide an Input component with sharp corners, black borders, a dark-red focus border, and uppercase labels.

#### Scenario: Input renders with design styling
- **WHEN** <Input /> renders
- **THEN** it has min-height 44px, sharp corners, 2px solid var(--color-ink) border, var(--color-text) text, a var(--color-red-deep) border while focused, and an uppercase --font-display weight 600 label

#### Scenario: Input error state
- **WHEN** input has error
- **THEN** border becomes var(--color-red) and the error message is rendered in var(--color-red)

### Requirement: Select component (Select)

The system SHALL provide a Select component matching Input styling.

#### Scenario: Select renders with design styling
- **WHEN** <Select /> renders
- **THEN** it matches Input styling: sharp corners, black border, dark-red focus border, uppercase label

### Requirement: Card component (Card)

The system SHALL provide a Card component with sharp corners, 2px black border, paper-light background.

#### Scenario: Card renders with design styling
- **WHEN** <Card /> renders
- **THEN** it has background var(--color-paper-light), 2px solid var(--color-ink) border, sharp corners, padding var(--space-3)

#### Scenario: Card tag accent
- **WHEN** card has .card__tag element
- **THEN** it uses var(--color-red), weight 700, uppercase

### Requirement: Alert component (Alert)

The system SHALL provide an Alert component with sharp corners, a variant-colored 2px border, and a paper or variant-tinted background.

#### Scenario: Alert renders with design styling
- **WHEN** <Alert variant="error" /> renders
- **THEN** it has sharp corners, a 2px solid var(--color-red) border, background var(--color-paper), and var(--color-text) text

#### Scenario: Alert success/info variants
- **WHEN** <Alert variant="success|info|warning" /> renders
- **THEN** variants use an appropriate 2px border and tinted background while maintaining sharp corners

### Requirement: Pill/Badge component (Pill)

The system SHALL provide a Pill component with sharp corners, uppercase, tracking-wide, black/red variants.

#### Scenario: Pill renders with design styling
- **WHEN** <Pill variant="default|red|green|amber" /> renders
- **THEN** it has sharp corners, padding 0.75rem 1rem, uppercase, letter-spacing 0.08em, weight 700, size 0.75rem

### Requirement: Navigation component (Nav)

The system SHALL provide a Nav component with horizontal and vertical orientations and a high-contrast active state.

#### Scenario: Nav renders with design styling
- **WHEN** <Nav /> renders
- **THEN** items use the body font at 0.875rem with medium weight, 0.5rem vertical padding, and a transparent or paper background

#### Scenario: Nav orientation changes layout
- **WHEN** Nav orientation is horizontal or vertical
- **THEN** items are laid out in a row or a column respectively and fill the available navigation width

#### Scenario: Nav active and hover states
- **WHEN** an item is active or hovered
- **THEN** the active item uses var(--color-accent) with white text, and the hovered item uses var(--color-border) with white text

### Requirement: Step indicator component (StepIndicator)

The system SHALL provide a StepIndicator with a visible black track, red progress, and numbered circles.

#### Scenario: Step indicator renders with design styling
- **WHEN** <StepIndicator current={2} total={5} /> renders
- **THEN** track is var(--color-ink) at 5px height, progress is var(--color-red), circles are numbered with var(--color-ink) border, and the active circle is filled var(--color-red)

### Requirement: Calendar day selector (DayPicker)

The system SHALL provide a DayPicker that lets users select one or more event days from calendar-style cards while preserving a string array of stable day codes.

#### Scenario: Day options render as calendar cards
- **WHEN** <DayPicker /> renders four days
- **THEN** each option displays a large day number above a smaller day name, arranged in four columns and two columns at 480px and below

#### Scenario: Days are selected and deselected
- **WHEN** a user activates a day card
- **THEN** the system toggles that day's stable code in the controlled string array and updates the selected visual state

#### Scenario: DayPicker exposes accessible semantics
- **WHEN** a DayPicker renders
- **THEN** it uses a labelled fieldset, native checkboxes, a visible keyboard focus indicator, error announcement, and a semantic time element with a dateTime value for each day
### Requirement: Age field with per-role band (EdadField)

The system SHALL provide an EdadField component that captures an integer age through a number input and, when a permitted range is supplied, additionally renders a native range slider and a visual band marking the permitted values on the slider track. The component SHALL be presentational: it draws the band and reports the range it was given, and SHALL NOT decide whether a value is acceptable.

#### Scenario: Number input always renders
- **WHEN** <EdadField /> renders
- **THEN** it shows a labeled number input with the shared Input styling: sharp corners, 2px solid var(--color-ink) border, var(--color-text) text, and an uppercase --font-display weight 600 label

#### Scenario: Slider renders when a permitted range is supplied
- **WHEN** <EdadField /> renders with a permitted range
- **THEN** a native range input appears below the number input, and when no range is supplied no slider renders

#### Scenario: Slider spans the full hard domain, not the role range
- **WHEN** the slider renders
- **THEN** its minimum and maximum equal the component's minimum and maximum bounds, 15 and 99 by default, so its thumb always represents the current value and can point outside the permitted band instead of clamping to it

#### Scenario: Permitted band is marked on the track
- **WHEN** the slider renders with a permitted range
- **THEN** the region of the track between the range's minimum and maximum is visually distinguished from the rest of the track

#### Scenario: Band is positioned against the usable track width
- **WHEN** the permitted range starts at the slider's minimum, so its fraction is zero
- **THEN** the band begins half a thumb width in from the track's left edge, aligning with where the native range places its thumb at the minimum, rather than flush against the border

#### Scenario: Band fractions are unitless
- **WHEN** the component computes the band's start and end
- **THEN** it emits them as fractions between 0 and 1 without a percent unit, and the stylesheet converts them to a length over the usable track width

#### Scenario: Value is shared between the two controls
- **WHEN** the user moves the slider
- **THEN** the number input reflects that value, and when the user edits the number input the slider repositions to match

#### Scenario: Out-of-band value renders no internal advisory
- **WHEN** a permitted range is supplied and the value falls outside it
- **THEN** the component renders no advisory icon or advisory text of its own; any rejection is communicated through the `error` prop by the form that owns validation

#### Scenario: Caption states the permitted range
- **WHEN** a permitted range is supplied
- **THEN** the control renders a caption naming the range's minimum and maximum

#### Scenario: Error state styling
- **WHEN** the field has an error
- **THEN** the number input border becomes var(--color-red) and the error message renders in var(--color-red)

#### Scenario: Slider thumb follows the design system
- **WHEN** the slider thumb renders
- **THEN** it has sharp corners via var(--radius), a 2px solid var(--color-ink) border, and a var(--color-accent) fill
