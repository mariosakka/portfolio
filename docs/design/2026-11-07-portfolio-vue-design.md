# Portfolio rebuild in Vue: design

Owner: Mohamad-Mario Sakka (GitHub: `mariosakka`). Date: 2026-11-07.

## Intent and why

The current portfolio (https://github.com/mariosakka/mms-portfolio, React + Firebase, live at mms-portfolio.web.app) is being replaced because the owner wants: a cleaner look, no admin page, and to stop paying for / depending on Google Cloud. The new site is a **static Vue 3 app hosted on GitHub Pages** on the owner's Namecheap domain. Content lives in JSON files in the repo; editing content = edit JSON, push.

A second, later project (separate repo, **out of scope here**) will extract the animated flower/vine components into an npm package. This project must build them so they can be lifted out cleanly.

## Goals

- Vue 3 + Vite site, one long page, deployed to GitHub Pages by GitHub Actions on push to `main`.
- Custom domain `mohamad-mario-sakka.com` (bare domain canonical, `www` redirects). The owner may switch to a shorter name (e.g. `mariosakka.com`); keep the domain in one place (`public/CNAME` plus Pages setting) so switching is trivial.
- Content in JSON, keeping the **live Firestore field names** (not the placeholder `portfolioData.json` in the old repo). The owner's real data has been exported once (9 projects, 4 certificates, 2 experience, 2 education, 1 organization, 1 `about-me` doc); the builder must re-run that export (read-only REST, database ID `mms-portfolio`, project `mms-portfolio`, no credentials needed, as the old site reads publicly) because the export currently only exists in a scratch folder.
- All images re-hosted in the repo (old ones are Firebase Storage URLs that die when the Firebase project is deleted). Download before the Firebase project is deleted; optimize (webp, sensible sizes).
- Visual direction **"Night garden"**: one flat very dark navy (#060a18) on html and body (no gradient; owner feedback 2026-11-07: "I wanted the background to stay dark throughout, or make the colors less bright"), muted accent (#7b9bd9), low-contrast card surfaces (rgba(140,170,230,.06)) and 15% blue borders, luminous blue detailed flowers and teal vines at the edges, a faint static CSS-only night sky (37 dots in one 640px tile, repeated horizontally on a viewport-fixed `body::before` covering the top 55svh with a mask fading it out downward, so the stars stay at the top while content scrolls over them). Headlines in a serif (Newsreader), body/nav in a sans (Instrument Sans), as free stand-ins for claude.ai's typography. Fonts bundled in the repo, not loaded from Google at runtime. Mockup reference: `.superpowers/brainstorm/.../night-garden-fonts.html` (kept in the owner's scratch folder; the SVG flower definitions in it are the starting art).
- Flowers/vines **animate**: vines draw themselves along their path, leaves and tendrils appear as the stem passes, buds open into blooms, idle sway. Hero animates on load; other sections animate when scrolled into view; vines can trace along section headings. `prefers-reduced-motion` shows everything already grown.
- Garden placement (owner feedback 2026-11-07: "I dont want the vines to grow continuously vertically on the left side, I want them to appear spontaneously from cards or around cards, and I want different types of arrangements ... and I want more flowers to grow"): no page-tall vines (the left, right and hairline edge page vines are removed). Art grows out of and around cards, photos and headings with the `Sprouts` overlay: six seeded arrangements (corners, edge, wrap, hang, climb, burst; `auto` varies them between neighbouring cards), about 3-4, 6-9 or 10-14 flowers per card by density, all species and a few more muted blue/violet/pale hues. Sprouts emerge out of sync a moment after the card appears (`visible` trigger, or `active` for carousel slides) and stay grown. The art stays in a ring around the parent and never covers its content (at most 8px over the border). The section heading vine stays.
- Sections in order (owner reorder 2026-11-07): About, Experience, Organizations, Education, Certificates, Projects, Skills, Contact; the sticky nav and the footer follow the same `sections` array in `App.vue`. Sticky nav scrolls to sections.
- One screen per section (owner request 2026-11-07: "carousels ... shorter in height", "every section to fit in the middle of the screen without overflowing"): each section is at least `--section-h` tall (`100svh` minus the measured sticky nav, `--nav-h`) with its content vertically centered, and every section's content fits that budget from 1920x1080 down to 1280x720 and on 390x844, 375x667 and 360x740 phones. Cards shrink by height tier (`short` <= 800px, `xshort` <= 700px tall: smaller padding and titles, fewer description lines, about two rows of chips plus a "+k" chip, a 20-24svh image band on phones); the full text and every chip stay in the Read more dialog. Nav links center a fitting section (smooth, instant under reduced motion), set the hash and focus the heading; plain `#id` anchors still work without JS. Below about 600px of viewport height sections overflow and scroll normally by design. No page scroll-snap.
- Layout (owner request 2026-11-07: "more original with hero cards instead of small cards ... we could even have carousels", "remove the skills from the top section, we could have a different part for that"): no grid of small cards. Each item is a large image-led `HeroCard` (big framed image on a blurred wash so square logos and portrait shots are never cropped, serif title, eyebrow and period, chips, labelled link buttons, Read more opens the detail modal). Projects: category filter above a native scroll-snap `Carousel` (peeking next slide, arrows, dots, `n / N`, arrow keys, swipe, no autoplay). Experience and Education: carousels of split hero cards like Projects (two stacked cards could not share one screen at a readable size; a side-by-side pair would squeeze the split card into two narrow columns). Organizations: one split hero card. Certificates: carousel of medium cards, two per row on desktop. Contact: one large panel with the email as the main call-to-action. Skills moved out of About into their own section (large pills, no levels or categories), now placed just before Contact.
- Keep one extra from the old site: the **latest-commit widget** (shows the newest commit message of the portfolio repo). The commit is fetched **at build time** (GitHub API in the build step, no runtime calls, no rate limits) and baked into the page.
- Projects are filterable/grouped by `category` (values seen: Web, Embedded, Games, App, Algorithms).
- Animated components (`Vine`, `Bloom`, grow-on-scroll) live in their own folder with no dependency on the rest of the app, so they can be moved to the npm package later.

## Non-goals

- No admin page, login, Firebase, Firestore, or any backend.
- No contact form or form service: Contact section just lists the methods (email, GitHub, phone, LinkedIn) as links.
- No CMS, no i18n, no blog.
- Publishing the npm package (separate project, later).

## Anti-goals

- Old Firebase hosting keeps working until the new site is live on the domain; do not delete the Firebase project or its Storage before images are downloaded and verified.
- Not a template-looking dark theme: the botanical art is the point. Flat, undetailed flowers were rejected.
- No animation that traps users: must respect reduced motion; text must be readable and content visible even if JS animation fails.

## Constraints

- GitHub Pages is static only. SPA with a single page needs no router; if a router is added, it needs hash mode or a 404 fallback.
- Repo lives at `C:\Users\mmspe\Documents\my-portfolio` (currently empty, not yet a git repo). Owner intends to set it up with the repo-foundations skill (structure, tests, CI, hooks, docs).
- HTTPS enforced via GitHub Pages (free certificate; can take up to ~1h after DNS).
- DNS (owner does this in Namecheap Advanced DNS, after deleting parking records): four `A` records `@` to 185.199.108.153 / .109.153 / .110.153 / .111.153; optional matching `AAAA`; `CNAME www` to `mariosakka.github.io`. Repo contains `public/CNAME` with the domain; Pages settings: custom domain + Enforce HTTPS.
- The contact data includes a phone number and email that are already public on the old site; carry them over unchanged.

## Decisions made by the owner

- Vue (3) instead of React; JSON files with the old schemas; GitHub Pages; Namecheap domain `mohamad-mario-sakka.com`.
- Fresh visual direction: Night garden, more detailed flowers, Claude-style serif+sans typography.
- Animated flowers prototyped inside the portfolio first, then extracted to an npm package in a separate repo later.
- Keep the commit widget (commit fetched at build time). The code-sample panel was removed from About at the owner's request.

## Builder's calls (the owner has not decided these; flag for review)

- Vite + Vue 3, TypeScript (adopted at the owner's request on 2026-11-07, replacing the original plain-JavaScript call; `strict`, `vue-tsc` type check, scripts run natively as `.ts` on Node 24), Tailwind CSS 3 carried over from the old site.
- Single page, no router.
- Arrays normalized: old data mixed comma-separated strings (with `\,` escapes) and arrays for `technologies`/`skills`; the new JSON uses arrays only.
- Data loaded by direct JSON import at build time (no fetch at runtime).
- Placeholder fields like `longDescription: "aaaa"` get cleaned up by the owner in the JSON; builder should flag them, not guess replacements.

## Reference material (in this repo)

- `docs/reference/firestore-export/*.json` (local only, gitignored: tokenized image URLs and personal data): the real data, exported 2026-11-07 (Firebase project was still live and publicly readable). `docs/reference/export-firestore.mjs` re-runs it (`node export-firestore.mjs`, no credentials; writes to `./export`). Image fields are Firebase Storage URLs (`image`, `photo`) with the storage path in `imageFileName` / `photoFileName`; each item has **one** image.
- `docs/reference/mockups/night-garden-fonts.html`: the approved hero mockup with the SVG flower/vine/leaf/bud definitions to adapt. `visual-direction-v3-botanical.html` shows the rejected siblings (for context only).

### Live field names (use these)

- `about-me` (single object): `fullName`, `preferredName`, `role`, `location`, `languages[]`, `skills[]`, `description`, `welcomeMessage`, `photo`/`photoFileName`, `codeSample` (unused; the code panel was removed), `repositoryPath`, `commitMessage` (stale; replaced by build-time commit), `contact{title, subtitle, methods[{id,type,value}]}` with types Email, GitHub, Phone, LinkedIn.
- `projects` (9): `title`, `role`, `teamType`, `category`, `shortDescription`, `description`, `longDescription`, `technologies[]`, `githubUrl`, `liveUrl`, `socialMedia[]`, `image`/`imageFileName`.
- `experience` (2): `title`, `company`, `location`, `startDate`, `endDate`, `isPresent`, `shortDescription`, `longDescription`, `technologies[]`, `websiteUrl`, `image`.
- `education` (2): `degree`, `fieldOfStudy`, `department`, `institution`, `location`, `startDate`, `endDate`, `isPresent`, `gpa`, `subjects`, `description`, `shortDescription`, `longDescription`, `websiteUrl`, `socialMedia[]`, `image`.
- `certificates` (4): `title`, `issuer`, `credentialId`, `credentialUrl`, `skills`, `shortDescription`, `longDescription`, `image`.
- `organizations` (1): `name`, `role`, `location`, `startDate`, `endDate`, `isPresent`, `description`, `shortDescription`, `longDescription`, `websiteUrl`, `socialUrl`, `socialMedia[]`, `image`.

Each item gets a hero card (short description + image) whose Read more opens a detail modal (long description, falling back to description, then short description); the old site used small cards the same way.

## More builder's calls (from the pre-handoff review; owner can override)

- GitHub repo: owner `mariosakka`, name `portfolio` (the old `mms-portfolio` stays untouched). Because the custom domain serves from `/`, Vite `base` is `/`. Before DNS is live the project URL `mariosakka.github.io/portfolio/` would break asset paths, so verify on the custom domain, or temporarily build with `--base=/portfolio/`.
- Commit widget: shows the commit that triggered the build, taken from the Actions context (`github.sha` message), not the GitHub API; falls back to the last local `git log -1` in dev. It points at the new repo.
- Images: one-off script (sharp) converts the downloaded originals to webp at sensible widths; the converted files are committed.
- Placeholder text (e.g. `"aaaa"`): a check script **warns** but does not block deploy; owner cleans up the JSON.
- Tests: unit tests for the data normalization and a JSON schema check on every data file, plus a build smoke test in CI. No visual or animation tests.
- The animated-components folder uses scoped plain CSS only (no Tailwind) so it can move to the npm package unchanged.

## Left to the builder

Component breakdown, file layout, animation implementation (CSS/SVG stroke-dash and transforms vs a small library; prefer no dependency), image pipeline, lint/test setup, exact card and modal designs, responsive breakpoints, and the Actions workflow details.
