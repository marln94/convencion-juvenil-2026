# Design

## Context

See proposal.md - Why. Current state: both `apps/panel` and `apps/registro` use default Tailwind v4 (via `@tailwindcss/vite`) with indigo/slate theme, rounded components, no design system. The design guide ("Guía técnica de diseño web: 19 Convención Juvenil UPNFM") defines a complete visual system: paper texture, black ink, red brush accents, ≠ symbol, editorial typography (Poppins/Poiret One/Sacramento), sharp corners, 16:9 heroes, right-aligned info blocks.

Constraints:
- Tailwind v4 uses `@theme` directive in CSS, not `tailwind.config.js`
- Must work with existing React 19 + Vite setup
- Google Fonts as interim; original fonts pending license
- Designer assets (≠ SVG, brushes, map, paper texture) not yet available — need CSS fallbacks first
- No backend changes; pure frontend visual layer

## Goals / Non-Goals

**Goals:**
- Implement complete design token system as CSS custom properties
- Replace all Tailwind default colors/typography/spacing with design system tokens
- Build reusable component library (Button, Input, Card, etc.) matching guide specs
- Create decorative components (MarkNeq, Brush, OrganicLines, MapPin)
- Establish layout primitives (Container, Section, Hero, InfoBlock, Split)
- Apply to both apps with zero breaking changes to APIs/data
- Ensure WCAG AA compliance and prefers-reduced-motion support

**Non-Goals:**
- Backend, database, or infrastructure changes
- New features or user flows
- Original font licensing (use Google Fonts alternatives)
- PWA for `apps/registro` (only panel has PWA currently)
- Animations beyond specified entrance effects

## Decisions

### 1. Design Token Delivery: CSS Custom Properties + Tailwind v4 `@theme`

**Decision**: Define all tokens as CSS custom properties in `tokens.css`, then map to Tailwind via `@theme` in `index.css`.

**Rationale**: Tailwind v4 encourages CSS-first configuration. Custom properties work natively in browsers, enable runtime theming (dark mode via class), and don't require build-time config changes. The `@theme` directive lets Tailwind utilities (e.g., `bg-bg`, `text-text`, `font-display`) reference the same tokens.

**Alternative considered**: Tailwind v4 `tailwind.config.js` with `theme.extend`. Rejected — v4 deprecates config file in favor of CSS `@theme`; custom properties are more flexible for dark mode and runtime overrides.

### 2. Shared Package vs. Per-App Duplication

**Decision**: Create `packages/ui` as a shared internal package containing:
- `src/styles/` — all CSS (tokens, base, typography, layout, components, motion, a11y)
- `src/components/` — React components (ui/, decorative/, layout/)
- Export via `package.json` `"exports"` for both apps to consume

**Rationale**: Avoids duplication across two apps. Single source of truth for design system. Enables versioning if needed later. Both apps already use workspace protocol for `@convencion/shared-types` and `@convencion/api-client`.

**Alternative considered**: Duplicate styles/components in each app. Rejected — maintenance burden, drift risk, violates DRY.

**Implementation**: New `packages/ui` with:
```json
{
  "name": "@convencion/ui",
  "type": "module",
  "exports": {
    "./styles/*": "./src/styles/*.css",
    "./components/*": "./src/components/*.tsx"
  },
  "peerDependencies": { "react": "^19", "react-dom": "^19" }
}
```
Apps add `"@convencion/ui": "workspace:*"` and import `@convencion/ui/styles/tokens.css`, `@convencion/ui/components/Button`, etc.

### 3. Asset Strategy: CSS-First Fallbacks, Swap Real Assets Later

**Decision**: Implement all decorative elements with pure CSS/SVG fallbacks first. Replace with designer assets when delivered.

**Fallibacks**:
- ≠ symbol: Inline SVG path approximating brush stroke (red, textured via filter)
- Paper texture: SVG `feTurbulence` noise (already in guide)
- Watercolor brushes: CSS `radial-gradient` + `mix-blend-mode` approximations
- Organic lines: Inline SVG paths (simple curves)
- Map: Simplified Honduras SVG (can use public domain GeoJSON → SVG)
- Fonts: Google Fonts (Poppins, Poiret One, Sacramento) via `<link preconnect>`

