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
| No test asserts anything about the commit badge inside About | Weak test | low | open | code | none | next release pass |
| About lacks an array guard for languages, Skills for skills | Robustness | low | open | code | none | next release pass |
| Carousel dot buttons are 28px wide (44px tall) so nine dots fit a 360px phone; below the 44px tap-target width | Slightly harder dot taps on touch; swipe and the 44px arrows cover it | low | accepted | code | swipe or arrows | next release pass |
| Single-project filters (Games, Algorithms) show one 84%-wide slide with empty space on its right | Cosmetic | low | open | code | none | next release pass |
| Exec-bit CI check misses odd filenames | Only unusual script names | low | open | code | avoid spaces in script names | next release pass |
