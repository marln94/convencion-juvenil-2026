# Proposal

## Why

The 19 Convención Juvenil UPNFM has a defined visual identity ("Diferente" — editorial style with paper texture, black ink, red brush accents, and the ≠ symbol) documented in the technical design guide. Currently, both frontend apps (`apps/panel` and `apps/registro`) use default Tailwind indigo/slate styling with no design system. This change applies the official event design to create a cohesive, branded experience across all touchpoints.

## What Changes

- **Design tokens**: CSS custom properties for colors, typography, spacing, sizing matching the guide
- **Typography system**: Fluid type scale, reusable text styles (.t-solid, .t-outline, .t-fade, .t-date, .t-eyebrow, .t-script, .stack)
- **Background & texture**: Paper gray (#EDEDED) with radial glow, tileable noise texture, SVG fallback
- **Decorative system**: ≠ symbol component (SVG), watercolor brushes, organic lines, dotted connector, map pin
- **UI components**: Complete redesign of Button, Input, Select, Card, Alert, Pill, Nav, StepIndicator — sharp corners (--radius: 0), uppercase, black/red palette
- **Layout primitives**: Container, Section, Hero (16:9, 100svh), InfoBlock (right-aligned desktop), Split (map + info)
- **Motion**: Entrance animations for ≠, staggered headlines, brush fade-in; respects prefers-reduced-motion
- **Accessibility**: ARIA for stacked headlines, decorative images, semantic time elements, map fallback text
- **Apps updated**: Both `apps/panel` (login, header, nav, all vistas) and `apps/registro` (wizard steps, confirmation) refactored to use new system
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
- `panel`: Visual layer updated to use design system; no requirement changes
- `registro`: Visual layer updated to use design system; no requirement changes
- `formulario-registro`: Visual layer updated to use design system; no requirement changes

## Impact

**Affected code:**
- `apps/panel/src/styles/` (new directory with token, base, typography, layout, components, motion, a11y CSS)
- `apps/panel/src/components/ui/` (redesigned: Button, Input, Select, Card, Alert, Pill, Nav, StepIndicator)
- `apps/panel/src/components/decorative/` (new: MarkNeq, Brush, OrganicLines, DottedConnector, MapPin)
- `apps/panel/src/components/layout/` (new: Container, Section, Hero, InfoBlock)
- `apps/panel/src/vistas/*.tsx` (refactored to use new components and layout)
- `apps/panel/src/index.css` (replaced with design system imports)
- `apps/panel/vite.config.ts` (PWA manifest colors, favicon)
- `apps/panel/public/favicon.svg` (replaced with ≠ symbol)

- `apps/registro/src/styles/` (mirror of panel styles, or shared via package)
- `apps/registro/src/components/` (mirror of panel components)
- `apps/registro/src/App.tsx` (refactored wizard to use design system)
- `apps/registro/src/index.css` (replaced with design system imports)
- `apps/registro/vite.config.ts` (PWA manifest colors if PWA added)

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