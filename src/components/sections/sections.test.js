import { mount } from '@vue/test-utils'
import { afterEach, expect, test } from 'vitest'
import AboutSection from './AboutSection.vue'
import ExperienceSection from './ExperienceSection.vue'
import ProjectsSection from './ProjectsSection.vue'
import EducationSection from './EducationSection.vue'
import CertificatesSection from './CertificatesSection.vue'
import OrganizationsSection from './OrganizationsSection.vue'
import ContactSection from './ContactSection.vue'
import experience from '../../data/experience.json'
import organizations from '../../data/organizations.json'

let w
afterEach(() => w?.unmount())

test('projects: 9 cards, exact filters, filtering', async () => {
  w = mount(ProjectsSection)
  expect(w.findAll('article')).toHaveLength(9)
  const f = w.findAll('[data-filter] button')
  expect(f.map((b) => b.text())).toEqual(['All', 'Web', 'Embedded', 'Games', 'App', 'Algorithms'])
  expect(f[0].attributes('aria-pressed')).toBe('true')
  await f[2].trigger('click')
  expect(f[2].attributes('aria-pressed')).toBe('true')
  const n = w.findAll('article').length
  expect(n).toBeGreaterThan(0)
  expect(n).toBeLessThan(9)
})

test('experience: isPresent shows Present and modal opens with longDescription', async () => {
  w = mount(ExperienceSection, { attachTo: document.body })
  expect(w.text()).toContain('Present')
  expect(w.text()).not.toContain('undefined')
  const i = experience.findIndex((e) => e.longDescription)
  await w.findAll('article button')[i].trigger('click')
  expect(document.body.textContent).toContain(experience[i].longDescription.slice(0, 40))
})

test('organizations: modal shows longDescription', async () => {
  w = mount(OrganizationsSection, { attachTo: document.body })
  await w.find('article button').trigger('click')
  expect(document.body.textContent).toContain(organizations[0].longDescription.trim())
})

test('education and certificates render cards without undefined', () => {
  for (const C of [EducationSection, CertificatesSection]) {
    const x = mount(C)
    expect(x.findAll('article').length).toBeGreaterThan(0)
    expect(x.text()).not.toContain('undefined')
    x.unmount()
  }
})

test('contact: four links with hrefs', () => {
  w = mount(ContactSection)
  const hrefs = w.findAll('a').map((a) => a.attributes('href'))
  expect(hrefs).toEqual([
    'mailto:mohamad.mario.sakka@gmail.com',
    'https://github.com/mariosakka',
    'tel:+40734523633',
    'https://www.linkedin.com/in/mohamad-mario-sakka-37388a29b',
  ])
  expect(w.text()).toContain("Let's Connect!")
})

test('about: code panel, skills, commit badge slot', () => {
  w = mount(AboutSection)
  expect(w.find('pre code').text()).toContain('"name"')
  expect(w.text()).toContain('Mohamad-Mario Sakka')
  expect(w.text()).toContain('Java')
  expect(w.text()).toContain('Arabic')
})
