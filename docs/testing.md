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
- Drift and contract: covered by `src/garden` (folder rule) and `scripts/check-test-sync.mjs`.
- Domain-specific (garden animation): covered by `src/garden` (reduced motion), real animation is manual.

### Unit (lib)
- Run: `npm test` (Vitest). Lives in `src/lib/*.test.js` and `scripts/*.test.js`.
- Protects: pure helpers (`normalize`, `commit`) and the tooling scripts (`check-placeholders`, `check-test-sync`).

### Component
- Run: `npm test` (Vue Test Utils + jsdom). Lives in `src/App.test.js`, `src/components/**/*.test.js`.
- Protects: section rendering, filtering, nav, modal open/close and focus trap, commit badge.

### Data integrity
- Run: `npm test`. Lives in `src/data/data.test.js` and `src/data/images.test.js`.
- Protects: JSON shape per file, primary fields, every referenced image exists in `public/img`, each image file is under 250 KB.
- Soft check: `node scripts/check-placeholders.mjs` warns (never fails) on `aaa`/`lorem` values and empty fields; known cases are in [known-issues.md](known-issues.md).

### Accessibility
- Automated (jsdom; `DetailModal.test.js`, `sections.test.js`, `GardenHero.test.js`): roles, aria attributes, focus move/trap, keyboard handling.
- Manual: jsdom has no layout, contrast or screen reader. A real-browser a11y pass (keyboard tour, contrast, zoom) is part of the release check below. Owner: repo owner.

### Build smoke
- Run: `npm run build`; the CI `checks` job and `deploy.yml` both build. `public/CNAME` is copied to `dist/CNAME` by Vite (static public dir). That the file lands in `dist/` and the domain resolves is checked manually after deploy, not by a CI assertion.

### Drift / contract
- Garden folder rule ("flower components stay dependency-free and Tailwind-free"): a grep-style test in `src/garden/garden.test.js`.
- Test-sync guard: `scripts/check-test-sync.mjs` fails when `src/` code changes without a `*.test.js` change, when a deleted source leaves a same-named test, or when a test is deleted alone. Bypass with a commit trailer `Tests-Not-Applicable: <reason>` or env `TEST_SYNC_BYPASS=<reason>`; dependabot commits are exempt. Its logic is unit-tested in `scripts/check-test-sync.test.js`.
- Agent instruction files: `scripts/check_agent_instructions.py .`.
- Test index: N/A. Layers are listed above by directory and discovery is `npm test`; a hand-kept per-file index would only go stale.

### Security
- Gitleaks: CI (`gitleaks-action`, also the weekly full-history schedule) and the pre-push hook (`gitleaks git`). A missing scanner fails the hook with install instructions. No allowlist exists; add one only with owner, reason and expiry.

### End-to-end / visual (manual)
- Manual release check, owner: repo owner. Before a release, build locally and take Playwright screenshots at 390, 1100 and 1440 px wide; check hero garden, nav, each section, the modal and keyboard tab order. Automating this is not justified for a personal site (flaky pixel diffs).
- Real iPhone check, owner: repo owner. Open the deployed site in Safari on a real iPhone and look at: (1) modal height: open a card with the toolbar expanded and collapsed, the whole dialog and its close button stay visible and long content scrolls inside it; (2) scroll lock: the page behind the open modal does not move, and closing it returns to the same scroll position; (3) notch and landscape: rotate to landscape, text, nav and modal are not under the notch or home bar; (4) nav scroll: the section strip swipes sideways with no scrollbar and fades at the right edge; (5) tap targets: nav links, project filters, cards, card links, contact links and the modal close button are easy to hit, with no double-tap zoom delay. Playwright WebKit screenshots (iPhone device descriptor) are only an approximation of iOS Safari, not a replacement for this check.

### Performance
- N/A: static site on GitHub Pages, no backend or heavy computation. The one cheap guard is the 250 KB per-image test in `images.test.js`. Revisit if Lighthouse scores regress.

### Domain-specific (garden animation)
- Tests cover the reduced-motion path (`prefers-reduced-motion` renders fully grown, `is-static` mode) and visibility logic in `src/garden/garden.test.js` and `GardenHero.test.js`.
- The real animation (timing, smoothness, real-browser reduced-motion setting) is a manual release check. See [known-issues.md](known-issues.md).

### Other foundation areas (N/A)
- API contracts, localization catalogs, database migrations, release versioning: there is no API, content is single-language JSON, there is no database, and the site deploys continuously from `main`.

## Enforcement matrix

| Rule | CI | Hook (pre-push) | Notes |
|---|---|---|---|
| Secret scanning | `ci.yml` gitleaks-action (+ weekly schedule) | `gitleaks git` | hook fails if gitleaks is missing |
| Lint | `ci.yml` `npm run lint` | yes | `--max-warnings 0` |
| Tests | `ci.yml` `npm test` | yes | includes data, image size, garden rule |
| Build | `ci.yml` `npm run build`, `deploy.yml` | no (slow) | |
| Placeholder check | `ci.yml`, `deploy.yml` (non-blocking) | no | warns only |
| Shebang exec bits (100755) | `ci.yml` step | no | scans `scripts/` and `.githooks/` |
| Agent-instruction check | `ci.yml` step | yes | |
| Test-sync guard | `ci.yml` step | yes | needs `fetch-depth: 0` (set) |
| Pinned action SHAs | none (convention: every `uses:` is a 40-char SHA) | no | manual review; dependabot bumps them |
| Dependabot | `.github/dependabot.yml` (npm and github-actions, weekly) | n/a | no auto-merge; owner reviews PRs |

Manual-review rules (not deterministically checkable): real-browser a11y and reduced-motion, visual check at 390/1100/1440, `dist/CNAME` and domain after deploy, content quality (placeholders), pinned-SHA review, reviewing dependabot PRs, secrets or the Firestore export beyond what gitleaks detects.
