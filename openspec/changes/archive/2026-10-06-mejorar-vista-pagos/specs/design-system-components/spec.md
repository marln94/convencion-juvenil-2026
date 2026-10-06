# Spec Delta

## MODIFIED Requirements

### Requirement: Button component (Button)

The system SHALL provide a Button component with sharp corners (--radius: 0), uppercase text, bold weight, 2px borders, and three variants.

#### Scenario: Primary button renders
- **WHEN** <Button variant="primary" /> renders
- **THEN** it has background var(--color-red), white text, 2px transparent border, hover background var(--color-red-dark), transform translateY(-2px), focus-visible 3px solid var(--color-red) outline

#### Scenario: Outline button renders
- **WHEN** <Button variant="outline" /> renders
- **THEN** it has transparent background, var(--color-ink) text, 2px solid var(--color-ink) border, hover background var(--color-ink) with var(--color-paper) text

#### Scenario: Ghost button renders
- **WHEN** <Button variant="ghost" /> renders
- **THEN** it has transparent background, var(--color-ink) text, transparent border, hover background var(--color-paper), and it uses no red so it reads as a neutral action beside primary and outline buttons

#### Scenario: Disabled button state
- **WHEN** a button renders with the disabled attribute
- **THEN** it shows opacity 0.5, a not-allowed cursor, no hover transform, and it is not operable by pointer or keyboard

#### Scenario: Button uses design typography
- **WHEN** any button renders
- **THEN** it uses --font-display, weight 700, uppercase, letter-spacing 0.06em, with default padding of 1.25rem horizontally and 0.625rem vertically; the small and large variants override those spacing tokens
