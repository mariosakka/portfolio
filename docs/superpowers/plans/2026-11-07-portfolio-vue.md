# Portfolio Vue Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Night-garden Vue 3 portfolio as a static site on GitHub Pages at `mohamad-mario-sakka.com`, with JSON content, self-hosted images, and animated flowers/vines.

**Architecture:** One-page Vite + Vue 3 SPA (no router). Content is imported from `src/data/*.json` at build time. The animated art lives in `src/garden/` as self-contained components (scoped plain CSS, no Tailwind, no app imports) so it can later move to an npm package. The latest commit is injected at build time via a Vite `define`.

**Tech Stack:** Vue 3, Vite, Tailwind CSS 3 (app only), Vitest + @vue/test-utils + jsdom, ESLint, sharp (image script), `@fontsource` fonts, GitHub Actions + Pages.

**Spec:** `docs/superpowers/specs/2026-11-07-portfolio-vue-design.md`

## Global Constraints

- Plain JavaScript, no TypeScript. Vue 3 `<script setup>`. Node 24.
- Vite `base: '/'`. Domain `mohamad-mario-sakka.com` lives only in `public/CNAME`.
- Live Firestore field names (listed in the spec) are kept; list fields are arrays only.
- No Firebase, no backend, no runtime network calls, no fonts from Google at runtime (bundle via `@fontsource`).
- Fonts: Newsreader (headlines), Instrument Sans (body/nav). Colors: navy gradient `#040818` -> `#0b1f4a`, accent blue `#4f8bff`, light text `#e4edff`.
- Sections in order: About, Experience, Projects, Education, Certificates, Organizations, Contact.
- `src/garden/` must not import from outside itself and must not use Tailwind classes.
- Animations respect `prefers-reduced-motion` (render fully grown). Content is readable with animation disabled or JS animation failing.
- Do not commit `docs/reference/firestore-export/`. Every task ends with `npm run lint && npm test` green and a commit that ends with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Item with an empty list, empty `liveUrl`/`githubUrl`, or `longDescription` of `"aaaa"`: card renders without broken links or empty chips; placeholder warning appears in the check script.
2. `isPresent: true` with empty `endDate`: period shows "Present", never "undefined" or an empty range.
3. A project category with no projects, or only one category: filter still works and shows no dead "empty" tab.
4. Modal: Escape closes it, focus returns to the opener, background does not scroll, long text scrolls inside on a 360px-wide phone.
5. No git available at build time (shallow clone, tarball): commit widget degrades to hidden, build still succeeds.

## Parallel Schedule (subagents, one git worktree each, merged by an integrator)

- **Wave 1:** Task 1 alone (everything depends on it).
- **Wave 2 (parallel):** Task 2 -> Task 3 (one agent, sequential), Task 4, Task 5, Task 7, Task 8. They own disjoint files. Shared files touched only by the integrator at merge: `src/App.vue` (Task 4 owns it; Task 7 edits `AboutSection.vue` and `vite.config.js` only after Wave 3 merge to avoid conflicts, so its About edit is applied in Wave 3).
- **Wave 3:** Task 6 (needs 2, 4, 5), then apply Task 7's About edit.
- **Wave 4:** Task 9 (needs 4, 6, 8).
- **Wave 5:** Task 10 (deploy); the Task 3 image download must finish before the Firebase project is deleted.

---

### Task 1: App scaffold, tooling and CI

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `eslint.config.js`, `tailwind.config.js`, `postcss.config.js`, `src/main.js`, `src/App.vue`, `src/style.css`, `src/App.test.js`
- Modify: `.github/workflows/ci.yml`, `.githooks/pre-push`, `README.md`, `.github/dependabot.yml` (add `npm`)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `lint`, `test` (`vitest run`); Tailwind theme colors `night.950 #040818`, `night.800 #0b1f4a`, `accent #4f8bff`, `ink #e4edff`; font families `font-serif` (Newsreader), `font-sans` (Instrument Sans) loaded in `src/main.js` via `@fontsource/newsreader` and `@fontsource/instrument-sans` imports.

