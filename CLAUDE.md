# Portfolio

Static Vue 3 + Vite portfolio, deployed to GitHub Pages. Design: [docs/design/2026-11-07-portfolio-vue-design.md](docs/design/2026-11-07-portfolio-vue-design.md).

## Rules
- MUST keep content in JSON under `src/data/`; no backend, no Firebase.
- MUST NOT commit secrets or `docs/reference/firestore-export/` (gitignored).
- Run `scripts/install-hooks.sh` once after cloning.
- TypeScript everywhere (`strict`, no `any`); `npm run typecheck` must pass. Scripts run natively on Node 24, so use erasable syntax only (no enums/namespaces) and `.ts` import extensions.
- Animated flower components stay dependency-free and Tailwind-free (they become an npm package later) and export typed props from `src/garden/index.ts`.

## Commands
See [README.md](README.md). Tests and enforcement: [docs/testing.md](docs/testing.md). Open issues: [docs/known-issues.md](docs/known-issues.md).
