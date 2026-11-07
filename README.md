# Portfolio

Mohamad-Mario Sakka's portfolio: static Vue 3 site on GitHub Pages. See the [design](docs/superpowers/specs/2026-11-07-portfolio-vue-design.md).

## Setup
Prerequisites: Node 24+, git, [gitleaks](https://github.com/gitleaks/gitleaks), Python 3.

    scripts/install-hooks.sh
    npm ci

## Developer tools
| Tool | Purpose | Run | CI |
|---|---|---|---|
| `scripts/install-hooks.sh` | enable the pre-push hook | `scripts/install-hooks.sh` | n/a |
| `npm run dev` / `npm run build` | Vite dev server / production build to `dist/` | `npm run dev` | `ci.yml` (build) |
| `npm run lint` | ESLint (flat config, eslint-plugin-vue) | `npm run lint` | `ci.yml` |
| `npm test` | Vitest + @vue/test-utils (jsdom) | `npm test` | `ci.yml` |
| `.githooks/pre-push` | secret scan + instruction-file check + lint + test | automatic on push | `ci.yml` (authoritative) |
| shebang scripts (rule: must be mode 100755) | `git update-index --chmod=+x <file>` | n/a | `ci.yml` |
| `scripts/check_agent_instructions.py` | CLAUDE.md length and links | `python scripts/check_agent_instructions.py .` | `ci.yml` |
| `scripts/check-test-sync.mjs` | fail when `src/` code changes without a test change (see [testing](docs/testing.md)) | `node scripts/check-test-sync.mjs [baseRef]` | `ci.yml`, `.githooks/pre-push` |
| `scripts/check-placeholders.mjs` | warn (never fail) on `aaa`/`aaaa`/`lorem` values and empty `longDescription`/`image` in `src/data/*.json` | `node scripts/check-placeholders.mjs [dir]` | `ci.yml`, `deploy.yml` (non-blocking) |
| `scripts/build-data.mjs` | convert the Firestore export to `src/data/*.json` | `node scripts/build-data.mjs [exportDir]` | none |
| `scripts/fetch-images.mjs` | download and optimize images to `public/img` (sharp, webp) | `node scripts/fetch-images.mjs [exportDir]` | none |
| `docs/reference/export-firestore.mjs` | one-off export of the old Firestore data | `node docs/reference/export-firestore.mjs` | none |

## Docs
- [Test strategy and enforcement matrix](docs/testing.md)
- [Known issues](docs/known-issues.md)

## Deploy
Push to `main` runs `.github/workflows/deploy.yml`: `npm ci`, lint, test, placeholder check, build (commit SHA and message are passed in as `GITHUB_SHA`/`COMMIT_MESSAGE`), then publishes `dist/` to GitHub Pages. `public/CNAME` ends up in `dist/` and sets the custom domain `mohamad-mario-sakka.com`.

One-time setup, in order: repo Settings -> Pages -> Source: GitHub Actions; DNS (below); Settings -> Pages -> Custom domain `mohamad-mario-sakka.com`, wait for the certificate, enable Enforce HTTPS.

### DNS (Namecheap Advanced DNS)
| Type | Host | Value |
|---|---|---|
| A | `@` | 185.199.108.153 |
| A | `@` | 185.199.109.153 |
| A | `@` | 185.199.110.153 |
| A | `@` | 185.199.111.153 |
| CNAME | `www` | `mariosakka.github.io` |
