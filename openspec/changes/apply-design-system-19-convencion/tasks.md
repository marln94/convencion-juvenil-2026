# Tasks

## 1. Shared UI Package Setup

- [ ] 1.1 Create `packages/ui` directory structure with `src/styles`, `src/components/ui`, `src/components/decorative`, `src/components/layout`, `src/components/icons` and verify structure exists
- [ ] 1.2 Create `packages/ui/package.json` with name `@convencion/ui`, type module, exports for styles and components, peerDependencies on react/react-dom, and verify `pnpm install` succeeds
- [ ] 1.3 Add `@convencion/ui` as workspace dependency to both `apps/panel/package.json` and `apps/registro/package.json` and verify `pnpm install` resolves correctly

## 2. Design Tokens (CSS Custom Properties)

- [ ] 2.1 Create `packages/ui/src/styles/tokens.css` with all color tokens (--color-paper, --color-ink, --color-red variants, semantic aliases) and verify custom properties are defined
- [ ] 2.2 Add typography tokens (--font-display, --font-fine, --font-script, --font-body, --fs-hero through --fs-small) to `tokens.css` and verify clamp() values match guide
- [ ] 2.3 Add spacing/layout tokens (--container, --gutter, --space-1 through --space-6, --radius: 0) to `tokens.css` and verify values
- [ ] 2.4 Create `packages/ui/src/styles/base.css` with `@import "tokens.css";`, Google Fonts `@import` with preconnect, body reset (margin:0, font-family: var(--font-body), color: var(--color-text), background: var(--color-bg), line-height: 1.6) and verify no console errors on import
- [ ] 2.5 Update `apps/panel/src/index.css` to `@import "@convencion/ui/styles/base.css"; @import "@convencion/ui/styles/typography.css"; @import "@convencion/ui/styles/layout.css"; @import "@convencion/ui/styles/components.css"; @import "@convencion/ui/styles/motion.css"; @import "@convencion/ui/styles/a11y.css";` and verify dev server starts without CSS errors
- [ ] 2.6 Update `apps/registro/src/index.css` with same imports and verify dev server starts without CSS errors
- [ ] 2.7 Configure Tailwind v4 `@theme` in `apps/panel/src/index.css` (after imports) mapping tokens to utilities: `--color-bg`, `--color-text`, `--color-accent`, `--color-border`, `--font-display`, `--font-body`, `--radius: 0` and verify `bg-bg`, `text-text`, `font-display` utilities work in a test component

## 3. Typography System

- [ ] 3.1 Create `packages/ui/src/styles/typography.css` with `.t-solid`, `.t-outline`, `.t-fade`, `.t-date`, `.t-eyebrow`, `.t-script` utility classes matching guide specs and verify each renders correctly in a test page
- [ ] 3.2 Add `.stack` component with `display: grid; line-height: 0.9;` and `.stack > span { display: block; }` to `typography.css` and verify stacked headlines alternate solid/outline with tight leading
- [ ] 3.3 Add `@supports not (-webkit-text-stroke: 1px #000)` fallback for `.t-outline` in `typography.css` and verify fallback renders solid text in unsupported browsers
- [ ] 3.4 Add Google Fonts `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700;800&family=Poiret+One&family=Sacramento&display=swap" rel="stylesheet">` to both `apps/panel/index.html` and `apps/registro/index.html` and verify fonts load in Network tab

## 4. Background & Texture System

