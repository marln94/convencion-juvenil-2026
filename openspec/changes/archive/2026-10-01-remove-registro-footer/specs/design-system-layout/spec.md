# Spec Delta

## MODIFIED Requirements

### Requirement: Fixed viewport content shell
The system SHALL allow mobile application content to scroll independently from the surrounding page chrome when content exceeds the viewport. The scrolling content area SHALL be the element that reserves the device bottom safe area, so that content scrolls past the inset instead of being clipped by it.

#### Scenario: Registration content scrolls inside the shell
- **WHEN** the registration wizard is used below 768px
- **THEN** the document itself does not scroll, the header remains fixed, and only the main content area scrolls when needed

#### Scenario: Mobile shell respects device insets and printing
- **WHEN** the viewport includes a safe area or the page is printed
- **THEN** the shell applies top safe-area spacing to the chrome above the content and bottom safe-area spacing to the main content area, and printing restores normal document flow without clipping content