# Tasks

## 1. Shared UI Package Setup

- [x] 1.1 Resolve the shared icons export: either create `packages/ui/src/components/icons` with the icons required by the design system or remove the dead exports from `package.json`, then verify every declared export resolves
- [x] 1.2 Create `packages/ui/package.json` with name `@convencion/ui`, type module, exports for styles and components, peerDependencies on react/react-dom, and verify `pnpm install` succeeds
- [x] 1.3 Add `@convencion/ui` as workspace dependency to both `apps/panel/package.json` and `apps/registro/package.json` and verify `pnpm install` resolves correctly

## 2. Design Tokens (CSS Custom Properties)

- [x] 2.1 Create `packages/ui/src/styles/tokens.css` with all color tokens (--color-paper, --color-ink, --color-red variants, semantic aliases) and verify custom properties are defined
- [x] 2.2 Add typography tokens (--font-display, --font-fine, --font-script, --font-body, --fs-hero through --fs-small) to `tokens.css` and verify clamp() values match guide
- [x] 2.3 Add spacing/layout tokens (--container, --gutter, --space-1 through --space-6, --radius: 0) to `tokens.css` and verify values
- [x] 2.4 Create `packages/ui/src/styles/base.css` with token import, Google Fonts loading, body reset, and verify no console errors on import
- [x] 2.5 Update `apps/panel/src/index.css` to import the shared design-system styles and verify the dev server starts without CSS errors
- [x] 2.6 Update `apps/registro/src/index.css` with the shared design-system imports and verify the dev server starts without CSS errors
- [x] 2.7 Replace or validate the self-referential `@theme` token mappings and add a smoke check that Tailwind generates usable `bg-bg`, `text-text`, and `font-display` utilities

## 3. Typography System

- [x] 3.1 Add a verification page or automated check that renders all typography utilities, including the currently unexercised `.t-fade`, `.t-date`, and `.t-script`, and confirms they match the guide
- [x] 3.2 Add `.stack` component with `display: grid; line-height: 0.9;` and `.stack > span { display: block; }` to `typography.css` and verify stacked headlines alternate solid/outline with tight leading
- [x] 3.3 Add `@supports not (-webkit-text-stroke: 1px #000)` fallback for `.t-outline` in `typography.css` and verify fallback renders solid text in unsupported browsers
- [x] 3.4 Add Google Fonts preconnect and stylesheet links to both apps and verify fonts load in the Network tab

## 4. Background & Texture System

- [x] 4.1 Create `packages/ui/src/styles/background.css` with paper background, radial glow, and `.paper-noise::before` fallback and verify the texture appears on page load
- [x] 4.2 Implement dark-mode token overrides in `tokens.css` plus any required background rules in `background.css`, and verify toggling `.theme-dark` changes the palette
- [x] 4.3 Create the 1×1 transparent `/public/assets/paper-texture.png` placeholder in both apps and verify there are no 404 errors

## 5. Decorative Components

- [x] 5.1 Add the missing `.mark-neq` and `.hero__neq` sizing/positioning rules, keep the SVG square, and verify default, login, header, and registration usages render at intentional dimensions
- [x] 5.2 Add the missing `.brush`, `.brush--tr`, and `.brush--bl` sizing, offset, rotation, and fallback rules, then verify brushes are visible in the registration hero
- [x] 5.3 Create `packages/ui/src/components/decorative/OrganicLines.tsx` rendering the required inline SVG and verify lines render
- [x] 5.4 Create `packages/ui/src/components/decorative/DottedConnector.tsx` rendering the L-shaped 4px dotted ink line and verify it renders
- [x] 5.5 Create `packages/ui/src/components/decorative/MapPin.tsx` with the required responsive circle, white background, centered MarkNeq, and shadow, and verify it renders
- [x] 5.6 Export all decorative components from `packages/ui/src/components/decorative/index.ts` and verify imports resolve

## 6. Layout Primitives

- [x] 6.1 Create `packages/ui/src/styles/layout.css` with token-based `.container` and responsive `.section` spacing, position, and overflow behavior
- [x] 6.2 Add responsive `.hero` and `.info-block` behavior to `layout.css` and verify hero sizing and alignment across mobile and desktop
- [x] 6.3 Fix the `.split` cascade so the mobile single-column rule wins below 768px, and verify the layout stacks correctly
- [x] 6.4 Create `packages/ui/src/components/layout/Container.tsx`, `Section.tsx`, `Hero.tsx`, `InfoBlock.tsx`, `Split.tsx` as thin wrappers and verify they render with the correct classes
- [x] 6.5 Export layout components from `packages/ui/src/components/layout/index.ts` and verify imports work

## 7. UI Components (Core)

- [x] 7.1 Move Button size-specific spacing into the design-system CSS tokens/classes and verify small, default, and large variants keep appropriate touch targets
- [x] 7.2 Add `.input`, `.select`, and `.label` styles with the agreed border-based focus and error states, and verify form controls render correctly
- [x] 7.3 Add `.card` and `.card__tag` styles with sharp corners, paper-light background, and red tag accent
- [x] 7.4 Add `.alert` styles with a full variant-colored 2px border and variant background, and verify alerts render
- [x] 7.5 Add `.pill` styles with the four variants and verify pills render
- [x] 7.6 Move Nav active and hover states into `components.css` targeting the rendered buttons, remove dead anchor-only rules, and verify horizontal and vertical navigation
- [x] 7.7 Add the 5px `.step-indicator` track, red progress, and numbered circles, and verify the indicator renders
- [x] 7.8 Create the shared React wrappers including `DayPicker`, apply their CSS classes, and verify accessibility behavior in isolation