- [ ] 4.1 Create `packages/ui/src/styles/background.css` with body background: `var(--color-paper)` + `radial-gradient(ellipse at 50% 45%, var(--color-paper-light) 0%, transparent 60%)` + noise fallback (`.paper-noise::before` with inline SVG feTurbulence) and verify paper texture appears on page load
- [ ] 4.2 Add `.theme-dark` overrides in `background.css` (--color-bg: #0A0A0A, --color-text: #EDEDED, --color-border: #FFFFFF) and verify dark mode toggles when class applied to `<html>`
- [ ] 4.3 Create placeholder `/public/assets/paper-texture.png` (1×1 transparent PNG) in both apps and verify no 404 errors; document that designer asset will replace this

## 5. Decorative Components

- [ ] 5.1 Create `packages/ui/src/components/decorative/MarkNeq.tsx` with `.mark-neq` (clamp 48-96px) and `.hero__neq` (absolute center, clamp 200-520px, mix-blend-mode: multiply, pointer-events: none) and verify component renders red ≠ symbol (inline SVG fallback)
- [ ] 5.2 Create `packages/ui/src/components/decorative/Brush.tsx` with `position` prop ("tr" | "bl"), absolute positioning, clamp widths, rotations (8deg / -12deg), pointer-events: none, z-index: 0 and verify brushes appear in corners (CSS gradient fallback)
- [ ] 5.3 Create `packages/ui/src/components/decorative/OrganicLines.tsx` rendering inline SVG with `stroke: var(--color-ink); fill: none; stroke-width: 1.5;` and verify lines render
- [ ] 5.4 Create `packages/ui/src/components/decorative/DottedConnector.tsx` rendering `.dotted-connector` (border-left/border-bottom 4px dotted var(--color-ink)) and verify L-shaped dotted line appears
- [ ] 5.5 Create `packages/ui/src/components/decorative/MapPin.tsx` with clamp(40px, 6vw, 88px) circle, white background, centered MarkNeq, box-shadow and verify pin renders
- [ ] 5.6 Export all decorative components from `packages/ui/src/components/decorative/index.ts` and verify imports work in test component

## 6. Layout Primitives

- [ ] 6.1 Create `packages/ui/src/styles/layout.css` with `.container` (min(100% - var(--gutter)*2, var(--container)), margin-inline: auto), `.section` (padding-block: var(--space-6), position: relative, overflow: hidden) and verify spacing matches guide
- [ ] 6.2 Add `.hero` (min-height: 100svh, display: grid, place-items: center, position: relative, overflow: hidden) and `.info-block` (text-align: right, display: grid, gap: .25rem, justify-items: end) with mobile override (`@media (max-width: 768px) { .info-block { text-align: left; justify-items: start; } }`) to `layout.css` and verify hero fills viewport, info-block aligns right on desktop/left on mobile
- [ ] 6.3 Add `.split` utility for two-column (grid-template-columns: 1fr 1fr) stacking on mobile to `layout.css` and verify split layout works
- [ ] 6.4 Create `packages/ui/src/components/layout/Container.tsx`, `Section.tsx`, `Hero.tsx`, `InfoBlock.tsx`, `Split.tsx` as thin wrappers applying corresponding CSS classes and verify components render with correct classes
- [ ] 6.5 Export layout components from `packages/ui/src/components/layout/index.ts` and verify imports work

## 7. UI Components (Core)

- [ ] 7.1 Create `packages/ui/src/styles/components.css` with `.btn` base (sharp corners, uppercase, bold, 2px border, transition), `.btn--primary` (bg var(--color-red), white text, hover bg var(--color-red-dark), transform translateY(-2px)), `.btn--outline` (transparent, border var(--color-ink), hover bg var(--color-ink) color var(--color-paper)), focus-visible outline (3px solid var(--color-red), offset 3px) and verify buttons render correctly
- [ ] 7.2 Add `.input`, `.select` base (sharp corners, 2px solid var(--color-ink), focus ring 3px solid var(--color-red), error state border var(--color-red)), `.label` (uppercase, --font-display, weight 600) to `components.css` and verify form controls render correctly
- [ ] 7.3 Add `.card` (bg var(--color-paper-light), 2px solid var(--color-ink), sharp corners, padding var(--space-3)), `.card__tag` (var(--color-red), weight 700, uppercase) to `components.css` and verify card renders
- [ ] 7.4 Add `.alert` (sharp corners, 2px solid var(--color-ink), bg var(--color-paper), text var(--color-text), red accent border-left for errors) to `components.css` and verify alert renders
- [ ] 7.5 Add `.pill` (sharp corners, uppercase, tracking-wide, weight 700, variants: default/red/green/amber) to `components.css` and verify pills render
- [ ] 7.6 Add `.nav` (links: uppercase, --font-display weight 600, letter-spacing 0.08em, color var(--color-ink), hover/active: 3px red underline animated) to `components.css` and verify nav renders
- [ ] 7.7 Add `.step-indicator` (track: var(--color-ink) 1px, progress: var(--color-red), circles: numbered, active filled var(--color-red)) to `components.css` and verify step indicator renders
- [ ] 7.8 Create React wrappers in `packages/ui/src/components/ui/`: `Button.tsx`, `Input.tsx`, `Select.tsx`, `Card.tsx`, `Alert.tsx`, `Pill.tsx`, `Nav.tsx`, `StepIndicator.tsx`, `CheckboxGroup.tsx` applying CSS classes and handling accessibility (aria, focus) and verify each component works in isolation

## 8. Motion & Accessibility Styles

- [ ] 8.1 Create `packages/ui/src/styles/motion.css` with `@keyframes` for: `neq-enter` (scale 1.2→1, rotate 10deg→0, opacity 0→1, 400ms cubic-bezier), `stack-stagger` (translateY 20px→0, opacity 0→1, stagger 80ms), `brush-fade` (opacity 0→1, 800ms) and verify animations play on mount
- [ ] 8.2 Add `@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }` to `motion.css` and verify animations disable when OS setting enabled
- [ ] 8.3 Create `packages/ui/src/styles/a11y.css` with focus-visible utilities, skip-link styles, sr-only utility and verify focus rings appear on keyboard navigation

## 9. Panel App Refactor

- [ ] 9.1 Replace `apps/panel/src/components/ui.tsx` components with imports from `@convencion/ui/components/ui` (Button, Input, Select, Card, Alert, Pill, Nav, StepIndicator) and verify no TypeScript errors
- [ ] 9.2 Update `apps/panel/src/App.tsx` Login form to use design system Input, Button (primary), Card container, MarkNeq watermark and verify login screen matches design
- [ ] 9.3 Update `apps/panel/src/App.tsx` Header to use design system Nav (with red underline active), Pill for connection indicator, MarkNeq in logo area and verify header matches design
- [ ] 9.4 Refactor `apps/panel/src/vistas/Dashboard.tsx` to use Container, Section, Card, Pill, Button from design system and verify dashboard renders with new styling
- [ ] 9.5 Refactor `apps/panel/src/vistas/Pagos.tsx` to use design system components (Table/Card/Button/Pill) and verify pagos screen matches design
- [ ] 9.6 Refactor `apps/panel/src/vistas/Equipos.tsx` to use design system components and verify equipos screen matches design
- [ ] 9.7 Refactor `apps/panel/src/vistas/Checkin.tsx` to use design system components (Hero/Section for scan area, Button, Pill, Card) and verify checkin screen matches design
- [ ] 9.8 Refactor `apps/panel/src/vistas/RegistroInsitu.tsx` to use design system form components (Input, Select, Button, Card, StepIndicator) and verify in-situ registration matches design
- [ ] 9.9 Update `apps/panel/vite.config.ts` PWA manifest: `theme_color: "#0A0A0A"`, `background_color: "#EDEDED"` and verify manifest.json output
- [ ] 9.10 Replace `apps/panel/public/favicon.svg` with ≠ symbol on white circle (inline SVG) and verify favicon appears in browser tab

## 10. Registro App Refactor

- [ ] 10.1 Create `apps/registro/src/components/` mirroring panel structure (or import from @convencion/ui) and verify imports work
- [ ] 10.2 Refactor `apps/registro/src/App.tsx` welcome screen: replace with `<Hero>`, stacked headlines (`.stack` with alternating `.t-outline`/`.t-solid` "MUY PRONTO"), `.hero__neq` overlay, Brush corners, design system Button and verify hero matches guide Art 1
- [ ] 10.3 Refactor step indicator in `App.tsx` to use `<StepIndicator>` design component with red progress, black track and verify step indicator matches design
- [ ] 10.4 Refactor all form steps (identidad, ubicacion, asistencia, contacto) to use design system Input, Select, CheckboxGroup, Button, Card, Alert with sharp corners, black labels, red focus and verify each step renders correctly
- [ ] 10.5 Refactor comprobante step to use design system upload zone (dashed border, paper bg, sharp corners), Button, Alert and verify step renders correctly
- [ ] 10.6 Refactor confirmation screen: centered Card with paper-light bg, black border, QR prominent, design system Button (primary for share, outline for new registration), semantic `<time>` elements for dates and verify confirmation matches design
- [ ] 10.7 Add `.paper-noise` class to registro root element for texture fallback and verify texture appears
- [ ] 10.8 Update `apps/registro/vite.config.ts` if adding PWA (optional — match panel manifest colors) and verify build succeeds

## 11. Integration Verification & Polish

- [ ] 11.1 Run `pnpm typecheck` in root and verify zero TypeScript errors across all packages
- [ ] 11.2 Run `pnpm build` for both apps and verify production builds succeed without errors
- [ ] 11.3 Start both dev servers (`pnpm dev:panel`, `pnpm dev:registro`), navigate all screens, and visually verify design matches guide (colors, typography, spacing, decorative elements)
- [ ] 11.4 Test dark mode: apply `.theme-dark` to `<html>` in dev tools, verify both apps adapt correctly (colors invert, contrast maintained)
- [ ] 11.5 Test reduced motion: enable OS "Reduce motion", verify all animations disabled in both apps
- [ ] 11.6 Run accessibility audit (axe-core or browser dev tools) on key screens (login, registration wizard, dashboard, checkin) and verify no critical violations
- [ ] 11.7 Test responsive breakpoints (480, 768, 1024, 1280px) in browser dev tools, verify layouts adapt correctly (hero 16:9, info-block alignment, split stacking)
- [ ] 11.8 Verify WCAG contrast: use browser dev tools color picker on text/background combinations, confirm black-on-paper ≥17:1, red-on-paper ≥4.5:1 (large text only), white-on-red ≥5:1
- [ ] 11.9 Document any visual discrepancies from guide in a `DESIGN_NOTES.md` for designer review and verify file exists

## 12. Asset Integration (When Designer Assets Arrive)

- [ ] 12.1 Replace `/public/assets/paper-texture.png` in both apps with designer 512×512 tileable PNG and verify texture renders
- [ ] 12.2 Replace MarkNeq inline SVG with designer `neq-red.svg` (update `background-image` in `.mark-neq`) and verify ≠ symbol matches art
- [ ] 12.3 Replace Brush CSS gradients with designer watercolor brush PNG/WebP assets (2-3 variants) and verify brushes match art
- [ ] 12.4 Replace OrganicLines inline SVG with designer organic line SVGs and verify lines match art
- [ ] 12.5 Replace MapPin map SVG with designer Honduras region map SVG (departments, white stroke) and verify map renders
- [ ] 12.6 If original fonts licensed: download OTF/WOFF2, add to `packages/ui/public/fonts/`, update `tokens.css` @font-face, remove Google Fonts import, and verify fonts load without layout shift