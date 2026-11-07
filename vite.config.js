import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'node:child_process'
import { readCommit } from './src/lib/commit.js'

const commit = readCommit(process.env, () =>
  execSync('git log -1 --format="%h %s"', { stdio: ['ignore', 'pipe', 'ignore'] }).toString(),
)

export default defineConfig({
  base: '/',
  define: { __LATEST_COMMIT__: JSON.stringify(commit) },
  plugins: [vue()],
  test: { environment: 'jsdom' },
})
