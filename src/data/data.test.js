import { describe, it, expect } from 'vitest'
import about from './about.json'
import projects from './projects.json'
import experience from './experience.json'
import certificates from './certificates.json'
import education from './education.json'
import organizations from './organizations.json'

const all = { about, projects, experience, certificates, education, organizations }
const read = (n) => all[n]
const lists = { projects: 'title', experience: 'title', certificates: 'title', education: 'degree', organizations: 'name' }
const listFields = ['technologies', 'skills', 'subjects', 'languages', 'socialMedia']

describe.each(Object.entries(lists))('%s.json', (file, primary) => {
  const items = read(file)
  it('is a non-empty array with a primary field', () => {
    expect(Array.isArray(items)).toBe(true)
    expect(items.length).toBeGreaterThan(0)
    for (const i of items) expect(i[primary]).toBeTruthy()
  })
  it('has array list fields and no Storage URLs', () => {
    for (const i of items) for (const f of listFields) if (f in i) expect(Array.isArray(i[f])).toBe(true)
    expect(JSON.stringify(items)).not.toContain('firebasestorage.googleapis.com')
  })
})

describe('about.json', () => {
  const about = read('about')
  it('has required fields', () => {
    expect(about.fullName).toBeTruthy()
    expect(about.role).toBeTruthy()
    expect(() => JSON.parse(about.codeSample)).not.toThrow()
    expect(about.contact.methods.map((m) => m.type).sort()).toEqual(['Email', 'GitHub', 'LinkedIn', 'Phone'])
    expect(Array.isArray(about.skills) && Array.isArray(about.languages)).toBe(true)
    expect(JSON.stringify(about)).not.toContain('firebasestorage.googleapis.com')
  })
})
