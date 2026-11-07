/// <reference types="vite/client" />

// Injected at build time by vite.config.ts (`define`).
declare const __LATEST_COMMIT__: { message: string; sha: string } | null
declare const __APP_VERSION__: string // package.json version
