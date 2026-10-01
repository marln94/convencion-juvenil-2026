# Spec Delta

## ADDED Requirements

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
