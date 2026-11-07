# Testing

Static Vue 3 site: no backend, so most risk is in content data, rendering and visual layout. CI (`.github/workflows/ci.yml`) is authoritative; `.githooks/pre-push` is a fast local subset and can be bypassed.

## Test layers

Decision per layer (details in the sections below):
- Unit: covered by `src/lib` and `scripts`.
- Integration: N/A: no backend or external service; component tests already mount real sections with real JSON data.
- UI, component and accessibility: covered by `src/components` (real-browser accessibility is manual).
- End-to-end and smoke: covered by the build in `.github/workflows/ci.yml`; browser end-to-end is a manual release check.
- Performance and load: N/A: static site on GitHub Pages, only an image-size test guards it.
- Security and data integrity: covered by `src/data` (data and images) and gitleaks in CI.
- Drift and contract: covered by `src/garden` (folder rule) and `scripts/check-test-sync.ts`.
- Domain-specific (garden animation): covered by `src/garden` (reduced motion), real animation is manual.

### Unit (lib)
- Run: `npm test` (Vitest). Lives in `src/lib/*.test.ts` and `scripts/*.test.ts` (scripts run as TypeScript on Node 24).
- Protects: pure helpers (`normalize`, `commit`, `motion`: image fit mode, coverflow pose from scroll offset, deck state machine and swipe threshold, timeline key stepping with wrap/clamp, reveal state, bento spans and monogram), the shared motion directives (`useMotion`: reveal never hides without an observer report or under reduced motion, pointer tilt only for a fine mouse pointer, parallax once per frame) and the tooling scripts (`check-placeholders`, `check-test-sync`).

### Component
- Run: `npm test` (Vue Test Utils + jsdom). Lives in `src/App.test.ts`, `src/components/**/*.test.ts`.
- Protects: section rendering from the imported JSON (counts are never hardcoded) and the owner's section order in nav and footer (`SiteNav.test.ts`); per arrangement: projects coverflow (filter, slides, dots, prev/next ends, arrow/Home/End keys, centering a side slide on click, pose variables written once per frame from the scroll position, settled native scroll, reduced motion), experience timeline (tablist/tab/tabpanel roles, roving tabindex, wrapping arrows and Home/End), education deck (top card only exposed, others `inert`, Next/Previous, arrow keys, drag threshold and swallowed click, instant settle under reduced motion, no empty fact labels), certificates bento (every tile, large tile, monogram tile for a missing image, dialog); data shapes the JSON does not have today, by mocking it (`sections.data-shapes.test.ts`: no items render nothing without throwing, 6-12 certificates render every tile and fill whole desktop rows, the timeline rail is vertical from md), organizations spotlight underline, skills cluster, About mask and stagger, Contact magnet CTA; every section declares an entrance and nothing is hidden without an observer report (`sections.test.ts`); the clean media frame without blurred backdrop (`MediaFrame.test.ts`, `HeroCard.test.ts`); nav, modal open/close and focus trap, commit badge.

### Data integrity
- Run: `npm test`. Lives in `src/data/data.test.ts` and `src/data/images.test.ts`.
- Protects: JSON shape per file, primary fields, every referenced image exists in `public/img`, each image file is under 250 KB.
- Soft check: `node scripts/check-placeholders.ts` warns (never fails) on `aaa`/`lorem` values and empty fields; known cases are in [known-issues.md](known-issues.md).

### Accessibility
- Automated (jsdom; `DetailModal.test.ts`, `Carousel.test.ts`, `HeroCard.test.ts`, `sections.test.ts`, `src/garden/garden.test.ts`): roles, aria attributes, focus move/trap, keyboard handling.
- Manual: jsdom has no layout, contrast or screen reader. A real-browser a11y pass (keyboard tour, contrast, zoom) is part of the release check below. Owner: repo owner.

### Build smoke
- Run: `npm run build`; the CI `checks` job and `deploy.yml` both build. `public/CNAME` is copied to `dist/CNAME` by Vite (static public dir). That the file lands in `dist/` and the domain resolves is checked manually after deploy, not by a CI assertion.

