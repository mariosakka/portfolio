# Known issues

Owner "repo owner" = content or manual checks; "code" = a future code task. Next review: the next release pass unless stated.

| Issue | Impact | Severity | Status | Owner | Workaround | Next review |
|---|---|---|---|---|---|---|
| Placeholder text in content: experience[1].description "aaa", RecipeGPT longDescription "aaaa", organization longDescription "Nothing( Long) ", many empty longDescription | Visitors see junk or empty detail text | medium | open | repo owner | `node scripts/check-placeholders.ts` lists them; edit `src/data/*.json` | next content edit |
| Two job logos possibly identical (both 4514 bytes) | Wrong logo on one job | low | open | repo owner | Compare `public/img/job-image_*.webp` visually | next content edit |
| Stray `isCurrent` in experience data; image widths unasserted | Unused field, no width guard | low | open | code | none needed | next release pass |
| Per-project/hero art verified only visually at 390/1100/1440 | Regressions at other widths go unnoticed | low | accepted | repo owner | Manual screenshot check (see testing.md) | each release |
| No real-browser reduced-motion check | jsdom mocks `matchMedia`; real behavior unverified | low | open | repo owner | Toggle OS reduced-motion and view the hero | next release pass |
| Nav highlight lags when two sections change in one observer callback; highlight untested (jsdom) | Brief wrong highlight | low | open | code | none | next release pass |
| Git-fallback SHA may exceed 7 chars (use `--abbrev=7` or slice); `eslint.config.js` stray double space | Cosmetic | low | open | code | none | next release pass |
| Garden: `garden.css:47` dead selector, stale header comment, no Cornflower static-inheritance test, `matchMedia` read once, tall Vine threshold | Minor dead code and an untested edge | low | open | code | none | next release pass |
| `ItemCard.vue:14` throws on a null link entry; hidden-input and ItemCard tests are guards, not red tests | Crash if data has a null link | low | open | code | keep data free of null links | next release pass |
| `first` helper duplicated in 5 sections (move to `lib/normalize`); "commit badge slot" test asserts nothing about the badge | Maintainability, weak test | low | open | code | none | next release pass |
| About lacks array guards for skills/languages; filter buttons need a visible focus style (CodePanel was removed, so its `<pre>` tabindex item is moot) | Keyboard a11y and robustness | medium | open | code | none | next release pass |
| Exec-bit CI check misses odd filenames | Only unusual script names | low | open | code | avoid spaces in script names | next release pass |
| Garden: the right page vine fades in at the top (CSS mask) but can still show a short leafless stub there before the scrolling tip reaches its first plant | Cosmetic | low | accepted | code | none | next release pass |
| Garden: spray (branches) plants overlap their side flowers a bit | Slightly cluttered clusters | low | accepted | code | lower `branches` or `size` in `placeItems` | next release pass |
| Garden: the hairline edge vine (below 1400px) is barely visible on phones (16px strip, 50% opacity) | Little garden on small screens | low | accepted | repo owner | raise opacity in `GardenHero.vue` | next release pass |
| Garden: scroll and animation cost was measured only in headless software-rendered Chromium, not on a real GPU or iOS Safari | Real-device smoothness unverified | medium | open | repo owner | check on a real phone (see testing.md) | next release pass |
| Garden: the no-JS case cannot apply (the app is client-rendered, with JS off nothing renders); reduced motion renders the fully grown final state and is the supported static path | None | low | accepted | code | none | none |
