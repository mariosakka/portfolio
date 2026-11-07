import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Mirrors the ci.yml step "Shebang scripts must be 100755".
function tracked(): string[] | null {
  try {
    return execFileSync('git', ['ls-files', '-s', '--', 'scripts', '.githooks'], { encoding: 'utf8' }).split('\n').filter(Boolean)
  } catch {
    return null // git unavailable or not a checkout
  }
}

describe('exec bits', () => {
  it('every tracked shebang file under scripts/ and .githooks/ is mode 100755', (ctx) => {
    const lines = tracked()
    if (!lines) return ctx.skip()
    const bad = lines
      .map((l) => ({ mode: l.split(/\s/)[0], path: l.split('\t')[1] }))
      .filter(({ path }) => readFileSync(path, 'utf8').startsWith('#!'))
      .filter(({ mode }) => mode !== '100755')
      .map(({ path }) => path)
    expect(bad).toEqual([])
  })
})