## 8. Motion & Accessibility Styles

- [x] 8.1 Create `packages/ui/src/styles/motion.css` with the required entrance keyframes and verify animations play
- [x] 8.2 Add reduced-motion overrides that disable animations and transitions, and verify they apply when the OS preference matches
- [x] 8.3 Finish `a11y.css` semantics: stop globally hiding visible elements through `[aria-hidden="true"]`, keep decorative SVGs visually available, and either wire or remove the unused skip-link utility

## 9. Panel App Refactor

- [x] 9.1 Remove the unused legacy `apps/panel/src/componentes/ui.tsx` and verify no imports reference it
- [x] 9.2 Update the panel login to use design-system Input, Button, Card, and MarkNeq
- [x] 9.3 Update the panel shell to use the persistent desktop sidebar, mobile bottom bar, Pill connection indicator, and MarkNeq logo
- [x] 9.4 Update `Dashboard.tsx` to use the shared Container and Section components instead of raw layout classes, then verify the view
- [x] 9.5 Update `Pagos.tsx` to use Pill for payment status and remove the obsolete Table expectation from this task, then verify the view
- [x] 9.6 Refactor `Equipos.tsx` to use design-system components and verify the view
- [x] 9.7 Update `Checkin.tsx` to use the shared Container and Section primitives with the approved card-based scanning layout; Hero is intentionally omitted inside the panel shell
- [x] 9.8 Refactor `RegistroInsitu.tsx` to use design-system form components including DayPicker
- [x] 9.9 Update the panel PWA manifest theme and background colors and verify the generated manifest
- [x] 9.10 Provide the panel favicon and verify it appears in the browser tab

## 10. Registro App Refactor

- [x] 10.1 Import the shared UI components into the registration app and verify imports work
- [x] 10.2 Refactor the welcome screen to use the mobile-compact Hero, stacked headlines, decorative MarkNeq, Brush corners, and design-system Button
- [x] 10.3 Refactor the step indicator to use the shared StepIndicator component
- [x] 10.4 Refactor all form steps to use design-system controls and DayPicker while preserving validation
- [x] 10.5 Refactor the receipt step to use the design-system upload treatment, Button, and Alert
- [x] 10.6 Add semantic `<time>` elements for the event date range to the confirmation screen, or revise the requirement if dates are intentionally omitted, and verify the chosen behavior
- [x] 10.7 Add `.paper-noise` to the registration root and verify the texture appears

## 11. Integration Verification & Polish

- [x] 11.1 Run `pnpm typecheck` in root and verify zero TypeScript errors across all packages
- [x] 11.2 Run production builds for both apps and verify they succeed
- [x] 11.3 Start both dev servers, navigate all screens, and visually verify the design against the guide
- [x] 11.4 Test dark mode by applying `.theme-dark` and verifying colors and contrast
- [x] 11.5 Test reduced motion with the OS preference enabled and verify all animations are disabled
- [x] 11.6 Run an accessibility audit on login, registration wizard, dashboard, and check-in
- [x] 11.7 Test the 480, 768, 1024, and 1280px breakpoints and verify responsive behavior
- [x] 11.8 Verify the documented contrast thresholds through `pnpm verify:design`: ink/paper ≥16.9, red/paper ≥4.4 for large text or UI, white/red ≥5, and white/ink ≥19
- [x] 11.9 Create `DESIGN_NOTES.md` with any remaining visual discrepancies for designer review

## 12. Asset Integration (Blocked on Designer Delivery)

- [ ] 12.1 Blocked: replace the placeholder texture with the designer 512×512 tileable PNG
- [ ] 12.2 Blocked: replace MarkNeq fallback art with the designer `neq-red.svg`
- [ ] 12.3 Blocked: replace brush fallbacks with designer watercolor PNG/WebP assets
- [ ] 12.4 Blocked: replace organic-line fallbacks with designer SVG assets
- [ ] 12.5 Blocked: define and integrate the designer Honduras map SVG and MapPin usage
- [ ] 12.6 Blocked: self-host licensed OTF/WOFF2 fonts and remove the Google Fonts dependency if licensing becomes available

## 13. Responsive Shell and Calendar Follow-up

- [x] 13.1 Register `packages/ui/src` with Tailwind v4 `@source` in both app entry stylesheets so shared component utilities are generated
- [x] 13.2 Add orientation support to the shared Nav and render the panel with a desktop sidebar and a mobile bottom bar with safe-area compensation
- [x] 13.3 Add mobile layout overrides so Section uses compact spacing and Hero sizes to its content below 768px
- [x] 13.4 Add the shared calendar-style DayPicker and migrate both the public registration wizard and in-situ panel registration while preserving day codes and validation
- [x] 13.5 Compact the DayPicker inside the registration app at 480px and below
- [x] 13.6 Disable document scrolling in the mobile registration shell, keep only main scrollable, respect safe areas and the software keyboard, and restore normal flow for printing
- [x] 13.7 Restore the design-system container gutter in the registration app despite Tailwind's same-named utility
- [x] 13.8 Apply the agreed component styling: border-based input/select focus, full variant-colored Alert borders, and a 5px StepIndicator track
- [x] 13.9 Raise the `--fs-eyebrow` mobile minimum to 1.25rem while keeping the current `.t-eyebrow` rendering unchanged
- [x] 13.10 Run root typecheck and production builds for both apps
- [x] 13.11 Repair the OpenSpec delta structure and pass `openspec validate apply-design-system-19-convencion --strict`
