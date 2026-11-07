import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const run = (data) => {
  const dir = mkdtempSync(join(tmpdir(), 'ph-'))
  writeFileSync(join(dir, 'experience.json'), JSON.stringify(data))
  return spawnSync(process.execPath, ['scripts/check-placeholders.mjs', dir], { encoding: 'utf8' })
}

describe('check-placeholders', () => {
  it('warns on a placeholder longDescription and exits 0', () => {
    const r = run([{ title: 'ok', longDescription: 'aaaa' }])
    expect(r.status).toBe(0)
    expect(r.stdout.match(/^warn /gm)).toHaveLength(1)
    expect(r.stdout).toContain('experience[0].longDescription')
  })
  it('flags aaa, lorem, empty longDescription and empty image with nested paths', () => {
    const r = run([{ x: 1 }, { description: 'Lorem', image: '', longDescription: '', list: ['aaa', 'fine'] }])
    expect(r.status).toBe(0)
    for (const p of ['experience[1].description', 'experience[1].image', 'experience[1].longDescription', 'experience[1].list[0]'])
      expect(r.stdout).toContain(p)
    expect(r.stdout).not.toContain('list[1]')
  })
  it('is quiet for clean data', () => {
    const r = run([{ title: 'a lorem ipsum dolor', longDescription: 'text', image: '/img/a.webp' }])
    expect(r.status).toBe(0)
    expect(r.stdout).not.toMatch(/^warn/m)
  })
})
