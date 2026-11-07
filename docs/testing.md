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
- Protects: pure helpers (`normalize`, `commit`) and the tooling scripts (`check-placeholders`, `check-test-sync`).

### Component
- Run: `npm test` (Vue Test Utils + jsdom). Lives in `src/App.test.ts`, `src/components/**/*.test.ts`.
- Protects: section rendering and order (including Skills after About), filtering, carousel (slides, dots, prev/next ends, arrow keys, settled native scroll), hero card links/fallbacks, nav, modal open/close and focus trap, commit badge.

### Data integrity
- Run: `npm test`. Lives in `src/data/data.test.ts` and `src/data/images.test.ts`.
- Protects: JSON shape per file, primary fields, every referenced image exists in `public/img`, each image file is under 250 KB.
- Soft check: `node scripts/check-placeholders.ts` warns (never fails) on `aaa`/`lorem` values and empty fields; known cases are in [known-issues.md](known-issues.md).

### Accessibility
- Automated (jsdom; `DetailModal.test.ts`, `Carousel.test.ts`, `HeroCard.test.ts`, `sections.test.ts`, `GardenHero.test.ts`): roles, aria attributes, focus move/trap, keyboard handling.
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
- Manual release check, owner: repo owner. Before a release, build locally and take Playwright screenshots at 390, 1100 and 1440 px wide; check hero garden, nav, each section, the modal and keyboard tab order; in the Projects and Certificates carousels check arrows, dots, arrow keys and a swipe, and that the page never scrolls sideways. Automating this is not justified for a personal site (flaky pixel diffs).
- Viewport-fit matrix (manual release check, owner: repo owner): jsdom has no layout, so tests only assert the classes and the nav scroll logic with stubbed heights. Before a release run `docs/reference/measure-fit.mjs` against `npm run build && npx vite preview` from a temp folder outside the repo with Playwright installed there (instructions at the top of the file). It clicks every nav link at 1920x1080, 1440x900, 1366x768, 1280x720, 1024x768, 390x844, 375x667 and 360x740 and prints a table: whether each section's content fits between the nav and the bottom of the screen (px spare or over) and whether it is centered within 24px. Every cell must say yes; viewports under about 600px tall overflow by design.
- Real iPhone check, owner: repo owner. Open the deployed site in Safari on a real iPhone and look at: (1) modal height: open a card with the toolbar expanded and collapsed, the whole dialog and its close button stay visible and long content scrolls inside it; (2) scroll lock: the page behind the open modal does not move, and closing it returns to the same scroll position; (3) notch and landscape: rotate to landscape, text, nav and modal are not under the notch or home bar; (4) nav scroll: the section strip swipes sideways with no scrollbar and fades at the right edge; (5) tap targets: nav links, project filters, carousel arrows and dots, card link buttons and Read more, contact links and the modal close button are easy to hit, with no double-tap zoom delay. Playwright WebKit screenshots (iPhone device descriptor) are only an approximation of iOS Safari, not a replacement for this check.

### Performance
- N/A: static site on GitHub Pages, no backend or heavy computation. The one cheap guard is the 250 KB per-image test in `images.test.ts`. Revisit if Lighthouse scores regress.

### Domain-specific (garden animation)
- Tests cover the reduced-motion path (`prefers-reduced-motion` renders fully grown, `is-static` mode) and visibility logic in `src/garden/garden.test.ts` and `GardenHero.test.ts`.
- Also covered: seeded flower and plant generation, anchoring (flower base equals stem end, axis follows the tangent, leaf bases on the path), the 0..1 growth-phase mapping (pollen only after petals open) and scroll-to-progress mapping, all in `src/garden/garden.test.ts`. `garden-demo.html` (dev only) renders plants at any progress for manual frame checks.
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