- [ ] **Step 1: Write the failing test** `src/App.test.js`: mounting `App` renders an element with `id="app-root"` and the text `Mohamad-Mario Sakka` (hardcoded until Task 4 replaces it).
- [ ] **Step 2: Run** `npm test` -> FAIL (no project yet).
- [ ] **Step 3: Scaffold** the Vite + Vue 3 project files above with the dependencies in Tech Stack; `vite.config.js` sets `base: '/'` and vitest `environment: 'jsdom'`; implement `App.vue` minimal to pass.
- [ ] **Step 4: Run** `npm run lint && npm test && npm run build` -> all pass.
- [ ] **Step 5: CI/hook** — add `setup-node` (pinned SHA `49933ea5288caeca8642d1e84afbd3f7d6820020`, Node 24, npm cache), `npm ci`, lint, test, build steps to `ci.yml`; add lint + test to `.githooks/pre-push`; document commands in README tool table.
- [ ] **Step 6: Commit** `feat: scaffold Vue app with lint, test and CI`

### Task 2: Data conversion and schema checks

**Files:**
- Create: `scripts/build-data.mjs`, `src/lib/normalize.js`, `src/lib/normalize.test.js`, `src/data/{about,experience,projects,education,certificates,organizations}.json`, `src/data/data.test.js`
- Modify: README tool table

**Interfaces:**
- Produces: `toList(value: string | string[] | null | undefined): string[]` (splits strings on unescaped commas, honors `\,`, trims, drops empties); `formatPeriod(start: string, end: string, isPresent: boolean): string` returning e.g. `Sep 2025 - Present` using month-year (`en-US`, `Intl.DateTimeFormat`); JSON files exposing the live field names with `id` kept, all list fields as arrays, `image`/`photo` as local paths `/img/<name>.webp` (set in Task 3).

- [ ] **Step 1: Write failing tests** in `normalize.test.js`: `toList("React, Node.js, C\\, C++")` equals `["React","Node.js","C, C++"]`; `toList(["a"," b "])` equals `["a","b"]`; `toList(null)` equals `[]`; `formatPeriod("2025-09-29","",true)` equals `"Sep 2025 - Present"`; `formatPeriod("2018-09-03","2022-07-20",false)` equals `"Sep 2018 - Jul 2022"`; `formatPeriod("","",false)` equals `""`.
- [ ] **Step 2: Run** `npm test` -> FAIL.
- [ ] **Step 3: Implement** both functions in `src/lib/normalize.js`.
- [ ] **Step 4: Write failing `data.test.js`**: each data file exists; arrays contain items with a non-empty `title`/`name`/`degree`/`company`-style primary field per spec; every list field is an array; no value contains `firebasestorage.googleapis.com`; `about.json` has `fullName`, `role`, `codeSample` (unused; code panel removed), `contact.methods` with types Email, GitHub, Phone, LinkedIn.
- [ ] **Step 5: Implement `scripts/build-data.mjs`**: reads `docs/reference/firestore-export/*.json`, applies `toList` to list fields, strips Storage URLs (leaves `image` as `/img/<basename of imageFileName>.webp`), writes the six files with 2-space indent. Run it once and commit the output.
- [ ] **Step 6: Run** tests -> PASS. **Commit** `feat: convert exported content to normalized JSON`

### Task 3: Images

**Files:**
- Create: `scripts/fetch-images.mjs`, `public/img/*.webp`, `src/data/images.test.js`

**Interfaces:**
- Consumes: Task 2 JSON `image`/`photo` paths.
- Produces: `public/img/<name>.webp` for every referenced path; project/card images max 960px wide, profile photo max 600px wide, quality 80.

- [ ] **Step 1: Write failing `images.test.js`**: every `image`/`photo` path in `src/data/*.json` points to an existing file under `public/`; no file in `public/img` exceeds 250 KB.
- [ ] **Step 2: Run** -> FAIL.
- [ ] **Step 3: Implement `scripts/fetch-images.mjs`**: reads original Storage URLs from `docs/reference/firestore-export/*.json` (local only), downloads, resizes with sharp, writes webp. Run it **before the Firebase project is deleted**; commit the images.
- [ ] **Step 4: Run** tests -> PASS. **Commit** `feat: self-host optimized images`

### Task 4: Layout, theme and navigation

**Files:**
- Create: `src/components/SiteNav.vue`, `src/components/SectionBlock.vue`, `src/components/SiteNav.test.js`
- Modify: `src/App.vue`, `src/style.css`

**Interfaces:**
- Produces: `<SectionBlock id title>` (slot, serif heading, anchor id); `<SiteNav :sections="[{id,label}]">` sticky, renders one `<a href="#id">` per section and highlights the one in view; `App.vue` renders the seven sections in the Global Constraints order with empty bodies for now.

