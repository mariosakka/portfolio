# Portfolio

Mohamad-Mario Sakka's portfolio: static Vue 3 site on GitHub Pages. Status: Vue app scaffolded. See the [design](docs/superpowers/specs/2026-11-07-portfolio-vue-design.md).

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
| `scripts/check_agent_instructions.py` | CLAUDE.md length and links | `python scripts/check_agent_instructions.py .` | `ci.yml` |
| `scripts/build-data.mjs` | convert the Firestore export to `src/data/*.json` | `node scripts/build-data.mjs [exportDir]` | none |
| `scripts/fetch-images.mjs` | download and optimize images to `public/img` (sharp, webp) | `node scripts/fetch-images.mjs [exportDir]` | none |
| `docs/reference/export-firestore.mjs` | one-off export of the old Firestore data | `node docs/reference/export-firestore.mjs` | none |

## Domain and deploy (to be wired when the app exists)
Repo contains `public/CNAME`. In Namecheap Advanced DNS: four `A` records `@` -> 185.199.108.153, .109.153, .110.153, .111.153 and `CNAME www` -> `mariosakka.github.io`. Then set the custom domain in repo Settings -> Pages and enable Enforce HTTPS.
