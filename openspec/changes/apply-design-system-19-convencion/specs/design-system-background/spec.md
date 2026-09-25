# Spec Delta

## Purpose

Provides the paper background system with radial glow, tileable noise texture, and SVG noise fallback, plus optional dark mode support.

## ADDED Requirements

### Requirement: Paper background base
The system SHALL apply the paper gray background (#EDEDED) to the document body.

#### Scenario: Body has paper background
- **WHEN** page loads
- **THEN** body background-color is var(--color-paper)

### Requirement: Radial glow center
The system SHALL render a central white radial gradient glow (ellipse at 50% 45%, fading at 60%).

#### Scenario: Radial glow visible
- **WHEN** page loads
- **THEN** body has background-image with radial-gradient(ellipse at 50% 45%, var(--color-paper-light) 0%, transparent 60%)

### Requirement: Paper texture overlay
The system SHALL layer a tileable paper texture PNG (512×512) with multiply blend mode over the background.

#### Scenario: Texture loads and displays
- **WHEN** /assets/paper-texture.png is available
- **THEN** body background-image includes url("/assets/paper-texture.png") with background-blend-mode: multiply

### Requirement: SVG noise fallback
The system SHALL provide an inline SVG noise fallback when the PNG texture is unavailable.

#### Scenario: Noise fallback renders
- **WHEN** paper texture PNG fails to load or is omitted
- **THEN** .paper-noise::before renders fractal noise via feTurbulence filter at opacity 0.35

### Requirement: Dark mode background
The system SHALL support dark mode with black background (#0A0A0A), light text (#EDEDED), and white borders.

#### Scenario: Dark mode activates
- **WHEN** .theme-dark class is applied to root or container
- **THEN** --color-bg becomes #0A0A0A, --color-text becomes #EDEDED, --color-border becomes #FFFFFF, radial glow and texture adapt

## MODIFIED Requirements

### Requirement: Existing panel page background
**FROM**: Panel uses bg-slate-100 (light gray) background
**TO**: Panel uses design system paper background with texture and radial glow

#### Scenario: Panel app has paper background
- **WHEN** user visits any panel route
- **THEN** page background matches design system paper specification

### Requirement: Existing registro page background
**FROM**: Registro uses bg-slate-100 background
**TO**: Registro uses design system paper background with texture and radial glow

#### Scenario: Registro app has paper background
- **WHEN** user visits registration wizard
- **THEN** page background matches design system paper specification