- [ ] **Step 1: Write failing test**: `SiteNav` with 3 sections renders 3 links whose `href` are `#id`; `App` renders seven `section` elements with ids `about, experience, projects, education, certificates, organizations, contact`.
- [ ] **Step 2: Run** -> FAIL. **Step 3: Implement** both components, navy gradient body, mobile nav (links scroll horizontally, no hamburger). **Step 4:** tests PASS. **Step 5: Commit** `feat: page layout, theme and nav`

### Task 5: Generic card and detail modal

**Files:**
- Create: `src/components/ItemCard.vue`, `src/components/DetailModal.vue`, `src/components/ItemCard.test.js`, `src/components/DetailModal.test.js`

**Interfaces:**
- Produces: `<ItemCard :image :title :subtitle :period :tags="string[]" :links="{label,url}[]" @open>`; omits image/period/tags/links when empty and never renders a link with an empty `url`. `<DetailModal :open :title @close>` (slot): `role="dialog" aria-modal="true"`, closes on Escape and backdrop click, locks body scroll while open, returns focus to the previously focused element on close.

- [ ] **Step 1: Write failing tests**: card with `links=[{label:'Live',url:''}]` renders no anchor; card with empty `tags` renders no chip list; modal emits `close` on Escape; modal restores focus to the opener; body gets `overflow: hidden` while open and loses it after close.
- [ ] **Step 2-4:** run FAIL, implement, run PASS. **Step 5: Commit** `feat: item card and detail modal`

### Task 6: Content sections

**Files:**
- Create: `src/components/sections/{About,Experience,Projects,Education,Certificates,Organizations,Contact}Section.vue`, `src/components/sections/sections.test.js`
- Modify: `src/App.vue`