### Drift / contract
- Garden folder rule ("flower components stay dependency-free and Tailwind-free"): a grep-style test in `src/garden/garden.test.ts`.
- Test-sync guard: `scripts/check-test-sync.ts` fails when `src/` code changes without a `*.test.ts` change, when a deleted source leaves a same-named test (a `.js` to `.ts` rename counts as a conversion, not a deletion), or when a test is deleted alone. Bypass with a commit trailer `Tests-Not-Applicable: <reason>` or env `TEST_SYNC_BYPASS=<reason>`; dependabot commits are exempt. Its logic is unit-tested in `scripts/check-test-sync.test.ts`.
- Agent instruction files: `scripts/check_agent_instructions.py .`.
- Test index: N/A. Layers are listed above by directory and discovery is `npm test`; a hand-kept per-file index would only go stale.

### Security
- Gitleaks: CI (`gitleaks-action`, also the weekly full-history schedule) and the pre-push hook (`gitleaks git`). A missing scanner fails the hook with install instructions. No allowlist exists; add one only with owner, reason and expiry.

### End-to-end / visual (manual)
- Manual release check, owner: repo owner. Before a release, build locally and take Playwright screenshots at 390, 1100 and 1440 px wide; check the garden sprouts around cards, nav, each section, the modal and keyboard tab order; check the new widgets: the Projects coverflow (arrows, dots, arrow keys, a swipe, a click on a side slide), the Experience timeline (click, arrow keys), the Education deck (Next/Previous, arrow keys, a drag or swipe), a Certificates tile opening the dialog, and that the page never scrolls sideways. Then turn on the OS reduced-motion setting and check that every section shows its final state at once (no entrance, no coverflow pose, deck and timeline change instantly) and that nothing tilts or drifts. Automating this is not justified for a personal site (flaky pixel diffs).
- Viewport-fit matrix (manual release check, owner: repo owner): jsdom has no layout, so tests only assert the classes and the nav scroll logic with stubbed heights. Before a release run `docs/reference/measure-fit.mjs` against `npm run build && npx vite preview` from a temp folder outside the repo with Playwright installed there (instructions at the top of the file). It clicks every nav link at 1920x1080, 1440x900, 1366x768, 1280x720, 1024x768, 390x844, 375x667 and 360x740 and prints a table: whether each section's content fits between the nav and the bottom of the screen (px spare or over) and whether it is centered within 24px. Every cell must say yes; viewports under about 600px tall overflow by design. Run it again after any content change (longer text, more items): the arrangements scale with the data but the one-screen budget is tight on 375x667, and the Certificates bento fits only up to 8 certificates on desktop and 5 on phones (see known-issues).
- Real iPhone check, owner: repo owner. Open the deployed site in Safari on a real iPhone and look at: (1) modal height: open a card with the toolbar expanded and collapsed, the whole dialog and its close button stay visible and long content scrolls inside it; (2) scroll lock: the page behind the open modal does not move, and closing it returns to the same scroll position; (3) notch and landscape: rotate to landscape, text, nav and modal are not under the notch or home bar; (4) nav scroll: the section strip swipes sideways with no scrollbar and fades at the right edge; (5) tap targets: nav links, project filters, carousel arrows and dots, card link buttons and Read more, contact links and the modal close button are easy to hit, with no double-tap zoom delay. Playwright WebKit screenshots (iPhone device descriptor) are only an approximation of iOS Safari, not a replacement for this check.

### Performance
- N/A: static site on GitHub Pages, no backend or heavy computation. The one cheap guard is the 250 KB per-image test in `images.test.ts`. Revisit if Lighthouse scores regress.

