import { describe, it, expect } from 'vitest'
import aboutJson from './about.json'
import projectsJson from './projects.json'
import experienceJson from './experience.json'
import certificatesJson from './certificates.json'
import educationJson from './education.json'
import organizationsJson from './organizations.json'
import type { About, Certificate, Education, Experience, Organization, Project } from '../types/data'

// Typed against the live schema: a missing or misspelled field in the JSON fails the type check.
const about: About = aboutJson
const projects: Project[] = projectsJson
const experience: Experience[] = experienceJson
const certificates: Certificate[] = certificatesJson
const education: Education[] = educationJson
const organizations: Organization[] = organizationsJson

const all = { about, projects, experience, certificates, education, organizations }
type Primary = 'title' | 'degree' | 'name'
const read = (n: keyof typeof all) => all[n]
const lists: Record<'projects' | 'experience' | 'certificates' | 'education' | 'organizations', Primary> = { projects: 'title', experience: 'title', certificates: 'title', education: 'degree', organizations: 'name' }
const listFields = ['technologies', 'skills', 'subjects', 'languages', 'socialMedia']

describe.each(Object.entries(lists) as [keyof typeof lists, Primary][])('%s.json', (file, primary) => {
  // read() returns one of several typed arrays; index by the per-file primary field name
  const items = read(file) as unknown as Record<string, unknown>[]
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
  it('has required fields', () => {
    expect(about.fullName).toBeTruthy()
    expect(about.role).toBeTruthy()
    expect(about.contact.methods.map((m) => m.type).sort()).toEqual(['Email', 'GitHub', 'LinkedIn', 'Phone'])
    expect(Array.isArray(about.skills) && Array.isArray(about.languages)).toBe(true)
    expect(JSON.stringify(about)).not.toContain('firebasestorage.googleapis.com')
  })
})
