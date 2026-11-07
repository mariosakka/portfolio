import { describe, it, expect } from 'vitest'
import { evaluate, resolveBase, findBypass, isBot } from './check-test-sync.ts'

const c = (status: string, path: string) => ({ status, path })

describe('check-test-sync evaluate', () => {
  it('fails when source changes without a test', () => {
    const r = evaluate({ changes: [c('M', 'src/lib/normalize.js')] })
    expect(r.ok).toBe(false)
  })
  it('passes when a test changes alongside', () => {
    expect(evaluate({ changes: [c('M', 'src/lib/normalize.js'), c('M', 'src/lib/normalize.test.js')] }).ok).toBe(true)
  })
  it('passes for data, style, assets and test-only changes', () => {
    const changes = [c('M', 'src/data/about.json'), c('M', 'src/style.css'), c('A', 'src/assets/x.svg'), c('M', 'README.md')]
    expect(evaluate({ changes }).ok).toBe(true)
  })
  it('bypass reason or bot author skips the check', () => {
    const changes = [c('A', 'src/App.vue')]
    expect(evaluate({ changes, bypass: 'copy tweak' }).ok).toBe(true)
    expect(evaluate({ changes, bypass: '' }).ok).toBe(false)
  })
  it('deleted source with surviving same-name test fails', () => {
    const changes = [c('D', 'src/lib/commit.js')]
    expect(evaluate({ changes, existingTests: ['src/lib/commit.test.js'] }).ok).toBe(false)
    expect(evaluate({ changes, existingTests: [] }).ok).toBe(true)
  })
  it('standalone test deletion needs a reason, paired deletion does not', () => {
    expect(evaluate({ changes: [c('D', 'src/lib/commit.test.js')] }).ok).toBe(false)
    expect(evaluate({ changes: [c('D', 'src/lib/commit.test.js'), c('D', 'src/lib/commit.js')] }).ok).toBe(true)
    expect(evaluate({ changes: [c('D', 'src/lib/commit.test.js')], bypass: 'obsolete' }).ok).toBe(true)
  })
})

describe('base resolution', () => {
  const rootCommit = () => 'ROOT'
  it('uses the ref when it resolves', () => {
    expect(resolveBase('abc', { resolves: () => true, rootCommit })).toBe('abc')
  })
  it('fails loudly when the ref does not resolve', () => {
    expect(() => resolveBase('nope', { resolves: () => false, rootCommit })).toThrow(/nope.*fetch/s)
  })
  it('falls back to the root commit only with allowRoot', () => {
    expect(resolveBase('nope', { resolves: () => false, rootCommit, allowRoot: true })).toBe('ROOT')
  })
})

describe('bypass trailer', () => {
  it('honors a valid trailer in the last paragraph', () => {
    expect(findBypass(['feat: x\n\nbody\n\nTests-Not-Applicable: copy only\nCo-Authored-By: A <a@b.c>\n'])).toBe('copy only')
  })
  it('ignores an empty trailer followed by Co-Authored-By', () => {
    expect(findBypass(['feat: x\n\nTests-Not-Applicable:\nCo-Authored-By: A <a@b.c>\n'])).toBeNull()
    expect(findBypass(['feat: x\n\nTests-Not-Applicable:   \nCo-Authored-By: A <a@b.c>\n'])).toBeNull()
  })
  it('ignores the trailer outside the last paragraph', () => {
    expect(findBypass(['feat: x\n\nTests-Not-Applicable: why\n\nmore text\n'])).toBeNull()
  })
})

describe('bot detection', () => {
  it('accepts only the exact dependabot identity', () => {
    expect(isBot('dependabot[bot]', '49699333+dependabot[bot]@users.noreply.github.com')).toBe(true)
    expect(isBot('dependabot-fan', 'x@example.com')).toBe(false)
    expect(isBot('dependabot[bot]', 'evil@example.com')).toBe(false)
  })
})

describe('JS -> TS conversion', () => {
  it('a source deleted and re-added with another extension is not a deletion', () => {
    const changes = [c('D', 'src/lib/commit.js'), c('A', 'src/lib/commit.ts'), c('D', 'src/lib/commit.test.js'), c('A', 'src/lib/commit.test.ts')]
    expect(evaluate({ changes, existingTests: ['src/lib/commit.test.ts'] }).ok).toBe(true)
  })
  it('still fails when the replacement source has no test change', () => {
    const changes = [c('D', 'src/lib/commit.js'), c('A', 'src/lib/commit.ts')]
    expect(evaluate({ changes, existingTests: ['src/lib/commit.test.ts'] }).ok).toBe(false)
  })
})

describe('conversion rule is limited to a .js/.mjs -> .ts swap of the same file', () => {
  it('deleting foo.vue and adding foo.ts is still a deletion', () => {
    const changes = [c('D', 'src/foo.vue'), c('A', 'src/foo.ts'), c('M', 'src/foo.test.ts')]
    expect(evaluate({ changes, existingTests: ['src/foo.test.ts'] }).ok).toBe(false)
  })
  it('deleting foo.ts and adding foo.test.ts is still a deletion', () => {
    const changes = [c('D', 'src/foo.ts'), c('A', 'src/foo.test.ts')]
    expect(evaluate({ changes, existingTests: ['src/foo.test.ts'] }).ok).toBe(false)
  })
  it('a different directory does not count', () => {
    const changes = [c('D', 'src/a/foo.js'), c('A', 'src/b/foo.ts'), c('A', 'src/b/foo.test.ts')]
    expect(evaluate({ changes, existingTests: ['src/a/foo.test.ts'] }).ok).toBe(false)
  })
})

describe('test pairing by full path', () => {
  it('does not pair index.js across directories', () => {
    const changes = [c('D', 'src/a/index.js')]
    expect(evaluate({ changes, existingTests: ['src/b/index.test.js'] }).ok).toBe(true)
    expect(evaluate({ changes, existingTests: ['src/a/index.test.js'] }).ok).toBe(false)
  })
})
