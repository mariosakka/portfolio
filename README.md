# Portfolio

Mohamad-Mario Sakka's portfolio: static Vue 3 site on GitHub Pages. Status: foundations only; the app is not scaffolded yet. See the [design](docs/superpowers/specs/2026-11-07-portfolio-vue-design.md).

## Setup
Prerequisites: Node 24+, git, [gitleaks](https://github.com/gitleaks/gitleaks), Python 3.

    scripts/install-hooks.sh

## Developer tools
| Tool | Purpose | Run | CI |
|---|---|---|---|
| `scripts/install-hooks.sh` | enable the pre-push hook | `scripts/install-hooks.sh` | n/a |
| `.githooks/pre-push` | secret scan + instruction-file check | automatic on push | `ci.yml` (authoritative) |
| `scripts/check_agent_instructions.py` | CLAUDE.md length and links | `python scripts/check_agent_instructions.py .` | `ci.yml` |
| `docs/reference/export-firestore.mjs` | one-off export of the old Firestore data | `node docs/reference/export-firestore.mjs` | none |

## Domain and deploy (to be wired when the app exists)
Repo contains `public/CNAME`. In Namecheap Advanced DNS: four `A` records `@` -> 185.199.108.153, .109.153, .110.153, .111.153 and `CNAME www` -> `mariosakka.github.io`. Then set the custom domain in repo Settings -> Pages and enable Enforce HTTPS.
