import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import AboutSection from './AboutSection.vue'
import SkillsSection from './SkillsSection.vue'
import ExperienceSection from './ExperienceSection.vue'
import ProjectsSection from './ProjectsSection.vue'
import EducationSection from './EducationSection.vue'
import CertificatesSection from './CertificatesSection.vue'
import OrganizationsSection from './OrganizationsSection.vue'
import ContactSection from './ContactSection.vue'
import about from '../../data/about.json'
import experience from '../../data/experience.json'
import organizations from '../../data/organizations.json'

let w: VueWrapper | undefined
beforeEach(() => { HTMLElement.prototype.scrollTo = vi.fn() as unknown as HTMLElement['scrollTo'] })
afterEach(() => { w?.unmount(); document.body.innerHTML = '' })
const slides = (x: VueWrapper) => x.findAll('[aria-roledescription="slide"]')
const readMore = (x: VueWrapper) => x.findAll('article button').filter((b) => b.text().startsWith('Read more'))

test('projects: 9 slides under All, exact filters, filtering', async () => {
  w = mount(ProjectsSection)
  expect(w.get('[role="region"]').attributes('aria-roledescription')).toBe('carousel')
  expect(slides(w)).toHaveLength(9)
  expect(w.text()).toContain('1 / 9')
  const f = w.findAll('[data-filter] button')
  expect(f.map((b) => b.text())).toEqual(['All', 'Web', 'Embedded', 'Games', 'App', 'Algorithms'])
  expect(f[0].attributes('aria-pressed')).toBe('true')
  await f[2].trigger('click')
  expect(f[2].attributes('aria-pressed')).toBe('true')
  expect(slides(w).map((s) => s.find('h3').text())).toEqual(['DIY Laptop Cooling Pad', 'Monitor.IoT'])
})

test('projects: changing the filter resets the carousel to the first slide', async () => {
  w = mount(ProjectsSection)
  await w.get('button[aria-label="Next slide"]').trigger('click')
  expect(w.text()).toContain('2 / 9')
  await w.findAll('[data-filter] button')[1].trigger('click')
  expect(w.text()).toContain('1 / 3')
})

test('experience: hero cards, isPresent shows Present and modal opens with longDescription', async () => {
  w = mount(ExperienceSection, { attachTo: document.body })
  expect(w.findAll('article')).toHaveLength(experience.length)
  expect(w.text()).toContain('Present')
  expect(w.text()).toContain('Colete Online')
  expect(w.text()).not.toContain('undefined')
  const i = experience.findIndex((e) => e.longDescription)
  await readMore(w)[i].trigger('click')
  expect(document.body.textContent).toContain(experience[i].longDescription.slice(0, 40))
})

test('organizations: one hero card whose modal shows longDescription', async () => {
  w = mount(OrganizationsSection, { attachTo: document.body })
  expect(w.findAll('article')).toHaveLength(1)
  await readMore(w)[0].trigger('click')
  expect(document.body.textContent).toContain(organizations[0].longDescription.trim())
})

test('education: hero cards with GPA, no undefined', () => {
  w = mount(EducationSection)
  expect(w.findAll('article')).toHaveLength(2)
  expect(w.text()).toContain('9.6/10')
  expect(w.text()).not.toContain('undefined')
})

test('certificates: a carousel of 4 cards, credential links only when present', () => {
  w = mount(CertificatesSection)
  expect(slides(w)).toHaveLength(4)
  expect(w.text()).not.toContain('undefined')
  expect(w.findAll('a').filter((a) => a.text().startsWith('Credential'))).toHaveLength(2)
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

test('about: name, languages, no skill chips', () => {
  w = mount(AboutSection)
  expect(w.text()).toContain('Mohamad-Mario Sakka')
  expect(w.text()).toContain('Arabic')
  expect(w.find('[aria-label="Skills"]').exists()).toBe(false)
  for (const s of ['SpringBoot', 'Google Cloud Platform', 'AngularJS']) expect(w.text()).not.toContain(s)
})

test('skills: all 12 skills from about.json', () => {
  w = mount(SkillsSection)
  // the numeral before each name is aria-hidden decoration
  expect(w.findAll('[aria-label="Skills"] li > span:not([aria-hidden])').map((l) => l.text())).toEqual(about.skills)
  expect(about.skills).toHaveLength(12)
})