**Rationale**: Unblocks implementation immediately. Designer assets often arrive late. CSS fallbacks are performant (no network requests for decorations) and can be swapped 1:1 via CSS `background-image` or component props.

### 4. Component Architecture: Headless CSS + Thin React Wrappers

**Decision**: Styles live in CSS (utility classes + component classes). React components are thin wrappers applying correct class combinations and handling state (focus, error, loading).

**Example**:
```css
/* packages/ui/src/styles/components.css */
.btn { /* base: sharp, uppercase, bold, transition */ }
.btn--primary { background: var(--color-red); color: white; }
.btn--outline { background: transparent; border: 2px solid var(--color-ink); }
```

```tsx
// packages/ui/src/components/ui/Button.tsx
export function Button({ variant = 'primary', children, ...props }) {
  return <button className={`btn btn--${variant}`} {...props}>{children}</button>;
}
```

**Rationale**: Keeps styling in CSS where design tokens live. React components only handle composition and accessibility (aria, focus management). Easy to test, easy to override, no CSS-in-JS runtime.

**Alternative considered**: Tailwind `@apply` in component classes. Rejected — `@apply` is discouraged in v4; custom properties + native CSS is the intended path.

### 5. Typography: CSS Utility Classes, Not Component Props

**Decision**: Text styles (`.t-solid`, `.t-outline`, `.t-fade`, `.t-date`, `.t-eyebrow`, `.t-script`, `.stack`) are pure CSS utilities. No `Typography` React component.

**Rationale**: Matches how the design guide specifies them — as reusable CSS classes. More flexible (apply to any element), no React overhead, works in server-rendered HTML if needed later.

### 6. Dark Mode: Class-Based Toggle on Root

**Decision**: `.theme-dark` class on `<html>` or root container toggles dark mode via CSS custom property overrides.

**Rationale**: Simple, no JS required for initial render, works with `prefers-color-scheme` media query if desired later. Matches guide's `.theme-dark` specification.

### 7. Animation: CSS Keyframes + Reduced-Motion Media Query

**Decision**: All animations defined as CSS `@keyframes` in `motion.css`. Components apply animation classes. Global `@media (prefers-reduced-motion: reduce)` disables all.

**Rationale**: Performant (browser-optimized), declarative, respects accessibility natively. No JS animation library needed.

### 8. Icon System: Inline SVG at the Consumer

**Decision**: Do not publish a dedicated icons export until a shared icon is required. Small icons remain inline SVG components next to the consuming view. No icon font or external library.

**Rationale**: Avoids dead package exports while keeping zero dependencies, tree-shakable output, `currentColor` styling, and the sharp visual language.

### 9. Form Components: Uncontrolled with Validation Hook

**Decision**: Keep `apps/registro`'s current form pattern with `useState` + validation functions. Wrap standard fields with design system `Input` and `Select`, and render attendance days with a dedicated `DayPicker` that preserves the existing `diasAsistencia` string array.

**Rationale**: Existing validation logic is solid. Design system components only replace rendering, not state management. `DayPicker` specializes the attendance-day interaction without changing the API contract or stable day codes.

### 10. PWA Manifest: Update Colors Only

**Decision**: Update `vite.config.ts` PWA manifest `theme_color: "#0A0A0A"` (ink), `background_color: "#EDEDED"` (paper). Favicon → ≠ symbol.

**Rationale**: Minimal change, aligns with design tokens. No new PWA features for registro.

### 11. Responsive Application Shells

**Decision**: Keep page chrome outside the mobile scrolling region. The panel uses a sticky vertical sidebar at 768px and wider and a fixed horizontal bottom bar below 768px, including bottom safe-area compensation. The registration app uses a 100dvh shell below 768px: the document does not scroll, the header and footer stay fixed, and only the main content area scrolls when needed. Printing restores normal document flow.

**Rationale**: Persistent navigation and headers remain reachable without bouncing the whole document, while long steps and forms stay fully accessible through an internal scroller.

