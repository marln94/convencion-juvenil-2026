# Proposal

## Why

The 19 Convención Juvenil UPNFM has a defined visual identity ("Diferente" — editorial style with paper texture, black ink, red brush accents, and the ≠ symbol) documented in the technical design guide. Currently, both frontend apps (`apps/panel` and `apps/registro`) use default Tailwind indigo/slate styling with no design system. This change applies the official event design to create a cohesive, branded experience across all touchpoints.

## What Changes

- **Design tokens**: CSS custom properties for colors, typography, spacing, sizing matching the guide
- **Typography system**: Fluid type scale, reusable text styles (.t-solid, .t-outline, .t-fade, .t-date, .t-eyebrow, .t-script, .stack)
- **Background & texture**: Paper gray (#EDEDED) with radial glow, tileable noise texture, SVG fallback
- **Decorative system**: ≠ symbol component (SVG), watercolor brushes, organic lines, dotted connector, map pin
- **UI components**: Complete redesign of Button, Input, Select, Card, Alert, Pill, Nav, StepIndicator, and a new calendar-style DayPicker — sharp corners (--radius: 0), uppercase, black/red palette
- **Layout primitives**: Container, Section, Hero (16:9 on larger screens, content-sized on mobile), InfoBlock (right-aligned desktop), Split (map + info)
- **Responsive shells**: Persistent desktop sidebar, mobile bottom navigation, safe-area support, and an independently scrollable registration content area
- **Motion**: Entrance animations for ≠, staggered headlines, brush fade-in; respects prefers-reduced-motion
- **Accessibility**: ARIA for stacked headlines, decorative images, semantic time elements, map fallback text, component-specific focus indicators
- **Apps updated**: Both `apps/panel` (login, header, navigation, all vistas) and `apps/registro` (wizard steps, day selection, confirmation) refactored to use the new system
- **PWA meta**: Favicon (≠ on white circle), manifest theme/background colors

**BREAKING**: Visual appearance of all screens changes completely. No API or data model changes.

## Capabilities

### New Capabilities
- `design-system/tokens`: Design tokens (colors, typography, spacing, sizing) as CSS custom properties
- `design-system/typography`: Reusable text style utilities and stacked headline component
- `design-system/background`: Paper texture, radial glow, noise fallback, dark mode support
- `design-system/decorative`: ≠ mark, watercolor brushes, organic lines, dotted connector, map pin components
- `design-system/components`: Redesigned primitive UI components (Button, Input, Card, Alert, Pill, Nav, StepIndicator)
- `design-system/layout`: Layout primitives (Container, Section, Hero, InfoBlock, Split) and breakpoints
- `design-system/motion`: Entrance animations, reduced-motion compliance
- `design-system/a11y`: Accessibility patterns for the design system

### Modified Capabilities
- `panel`: Persistent desktop sidebar, mobile bottom navigation, safe-area support, and mobile-first layout behavior
- `formulario-registro`: Fixed mobile shell with document-level scroll disabled, responsive gutters, keyboard handling, and print-safe flow
- `campos-extendidos`: Attendance days are captured with a calendar-style multi-select while preserving the existing day codes and validation

### Affected Without Requirement Changes
- `registro`: Visual layer updated to use the design system; API and data behavior are unchanged

## Impact

**Affected code:**
- `packages/ui/src/styles/` (tokens, typography, layout, components, motion, a11y, backgrounds, and shared responsive behavior)
- `packages/ui/src/components/ui/` (redesigned primitives plus `DayPicker` and orientation-aware `Nav`)
- `packages/ui/src/components/decorative/` and `packages/ui/src/components/layout/` (shared event visuals and layout primitives)
- `apps/panel/src/App.tsx`, `apps/panel/src/index.css`, and `apps/panel/src/vistas/RegistroInsitu.tsx` (responsive navigation shell and calendar day selection)
- `apps/registro/index.html`, `apps/registro/src/App.tsx`, and `apps/registro/src/index.css` (mobile shell, virtual-keyboard viewport, compact layout, and day selection)

**Dependencies:**
- Google Fonts: Poppins (400,500,700,800), Poiret One, Sacramento
- Designer assets needed: ≠ SVG, 2-3 watercolor brush PNG/WebP, organic line SVGs, paper texture PNG (512×512), Honduras region map SVG, original fonts (OTF/WOFF2 + license)
- Tailwind CSS v4 (already installed via @tailwindcss/vite)

**Systems:** Frontend only. No backend, database, or infrastructure changes.

## Non-goals

- Backend/API changes
- Database schema changes
- New features or user flows
- Content/translation changes
- Infrastructure/CDK changes
- Original font licensing (use Google Fonts alternatives initially)

## Contexto

This implements the "Guía técnica de diseño web: 19 Convención Juvenil UPNFM" derived from two design arts ("Muy pronto" and "Danlí, El Paraíso"). The design uses editorial aesthetic: paper + black ink + red brush strokes, geometric typography with organic accents. Key principle: only 3 dominant colors (paper, black, red), red as accent only (never large backgrounds). 60% paper · 30% black · 10% red proportion. Event: 19 Convención Juvenil Nacional UPNFM · Danlí, El Paraíso · 24–27 diciembre.