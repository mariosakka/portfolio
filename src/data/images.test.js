import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import about from './about.json'
import projects from './projects.json'
import experience from './experience.json'
import certificates from './certificates.json'
import education from './education.json'
import organizations from './organizations.json'

const paths = [about, ...projects, ...experience, ...certificates, ...education, ...organizations].flatMap((i) => [i.image, i.photo]).filter(Boolean)
const pub = resolve(process.cwd(), 'public')

describe('images', () => {
  it('references at least one image', () => expect(paths.length).toBeGreaterThan(0))
  it.each(paths)('%s exists under public/', (p) => expect(existsSync(resolve(pub, '.' + p))).toBe(true))
  it('every file in public/img is under 250 KB', () => {
    const dir = resolve(pub, 'img')
    const files = existsSync(dir) ? readdirSync(dir) : []
    expect(files.length).toBeGreaterThan(0)
    for (const f of files) expect(statSync(resolve(dir, f)).size).toBeLessThan(250 * 1024)
  })
})