**Alternative considered**: Apply `overflow: hidden` without an internal scroller. Rejected because it would clip errors, confirmation actions, and long forms.

### 12. Shared Package Scanning and Container Gutter

**Decision**: Both apps register `packages/ui/src` as a Tailwind v4 source so utilities used by shared components are generated. The design-system `.container` remains the source of truth for the `--gutter` and `--container` tokens. The registration shell uses a scoped container rule with the same token formula to outrank Tailwind's same-named container utility without changing the design-system contract.

**Rationale**: Tailwind v4 ignores dependency directories during automatic source detection, and its `.container` utility otherwise removes the design-system side gutters.

### 13. Component-Specific Focus and Status Styling

**Decision**: Design-system Buttons and selectable day cards use a 3px red focus outline. Inputs and selects keep their 2px geometry and signal focus by changing the border to `--color-red-deep`; navigation buttons preserve the browser's default focus indicator. Alerts use a full variant-colored 2px border, and the step indicator uses a 5px track so progress remains visible on small screens.

**Rationale**: Focus remains visually distinct while form controls avoid layout shifts, and status colors remain legible at mobile sizes.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Designer assets delayed | CSS fallbacks unblock implementation; swap via CSS `background-image` or component `src` prop |
| Tailwind v4 migration issues | Use `@theme` directive; test utilities (`bg-bg`, `text-text`, `font-display`) early |
| Font loading performance | Preconnect + preload Google Fonts; `font-display: swap`; subset if self-hosting later |
| Dark mode flash on load | Set `.theme-dark` on `<html>` via inline script before paint if user preference stored |
| Component API drift between apps | Single `@convencion/ui` package enforces consistency |
| WCAG failure on red text | Enforce via lint: `color-red` utility only allowed on elements with `text-lg font-semibold` or larger; document in component JSDoc |
| Bundle size increase | Tree-shaking via ES modules; CSS is single file ~15KB gzipped; icons inline SVG |
| Browser support for `mix-blend-mode` | Supported in all modern browsers; fallback: opaque ≠ without blend for old browsers |
| `text-stroke` fallback | `@supports not (-webkit-text-stroke: 1px #000)` fallback to solid color in `typography.css` |
| Tailwind v4 ignores shared package classes | Register `packages/ui/src` with `@source` in both app entry stylesheets |
| Tailwind `.container` overrides the design-system gutter | Keep token formulas identical and use a scoped container rule in the registration shell |
| Mobile fixed shell hides long content | Keep `main` as the only scroll container, constrain overscroll, and reset the shell for printing |

## Migration Plan

1. **Phase 1**: Create `packages/ui` with tokens, base, typography, background CSS
2. **Phase 2**: Add decorative components (MarkNeq, Brush, OrganicLines, MapPin) with CSS fallbacks
3. **Phase 3**: Build UI components (Button, Input, Select, Card, Alert, Pill, Nav, StepIndicator)
4. **Phase 4**: Build layout primitives (Container, Section, Hero, InfoBlock, Split)
5. **Phase 5**: Add motion.css and a11y.css
6. **Phase 6**: Update `apps/panel` — replace index.css, refactor components/vistas
7. **Phase 7**: Update `apps/registro` — replace index.css, refactor App.tsx wizard
8. **Phase 8**: Update PWA manifests, favicons
9. **Phase 9**: Visual regression testing, accessibility audit, cross-browser check

**Rollback**: Git revert. No database migrations. Feature flag not needed — visual only.

## Open Questions

1. **Original font license timeline** — When will OTF/WOFF2 + license be available? (Affects Phase 1 font loading)
2. **Asset delivery schedule** — When will designer provide ≠ SVG, brushes, map, paper texture? (Affects Phase 2 fallback fidelity)
3. **Dark mode default** — Should dark mode be opt-in (class toggle) or follow `prefers-color-scheme`? (Guide shows `.theme-dark` class only)
4. **apps/campo (PWA)** — Not in current apps/ dir. Will it need design system too? (Deferred — not in scope)
5. **Animation preferences persistence** — Store user's reduced-motion choice? (Native media query handles it; skip for v1)