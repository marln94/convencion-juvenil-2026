# Spec Delta

## ADDED Requirements

### Requirement: Phone field with automatic dash (TelefonoInput)

The system SHALL provide a TelefonoInput component for capturing a phone number that presents the shared Input styling and keeps the displayed value formatted as `dddd-dddd` by inserting a hyphen after the fourth digit as the user types. The component SHALL accept any characters the user types or pastes but SHALL keep only digits, SHALL limit the value to 8 digits (extra typed digits are ignored), and SHALL render the value with the hyphen. It SHALL identify itself as a telephone field so mobile browsers open a numeric keyboard, and SHALL NOT perform validation of its own — rejection is reported by the owning form through the shared `error` prop.

#### Scenario: Digits typed without a hyphen
- **WHEN** the user types the 8 digits of a phone number without typing a hyphen
- **THEN** the field displays `8877-9955` and the owning form receives the formatted value

#### Scenario: Backspace on the hyphen
- **WHEN** the field value is `8877-` and the user presses backspace
- **THEN** the value becomes `8877` and the hyphen is not re-inserted

#### Scenario: Ninth digit is ignored
- **WHEN** the field already shows the 8 digits formatted and the user types another digit
- **THEN** the value remains `8877-9955`

#### Scenario: Pasted value with extra characters
- **WHEN** the user pastes a value containing spaces, punctuation or more than 8 digits
- **THEN** only the first 8 digits are kept and the value is displayed formatted as `dddd-dddd`

#### Scenario: Error state is owned by the form
- **WHEN** the owning form passes an `error` to TelefonoInput
- **THEN** the field renders it with the shared Input error styling and messaging, and TelefonoInput itself adds no validation feedback
