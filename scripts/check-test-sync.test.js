import { describe, it, expect } from 'vitest'
import { evaluate } from './check-test-sync.mjs'

const c = (status, path) => ({ status, path })

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
