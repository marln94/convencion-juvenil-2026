# Spec Delta

## Purpose

Defines entrance animations and motion patterns consistent with the editorial aesthetic, with full prefers-reduced-motion compliance.

## ADDED Requirements

### Requirement: ≠ symbol entrance animation
The system SHALL animate the ≠ symbol on hero load with scale, rotation, and opacity.

#### Scenario: MarkNeq animates on mount
- **WHEN** .hero__neq or .mark-neq enters viewport
- **THEN** it animates from scale(1.2) rotate(~10deg) opacity(0) to scale(1) rotate(0) opacity(1) over 400ms with cubic-bezier(0.2, 0.8, 0.2, 1)

### Requirement: Stacked headlines staggered entrance
The system SHALL animate stacked headlines (.stack spans) with staggered translateY entrance.

#### Scenario: Stack spans animate in sequence
- **WHEN** .stack container enters viewport
- **THEN** each span animates from translateY(20px) opacity(0) to translateY(0) opacity(1) with 80ms stagger delay between spans

### Requirement: Watercolor brush fade-in
The system SHALL animate brush elements with a slow fade-in. The brush layer is viewport-anchored, so it SHALL NOT animate parallax on scroll.

#### Scenario: Brushes fade in slowly
- **WHEN** .brush elements render
- **THEN** they animate opacity 0→1 over 800ms ease-out and hold at full opacity, with no scroll-linked transform

### Requirement: Reduced motion compliance
The system SHALL disable all animations and transitions when user prefers reduced motion.

#### Scenario: Animations disabled for prefers-reduced-motion
- **WHEN** @media (prefers-reduced-motion: reduce) matches
- **THEN** all animations and transitions are disabled (!important) via * { animation: none !important; transition: none !important; }

### Requirement: Button hover/tap feedback
The system SHALL provide subtle transform feedback on button interactions.

#### Scenario: Primary button hover lifts
- **WHEN** user hovers primary button
- **THEN** it transforms translateY(-2px) over 200ms

#### Scenario: Button focus visible
- **WHEN** button receives keyboard focus
- **THEN** it shows 3px solid var(--color-red) outline with 3px offset