**Interfaces:**
- Consumes: Task 2 JSON, Task 5 components, `formatPeriod`.
- Produces: each section component takes no props and reads its JSON. `ProjectsSection` shows a category filter built from the distinct `category` values plus `All`, ordered by first appearance; it hides categories with no items. Contact lists methods as links: Email `mailto:`, Phone `tel:`, GitHub `https://github.com/<value>`, LinkedIn `https://www.linkedin.com/in/<value>`. (The code-sample panel was removed from About at the owner's request.)

- [ ] **Step 1: Write failing tests**: Projects renders 9 cards under `All` and only that category's cards after clicking a filter; the filter list contains exactly `All, Web, Embedded, Games, App, Algorithms`; Experience item with `isPresent` shows `Present`; Contact renders four links with the `href`s above.
- [ ] **Step 2-4:** FAIL, implement, PASS (open modal with `longDescription` from each card). **Step 5: Commit** `feat: content sections`

### Task 7: Build-time latest commit

**Files:**
- Create: `src/lib/commit.js`, `src/lib/commit.test.js`, `src/components/CommitBadge.vue`
- Modify: `vite.config.js`, `src/components/sections/AboutSection.vue`

**Interfaces:**
- Produces: `readCommit(env: Record<string,string|undefined>, gitLog: () => string): { message: string, sha: string } | null` (uses `GITHUB_SHA` plus `COMMIT_MESSAGE`, both passed from the workflow; falls back to `gitLog()` output `"<sha> <message>"`; returns `null` on any failure). `vite.config.js` defines `__LATEST_COMMIT__` as the JSON of that result. `<CommitBadge>` renders nothing when it is `null`.

- [ ] **Step 1: Write failing tests**: env with `COMMIT_MESSAGE` and `GITHUB_SHA` returns `{message, sha: first 7}`; env empty with `gitLog` returning `"abc1234 fix nav"` returns `{message:'fix nav', sha:'abc1234'}`; `gitLog` throwing returns `null`; multi-line messages are cut to the first line.
- [ ] **Step 2-4:** FAIL, implement, PASS; `npm run build` passes with and without a `.git` folder (run once with `GIT_DIR=/nonexistent`). **Step 5: Commit** `feat: build-time latest commit badge`

### Task 8: Garden art components

**Files:**
- Create: `src/garden/{Bloom,Cornflower,Bud,Leaf,Vine}.vue`, `src/garden/useGrow.js`, `src/garden/garden.css`, `src/garden/index.js`, `src/garden/garden.test.js`, `src/garden/README.md`

**Interfaces:**
- Produces: `useGrow(el: Ref<HTMLElement|null>, opts?: { once?: boolean, threshold?: number }): Ref<boolean>` returning `true` once the element has entered the viewport (immediately `true` when `prefers-reduced-motion: reduce` matches or `IntersectionObserver` is missing). Components take `grown?: boolean` (default controlled by `useGrow`), `size?: number`, `delay?: number` (ms). `Vine` takes `path: string` (SVG path `d`) and draws it with `stroke-dashoffset` over `duration` ms (default 2400), with `<slot>` positions for `Leaf`/`Bloom`/`Bud` children revealed in order. Blooms open by scaling petals from 0 and rotating outward, then sway gently; art is copied from `docs/reference/mockups/night-garden-fonts.html`.

- [ ] **Step 1: Write failing tests**: `useGrow` returns `true` immediately when `matchMedia('(prefers-reduced-motion: reduce)').matches`; returns `false` until a mocked `IntersectionObserver` reports intersecting, then `true`, and with `once: true` stays `true` after leaving; `Vine` renders its `path` and sets class `is-grown` only after growth; `garden/` files contain no `import` from outside `src/garden` and no `tw-`/Tailwind utility class strings (grep test).
- [ ] **Step 2-4:** FAIL, implement, PASS. Keep `Vine.vue` readable with the animation disabled (the path is visible in static CSS when `.is-static` is set). **Step 5: Commit** `feat: animated garden components`

### Task 9: Place the garden

**Files:**
- Modify: `src/App.vue`, `src/components/SectionBlock.vue`, `src/components/sections/AboutSection.vue`, `src/components/sections/ProjectsSection.vue`
- Create: `src/components/GardenHero.vue`, `src/components/GardenHero.test.js`

**Interfaces:**
- Consumes: Task 8 exports from `src/garden/index.js`.
- Produces: `GardenHero` places the main left-edge vine and blooms behind the About intro (ported from the approved mockup), a small bottom-right vine, a vine that draws under each `SectionBlock` heading when the heading enters view, and one `Bud` that opens on each project card entering view.

- [ ] **Step 1: Write failing test**: with reduced motion matched, `GardenHero` renders with every vine class `is-grown` and all text still present; text content of the hero is identical with and without garden components.
- [ ] **Step 2-4:** FAIL, implement, PASS. **Step 5:** run `npm run dev`, check at 360px, 768px and 1280px widths that text never overlaps flowers in a way that hurts reading and the page has no horizontal scroll; **commit** `feat: place animated garden on the page`

### Task 10: Deploy to GitHub Pages and cutover checks

**Files:**
- Create: `public/CNAME` (content `mohamad-mario-sakka.com`), `.github/workflows/deploy.yml`, `scripts/check-placeholders.mjs`, `scripts/check-placeholders.test.js`
- Modify: `README.md`, `.github/workflows/ci.yml`

**Interfaces:**
- Produces: `check-placeholders.mjs` exits 0 and prints warnings (never fails) for any string value equal to `aaaa`, `lorem`, empty `longDescription`, or empty `image`; `deploy.yml` on push to `main`: checkout, setup-node, `npm ci`, lint, test, build with `COMMIT_MESSAGE`/`GITHUB_SHA` set from the event, `configure-pages`, `upload-pages-artifact` (`dist`), `deploy-pages`, with job permissions `pages: write`, `id-token: write`, `contents: read`, environment `github-pages`, pinned SHAs: configure-pages `983d7736d9b0ae728b81ab479565c72886d7745b`, upload-pages-artifact `56afc609e74202658d3ffba0e8f6dda462b719fa`, deploy-pages `d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e`.

- [ ] **Step 1: Write failing test** for the placeholder script: given fixture JSON containing `"longDescription": "aaaa"`, it reports one warning for that path and exit code 0.
- [ ] **Step 2-4:** FAIL, implement, PASS. **Step 5:** add `public/CNAME` and `deploy.yml`; run `npm run build` and confirm `dist/CNAME` exists.
- [ ] **Step 6: Commit, push to `main`; watch** `gh run watch` until CI and deploy are green; open `https://mariosakka.github.io/portfolio/` is **not** expected to work before DNS (assets use `/`); verify after Step 7.
- [ ] **Step 7: Owner cutover (manual, in this order):** (a) repo Settings -> Pages -> Source: GitHub Actions; (b) Namecheap Advanced DNS: delete parking records, add four `A` records `@` to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and `CNAME www` to `mariosakka.github.io`; (c) Pages -> Custom domain `mohamad-mario-sakka.com`, wait for the certificate, enable Enforce HTTPS; (d) verify `https://mohamad-mario-sakka.com` and the `www` redirect load the new site and every image loads; (e) only then delete the Firebase project (Hosting, Firestore, Storage).
- [ ] **Step 8:** update README with final commands and deploy notes; **commit** `docs: deployment and cutover notes`

### Out of scope here (next project)

Extract `src/garden/` to the npm package repo, publish, and swap the portfolio over to the published package.
