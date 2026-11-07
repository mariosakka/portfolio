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
- Sections in order (owner reorder 2026-11-07): About, Experience, Organizations, Education, Certificates, Projects, Skills, Contact; the sticky nav and the footer follow the same `sections` array in `App.vue`. Sticky nav scrolls to sections.
- One screen per section (owner request 2026-11-07: "carousels ... shorter in height", "every section to fit in the middle of the screen without overflowing"): each section is at least `--section-h` tall (`100svh` minus the measured sticky nav, `--nav-h`) with its content vertically centered, and every section's content fits that budget from 1920x1080 down to 1280x720 and on 390x844, 375x667 and 360x740 phones. Cards shrink by height tier (`short` <= 800px, `xshort` <= 700px tall: smaller padding and titles, fewer description lines, about two rows of chips plus a "+k" chip, a 20-24svh image band on phones); the full text and every chip stay in the Read more dialog. Nav links center a fitting section (smooth, instant under reduced motion), set the hash and focus the heading; plain `#id` anchors still work without JS. Below about 600px of viewport height sections overflow and scroll normally by design. No page scroll-snap.
- Layout (owner request 2026-11-07: "more original with hero cards instead of small cards ... we could even have carousels", "remove the skills from the top section, we could have a different part for that"): no grid of small cards; items are large image-led cards (serif title, eyebrow and period, chips, labelled link buttons, Read more opens the detail modal). Skills live in their own section just before Contact. The arrangement per section is below ("Section arrangements").
- Variety (owner feedback 2026-11-07, newest last: "I dont want only carousels it feels too monotonic, I want more types of transitions and animations", "different types of arrangements", "the thumbnails should not have in the background a blurred version of themselves"): every section has its own arrangement and its own entrance, and images sit cleanly in a framed media area (`MediaFrame`: flat dark `night-900` surface, thin border, rounded corners; no image-derived blur, wash or gradient, also not behind white logos). Logos are a contained tile; other images are cropped (`object-cover`) only when the image shape is within about 25% of the frame shape, else shown whole (`imageFit` in `src/lib/motion.ts`); certificate documents are always shown whole.
- Keep one extra from the old site: the **latest-commit widget** (shows the newest commit message of the portfolio repo). The commit is fetched **at build time** (GitHub API in the build step, no runtime calls, no rate limits) and baked into the page.
- Projects are filterable/grouped by `category` (values seen: Web, Embedded, Games, App, Algorithms).
- Animated components (`Vine`, `Bloom`, grow-on-scroll) live in their own folder with no dependency on the rest of the app, so they can be moved to the npm package later.

## Section arrangements

| Section | Arrangement | Selection / transition | Entrance |
|---|---|---|---|
| About | photo beside name and text (photo small beside the name on phones) | photo drifts slightly with scroll (parallax, `v-parallax`) | photo mask reveal rising from the bottom (`mask`), text lines stagger in (`stagger`) |
| Experience | timeline: period markers on a rail (vertical beside the detail card from md, a horizontal stepper above it on phones), `tablist`/`tab`/`tabpanel` | click or arrow keys (either orientation, wrapping) and Home/End select a role; the detail card swaps with a slide-up cross-fade (`<Transition name="swap" mode="out-in">`) | slide from the left (`slide`) |
| Organizations | one large spotlight card, split: text left, logo right | accent underline drawn under the title | clip-path wipe from the left (`wipe`), then the underline |
| Education | deck of offset, slightly rotated stacked cards, all in one grid cell (no layout shift); only the top card is exposed (`inert` + `aria-hidden` on the others) | Next (button, ArrowRight, or a drag/swipe either way past 60px or a fifth of the card) flies the top card out to the side and tucks it under the stack; Previous / ArrowLeft brings the last card back; `aria-live` names the top card | scale-in (`scale`) |
| Certificates | bento mosaic of every certificate at once: from md a 4x2 grid with the first certificate that has an image as a 2x2 tile, the rest sharing the other cells (`bentoSpan`); phones a 2-column grid whose first tile spans both columns when the count is odd; a certificate without an image is a monogram tile | a tile (whole-tile button) opens the shared detail dialog, which grows in; the credential link is a 44px icon on the tile and a button in the dialog | staggered pop-in (`stagger`) |
| Projects | category filter above a coverflow: native scroll-snap track, every slide snaps to the center; neighbors turn (rotateY), shrink, dim and slide toward the center | one rAF-throttled scroll handler writes each slide's pose (`coverflowFrame` of its distance from the center) as CSS variables, so the pose follows the finger or the smooth scroll; arrows, dots, counter, arrow keys and Home/End; a tap on a side slide centers it | fade-up (`fade-up`) |
| Skills | organic cluster of pills: three sizes in a repeating pattern and small vertical offsets (not a grid) | lift on hover / tap | staggered pop-in (`stagger`) |
| Contact | one large call-to-action panel; the email is a large framed button | the email leans toward a mouse pointer (magnet, `v-pointer:magnet`) | scale-in (`scale`) |

Card-like containers (hero cards, bento tiles, deck cards, spotlight, skills cluster, About photo frame, contact panel) are `position: relative`, do not clip, and hold an empty `CardGarden` seam (`src/components/CardGarden.vue`, props `seed`, `variant`, `density`, `active`) where the garden `<Sprouts>` overlay will be wired after the garden branch merges. They keep about 40px (phones 12px) of unclipped room: the only scrolling (so clipping) container is the coverflow track, whose 40px/12px block padding overlaps the filter and controls through negative margins (they sit above it, `z-10`; the track is `isolate`), and `main` clips only horizontally (`overflow-x: clip`) at the viewport edge.

## Transition vocabulary

- Only `transform`, `opacity` and `clip-path` animate. No `filter`/blur, no animated box-shadows, no fixed backgrounds; `will-change` is not used.
- Entrances (`v-reveal="variant"`, `src/lib/useMotion.ts`, looks in `src/style.css`): `fade-up`, `scale`, `slide`, `wipe` (clip-path from the left), `mask` (clip-path rising), `stagger` (children marked `data-stagger` with `--i` pop in 55ms apart). One shared `IntersectionObserver`; each section enters once. Content is visible by default: `data-enter="pending"` (hidden) is set only after the observer reported the element off screen, so with no observer or no report nothing is hidden, and a section already on screen at load is never hidden (no flash, transforms only so no layout shift). Clip variants clip the children, not the observed element (a fully clipped target would not report as intersecting), and end at `inset(-120px)` so card sprouts are not cut.
- Selection transitions: coverflow pose from scroll position (depth/rotate/scale), timeline slide-up cross-fade, deck fly-out-and-tuck, dialog grow-in, timeline marker dot scale, coverflow dot stretch.
- Pointer: card tilt (`v-pointer`, max about 3 degrees) and the Contact magnet (`v-pointer:magnet`) run only for a mouse-like fine pointer (`(hover: hover) and (pointer: fine)`), never for touch or pen, and write `--px`/`--py` at most once per frame.
- Parallax: the About photo drifts up to 14px with scroll (one passive scroll listener for all parallax images, one write per frame).
- Reduced motion: the directives do not observe or listen, the coverflow writes no pose, the deck settles at once, and `style.css` forces final states (`opacity: 1`, no transform, no clip-path, no transition) for every motion attribute, so all changes are instant.

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