### Domain-specific (garden animation)
- Tests cover the reduced-motion path (`prefers-reduced-motion` renders fully grown, `is-static` mode) and visibility logic in `src/garden/garden.test.ts`.
- `src/garden/sprouts.test.ts` covers `Sprouts`: geometric containment (no sampled vine, stem, leaf or flower point (glow included) deeper than 8px inside the parent, nor outside the reach ring, over all variants, densities, seeds 0..11 at the default reach (plus a few string seeds at other reaches) and sizes from 24x20 to 1200x900), determinism per seed, `auto` variety, flower, bud and leaf counts per density, staggered timing, bigger flowers and perimeter-scaled counts, burst branches always ending in a bloom, reach below 12, lazy render (no nodes before the trigger), shared defs, the viewport density cap, zero-size parents, debounced resizes, the visible/active/manual/static/reduced-motion state machine (no pollen at progress 0, the tall-parent fallback), the global per-plant cap, nearest-first queue order, a throwing grower, and unmount cleanup of observers, frames, queue slots and listeners. `garden-demo.html` shows every variant on mock cards for a manual visual check.
- `src/components/MediaFrame.test.ts` (`CardGarden`) checks that the seam renders a `Sprouts` overlay and passes seed, density, reach, variant and trigger through; `src/App.test.ts` checks that no page-tall vine exists and every overlay sits inside a positioned card.
- Also covered: seeded flower and plant generation, anchoring (flower base equals stem end, axis follows the tangent, leaf bases on the path), and the 0..1 growth-phase mapping (pollen only after petals open), all in `src/garden/garden.test.ts`. `garden-demo.html` (dev only) renders plants at any progress for manual frame checks.
- The real animation (timing, smoothness, real-browser reduced-motion setting) is a manual release check. See [known-issues.md](known-issues.md).

### Other foundation areas (N/A)
- API contracts, localization catalogs, database migrations, release versioning (beyond the Release Please drift test): there is no API, content is single-language JSON, there is no database, and the site deploys continuously from `main`.

## Enforcement matrix

| Rule | CI | Hook (pre-push) | Notes |
|---|---|---|---|
| Secret scanning | `ci.yml` gitleaks-action (+ weekly schedule) | `gitleaks git` | hook fails if gitleaks is missing |
| Type check | `ci.yml` and `deploy.yml` `npm run typecheck` | yes | `vue-tsc --build`, `strict`, covers app and node/scripts projects |
| Lint | `ci.yml` `npm run lint` | yes | `--max-warnings 0`, typescript-eslint |
| Tests | `ci.yml` `npm test` | yes | includes data, image size, garden rule, theme (flat html/body background, WCAG AA contrast of text tokens in `src/theme.test.ts`) |
| Build | `ci.yml` `npm run build`, `deploy.yml` | no (slow) | |
| Placeholder check | `ci.yml`, `deploy.yml` (non-blocking) | no | warns only |
| Shebang exec bits (100755) | `ci.yml` step | no | scans `scripts/` and `.githooks/` |
| Agent-instruction check | `ci.yml` step | yes | |
| Test-sync guard | `ci.yml` step | yes | needs `fetch-depth: 0` (set) |
| Release config drift | `ci.yml` `npm test` (`scripts/release-config.test.ts`) | yes | manifest equals package.json version, node release type, pinned release-please action is a 40-hex SHA with a `# v5.0.0` comment (format only, the SHA value is not checked; dependabot bumps it), job-level write permissions only |
| Release automation | `.github/workflows/release-please.yml` (push to `main`) | n/a | opens the release PR; Conventional Commits are not enforced (non-conforming commits are ignored) |
| Pinned action SHAs | none (convention: every `uses:` is a 40-char SHA) | no | manual review; dependabot bumps them |
| Dependabot | `.github/dependabot.yml` (npm and github-actions, weekly) | n/a | no auto-merge; owner reviews PRs |

Manual-review rules (not deterministically checkable): real-browser a11y and reduced-motion, visual check at 390/1100/1440, `dist/CNAME` and domain after deploy, content quality (placeholders), pinned-SHA review, reviewing dependabot PRs, secrets or the Firestore export beyond what gitleaks detects.
