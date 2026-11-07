import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { readCommit } from './src/lib/commit.ts'

const commit = readCommit(process.env, () =>
  execSync('git log -1 --format="%h %s"', { stdio: ['ignore', 'pipe', 'ignore'] }).toString(),
)

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  base: '/',
  define: { __LATEST_COMMIT__: JSON.stringify(commit), __APP_VERSION__: JSON.stringify(version) },
  plugins: [vue()],
  test: { environment: 'jsdom' },
})
