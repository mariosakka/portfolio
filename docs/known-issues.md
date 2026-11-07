# Known issues

Owner "repo owner" = content or manual checks; "code" = a future code task. Next review: the next release pass unless stated.

| Issue | Impact | Severity | Status | Owner | Workaround | Next review |
|---|---|---|---|---|---|---|
| Placeholder text in content: experience[1].description "aaa", RecipeGPT longDescription "aaaa", organization longDescription "Nothing( Long) ", many empty longDescription | Visitors see junk or empty detail text | medium | open | repo owner | `node scripts/check-placeholders.ts` lists them; edit `src/data/*.json` | next content edit |
| Two job logos possibly identical (both 4514 bytes) | Wrong logo on one job | low | open | repo owner | Compare `public/img/job-image_*.webp` visually | next content edit |
| Stray `isCurrent` in experience data; image widths unasserted | Unused field, no width guard | low | open | code | none needed | next release pass |
| Per-project art and garden sprouts verified only visually at 390/1100/1440 | Regressions at other widths go unnoticed | low | accepted | repo owner | Manual screenshot check (see testing.md) | each release |
| No real-browser reduced-motion check | jsdom mocks `matchMedia`; real behavior unverified | low | open | repo owner | Toggle OS reduced-motion and view the hero | next release pass |
| Nav highlight lags when two sections change in one observer callback; highlight untested (jsdom) | Brief wrong highlight | low | open | code | none | next release pass |
| Git-fallback SHA may exceed 7 chars (use `--abbrev=7` or slice); `eslint.config.js` stray double space | Cosmetic | low | open | code | none | next release pass |
| Garden: `garden.css:47` dead selector, stale header comment, no Cornflower static-inheritance test, `matchMedia` read once, tall Vine threshold | Minor dead code and an untested edge | low | open | code | none | next release pass |
| Null link entry in data (was an `ItemCard` crash) | None now: `HeroCard` skips null, empty and non-string urls (`HeroCard.test.ts`) | low | resolved | code | none | none |
| Per-card garden bud on project cards removed with the old small cards (owner OK: the garden system covers decoration) | Less decoration on cards | low | changed | repo owner | none | none |
| No test asserts anything about the commit badge inside About | Weak test | low | open | code | none | next release pass |
| About lacks an array guard for languages, Skills for skills | Robustness | low | open | code | none | next release pass |
| Carousel counts reachable scroll stops, not slides: with two certificates in view the last two share the end stop, so 4 certificates show 3 dots and "n / 3" on desktop (4 on phones) | Intended; each Next moves the view | low | accepted | code | none | none |
| Carousel dots are hidden below 640px wide (the counter, 44px arrows and swipe remain) so the controls take one row; on wider touch screens the dots are 28px wide (44px tall) | Small dot targets on tablets only | low | accepted | code | swipe or arrows | next release pass |
| Sections fit one screen only down to about 600px of viewport height (phones in landscape, very short windows); below that they overflow and scroll normally | Expected; nothing is clipped | low | accepted | code | none | none |
| On short phones (<= 800px tall, < 640px wide) card chips are hidden to fit the screen; the full chip list is in Read more | Less at a glance on small phones | low | accepted | code | open Read more | none |
| Exec-bit CI check misses odd filenames | Only unusual script names | low | open | code | avoid spaces in script names | next release pass |
| Garden: `Sprouts` is not mounted on the real sections yet; integration goes through `src/components/CardGarden.vue` after the layout branch merges | No garden art on cards until then (only the heading vines) | medium | open | code | none | integration pass |
| Garden: `Sprouts` art overflows its parent by `reach` px; an ancestor with `overflow: hidden/auto` cuts it, and a card near the viewport edge can cause horizontal scroll unless an ancestor has `overflow-x: clip` | Clipped art or sideways scroll | medium | open | code | keep `reach` px free around cards and `overflow-x: clip` on the app root (see src/garden/README.md) | integration pass |
| Garden: flower glows (faint gradient, 1.35x the petal radius) can tint a few px further into a card than the 8px border allowance; card text overflowing its box can be covered | Faint tint near card edges | low | accepted | code | keep card content inside the box | next garden pass |
| Garden: with many cards visible at once growth queues (at most 40 plants grow at a time, a card takes about 4-6s), so on a dense screen the last cards start several seconds late | Late sprouts on dense screens | low | accepted | code | raise `MAX_GROWING_PLANTS` in `registry.ts` | next garden pass |
| Garden: `burst` sprouts are short at the default reach (40px) and flowers stay small next to large cards; flower size scales only with `reach` | Sparse look on big cards | low | open | repo owner | pass a larger `reach` or `density` 3 | next garden pass |
| Garden: growth cost measured only in headless Chromium (about 400 to 1600 SVG nodes per card, one shared rAF loop that stops when growth ends, no CSS animations unless `sway`), not on a real GPU or iOS Safari | Real-device smoothness unverified | medium | open | repo owner | check on a real phone (see testing.md) | next release pass |
| Garden: spray (branches) plants overlap their side flowers a bit | Slightly cluttered clusters | low | accepted | code | lower `branches` or `size` on the plant | next release pass |
| Garden: the no-JS case cannot apply (the app is client-rendered, with JS off nothing renders); reduced motion renders the fully grown final state and is the supported static path | None | low | accepted | code | none | none |
| Release PRs are created with the default `GITHUB_TOKEN`, which does not trigger workflows, so CI does not run on them | No automated checks on release PRs | low | accepted | repo owner | They only change version and changelog: read the diff, then merge manually. Later: use a PAT or GitHub App token secret in `release-please.yml` | next release pass |
| Footer version is the `package.json` version at build time; it only changes when a release PR is merged | Footer can lag behind unreleased commits | low | accepted | code | none | none |
