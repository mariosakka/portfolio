import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
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
import education from '../../data/education.json'
import certificates from '../../data/certificates.json'
import organizations from '../../data/organizations.json'
import projects from '../../data/projects.json'
import { formatPeriod } from '../../lib/normalize'

let w: VueWrapper | undefined
let reduced = false
beforeEach(() => {
  reduced = false
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') && reduced })) as unknown as typeof window.matchMedia
  HTMLElement.prototype.scrollTo = vi.fn() as unknown as HTMLElement['scrollTo']
})
afterEach(() => { w?.unmount(); document.body.innerHTML = ''; vi.useRealTimers() })
const slides = (x: VueWrapper) => x.findAll('[aria-roledescription="slide"]')
const readMore = (x: VueWrapper) => x.findAll('article button').filter((b) => b.text().startsWith('Read more'))
const all = [AboutSection, ExperienceSection, OrganizationsSection, EducationSection, CertificatesSection, ProjectsSection, SkillsSection, ContactSection]

test.each(all.map((C) => [C.__name, C]))('%s: without an observer report nothing is hidden (no data-enter), and it declares an entrance', (_, C) => {
  w = mount(C)
  expect(w.find('[data-reveal]').exists()).toBe(true)
  expect(w.find('[data-enter]').exists()).toBe(false)
  expect(w.html()).not.toMatch(/blur|<canvas/)
})

describe('projects: coverflow with a category filter', () => {
  test('9 slides under All, exact filters, filtering', async () => {
    w = mount(ProjectsSection)
    expect(w.get('[role="region"]').attributes('aria-roledescription')).toBe('carousel')
    expect(slides(w)).toHaveLength(projects.length)
    expect(w.text()).toContain(`1 / ${projects.length}`)
    expect(w.findAll('[data-cf-pose] article')).toHaveLength(projects.length)
    const f = w.findAll('[data-filter] button')
    expect(f.map((b) => b.text())).toEqual(['All', 'Web', 'Embedded', 'Games', 'App', 'Algorithms'])
    expect(f[0].attributes('aria-pressed')).toBe('true')
    await f[2].trigger('click')
    expect(f[2].attributes('aria-pressed')).toBe('true')
    expect(slides(w).map((s) => s.find('h3').text())).toEqual(projects.filter((p) => p.category === 'Embedded').map((p) => p.title))
  })

  test('changing the filter resets to the first slide', async () => {
    w = mount(ProjectsSection)
    await w.get('button[aria-label="Next slide"]').trigger('click')
    expect(w.text()).toContain(`2 / ${projects.length}`)
    await w.findAll('[data-filter] button')[1].trigger('click')
    expect(w.text()).toContain(`1 / ${projects.filter((p) => p.category === 'Web').length}`)
  })

  test('the track keeps padding above and below the cards so sprouts are not clipped', () => {
    w = mount(ProjectsSection)
    expect(w.get('[data-track]').classes()).toEqual(expect.arrayContaining(['py-3', 'sm:py-10', 'isolate']))
  })
})

describe('experience: timeline tabs with a detail card', () => {
  test('one tab per role on a labelled tablist, the panel shows the selected role', () => {
    w = mount(ExperienceSection, { attachTo: document.body })
    expect(w.get('[role="tablist"]').attributes('aria-label')).toBe('Roles')
    const tabs = w.findAll('[role="tab"]')
    expect(tabs).toHaveLength(experience.length)
    expect(tabs.map((t) => t.attributes('aria-selected'))).toEqual(experience.map((_, i) => String(i === 0)))
    expect(tabs.map((t) => t.attributes('tabindex'))).toEqual(experience.map((_, i) => (i === 0 ? '0' : '-1')))
    for (const e of experience) expect(w.text()).toContain(formatPeriod(e.startDate, e.endDate, e.isPresent))
    const panel = w.get('[role="tabpanel"]')
    expect(panel.attributes('aria-labelledby')).toBe(tabs[0].attributes('id'))
    expect(panel.get('h3').text()).toBe(experience[0].title)
    expect(w.text()).not.toContain('undefined')
  })

  test('click and arrow keys (wrapping, Home/End) select and focus a role', async () => {
    w = mount(ExperienceSection, { attachTo: document.body })
    const tabs = () => w!.findAll('[role="tab"]')
    await tabs()[1].trigger('click')
    expect(w.get('[role="tabpanel"] h3').text()).toBe(experience[1].title)
    const last = experience.length - 1
    await tabs()[1].trigger('keydown', { key: 'End' })
    await tabs()[last].trigger('keydown', { key: 'ArrowDown' }) // wraps to the first
    expect(tabs()[0].attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs()[0].element)
    await tabs()[0].trigger('keydown', { key: 'ArrowLeft' }) // wraps to the last
    expect(tabs()[last].attributes('aria-selected')).toBe('true')
    await tabs()[last].trigger('keydown', { key: 'Home' })
    expect(w.get('[role="tabpanel"]').attributes('aria-labelledby')).toBe('exp-tab-0')
  })

  test('a role without image or descriptions shows no empty media, summary or undefined', async () => {
    w = mount(ExperienceSection, { attachTo: document.body })
    for (const [i, e] of experience.entries()) {
      await w.findAll('[role="tab"]')[i].trigger('click')
      const panel = w.get('[role="tabpanel"]')
      expect(panel.find('img').exists()).toBe(Boolean(e.image))
      expect(panel.findAll('p').every((p) => p.text().trim() !== '')).toBe(true)
      const more = panel.findAll('button').some((b) => b.text().startsWith('Read more'))
      expect(more).toBe(Boolean(e.longDescription || e.description || e.shortDescription || e.technologies.length))
      expect(panel.text()).not.toContain('undefined')
    }
  })

  test('Read more opens the modal with longDescription', async () => {
    w = mount(ExperienceSection, { attachTo: document.body })
    const i = experience.findIndex((e) => e.longDescription)
    await w.findAll('[role="tab"]')[i].trigger('click')
    await readMore(w)[0].trigger('click')
    expect(document.body.textContent).toContain(experience[i].longDescription.slice(0, 40))
  })
})

describe('education: card deck', () => {
  const cards = (x: VueWrapper) => x.findAll('[data-deck-card]')
  const top = (x: VueWrapper) => cards(x).findIndex((c) => c.attributes('aria-hidden') === undefined)

  test('every card is rendered, only the top one is exposed and focusable', () => {
    w = mount(EducationSection)
    const deck = w.get('[data-deck]')
    expect(deck.attributes('aria-roledescription')).toBe('card deck')
    expect(deck.attributes('aria-label')).toBe('Education')
    expect(cards(w)).toHaveLength(education.length)
    expect(w.findAll('article')).toHaveLength(education.length)
    for (const d of education.filter((e) => e.gpa)) expect(w.text()).toContain(d.gpa)
    expect(w.text()).not.toContain('undefined')
    expect(cards(w).map((c) => c.attributes('inert') !== undefined)).toEqual(education.map((_, i) => i !== 0))
    expect(w.get('[aria-live]').text()).toContain(`Card 1 of ${education.length}: ${education[0].degree}`)
  })

  test('empty facts and subjects leave no empty labels', () => {
    w = mount(EducationSection)
    for (const [i, d] of education.entries()) {
      const card = w.findAll('[data-deck-card]')[i]
      expect(card.findAll('dt').map((t) => t.text())).toEqual(
        [['Field', d.fieldOfStudy], ['GPA', d.gpa], ['Department', d.department]].filter(([, v], k, a) => v.trim() && a.findIndex(([, x]) => x === v) === k).map(([l]) => l),
      )
      expect(card.findAll('dd').every((t) => t.text().trim() !== '')).toBe(true)
    }
  })

  test('Next flies the top card out, then tucks it behind; Previous and arrow keys work too', async () => {
    vi.useFakeTimers()
    w = mount(EducationSection)
    await w.get('button[aria-label="Next card"]').trigger('click')
    expect(top(w)).toBe(1)
    expect((cards(w)[0].element as HTMLElement).style.transform).toContain('translateX(-112%)') // flying out
    await vi.advanceTimersByTimeAsync(450)
    expect((cards(w)[0].element as HTMLElement).style.transform).toContain(`translate(${(education.length - 1) * 16}px`) // tucked under the stack
    expect(w.get('[aria-live]').text()).toContain(`Card 2 of ${education.length}`)
    const deck = w.get('[data-deck]')
    await deck.trigger('keydown', { key: 'ArrowRight' })
    expect(top(w)).toBe(2 % education.length)
    await deck.trigger('keydown', { key: 'ArrowLeft' })
    expect(top(w)).toBe(1)
    await w.get('button[aria-label="Previous card"]').trigger('click')
    expect(top(w)).toBe(0)
    await w.get('button[aria-label="Previous card"]').trigger('click') // wraps to the last card
    expect(top(w)).toBe(education.length - 1)
  })

  test('a drag past the threshold swipes to the next card and swallows the click; a short drag does not', async () => {
    w = mount(EducationSection)
    const card = () => cards(w!)[top(w!)]
    // jsdom has no PointerEvent; a MouseEvent with the pointer event names carries clientX and button.
    const fire = (type: string, clientX: number) => card().element.dispatchEvent(new MouseEvent(type, { clientX, bubbles: true }))
    const drag = async (dx: number) => {
      fire('pointerdown', 200)
      fire('pointermove', 200 + dx)
      fire('pointerup', 200 + dx)
      await w!.vm.$nextTick()
    }
    await drag(4)
    expect(top(w)).toBe(0)
    await drag(-120)
    expect(top(w)).toBe(1)
    const e = new MouseEvent('click', { bubbles: true, cancelable: true })
    cards(w)[0].element.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
  })

  test('reduced motion settles at once', async () => {
    reduced = true
    vi.useFakeTimers()
    w = mount(EducationSection)
    await w.get('button[aria-label="Next card"]').trigger('click')
    await vi.advanceTimersByTimeAsync(0)
    expect((cards(w)[0].element as HTMLElement).style.transform).not.toContain('112%')
  })
})

describe('certificates: bento mosaic', () => {
  test('every certificate at once, the first tile large on desktop', () => {
    w = mount(CertificatesSection)
    const tiles = w.findAll('[aria-label="Certificates"] > li')
    expect(tiles).toHaveLength(certificates.length)
    expect(tiles[0].classes()).toEqual(expect.arrayContaining(['md:col-span-2', 'md:row-span-2']))
    // an image when there is one, otherwise a monogram tile: never an empty frame or a broken image
    expect(tiles.map((t) => (t.find('img').exists() ? t.get('img').attributes('src') : ''))).toEqual(certificates.map((c) => c.image))
    for (const [i, c] of certificates.entries()) expect(tiles[i].find('[data-monogram]').exists()).toBe(!c.image)
    expect(tiles.flatMap((t) => t.findAll('[data-monogram]')).every((m) => /^[A-Z]{1,2}$/.test(m.text()))).toBe(true)
    expect(tiles.every((t) => t.find('article').classes().includes('relative'))).toBe(true)
    expect(w.text()).not.toContain('undefined')
    expect(w.findAll('a').filter((a) => a.attributes('aria-label')?.startsWith('Credential ('))).toHaveLength(certificates.filter((c) => c.credentialUrl.trim()).length)
  })

  test('a tile opens the detail dialog with its text, skills and credential link', async () => {
    w = mount(CertificatesSection, { attachTo: document.body })
    const i = certificates.findIndex((c) => c.credentialUrl)
    const btn = w.findAll('[aria-label="Certificates"] button')[i]
    expect(btn.attributes('aria-haspopup')).toBe('dialog')
    await btn.trigger('click')
    const dialog = document.querySelector('[role="dialog"]')!
    expect(dialog.getAttribute('aria-label')).toBe(certificates[i].title)
    expect(dialog.querySelector('a')?.getAttribute('href')).toBe(certificates[i].credentialUrl)
    ;(dialog.querySelector('button[aria-label="Close"]') as HTMLButtonElement).click()
    await w.vm.$nextTick()
    expect(document.querySelector('[role="dialog"]')).toBeNull()
  })
})

test('organizations: one spotlight card with the drawn underline and a modal with longDescription', async () => {
  w = mount(OrganizationsSection, { attachTo: document.body })
  expect(w.findAll('article')).toHaveLength(organizations.length)
  expect(w.find('h3 [data-underline]').exists()).toBe(true)
  expect(w.get('[data-reveal]').attributes('data-reveal')).toBe('wipe')
  await readMore(w)[0].trigger('click')
  expect(document.body.textContent).toContain(organizations[0].longDescription.trim())
})

test('contact: four links with hrefs, the email is the main call to action with a magnet hover', () => {
  w = mount(ContactSection)
  const hrefs = w.findAll('a').map((a) => a.attributes('href'))
  expect(hrefs).toEqual([
    'mailto:mohamad.mario.sakka@gmail.com',
    'https://github.com/mariosakka',
    'tel:+40734523633',
    'https://www.linkedin.com/in/mario-sakka',
  ])
  expect(w.get('[data-cta]').attributes('data-pointer')).toBe('magnet')
  expect(w.text()).toContain("Let's Connect!")
})

test('about: name, languages, masked photo, staggered text, no skill chips', () => {
  w = mount(AboutSection)
  expect(w.text()).toContain('Mohamad-Mario Sakka')
  expect(w.text()).toContain('Arabic')
  expect(w.get('[data-photo]').attributes('data-reveal')).toBe('mask')
  expect(w.get('[data-photo] img').attributes('alt')).toBe(about.fullName)
  expect(w.findAll('[data-stagger]').length).toBeGreaterThanOrEqual(4)
  expect(w.find('[aria-label="Skills"]').exists()).toBe(false)
  for (const s of ['SpringBoot', 'Google Cloud Platform', 'AngularJS']) expect(w.text()).not.toContain(s)
})

test('skills: every skill from about.json in a staggered cluster', () => {
  w = mount(SkillsSection)
  expect(w.findAll('[aria-label="Skills"] [data-skill]').map((l) => l.text())).toEqual(about.skills)
  const items = w.findAll('[aria-label="Skills"] > li')
  expect(items.every((li) => li.attributes('data-stagger') === '')).toBe(true)
  expect(new Set(items.map((li) => li.attributes('style'))).size).toBe(items.length) // offsets and order vary
})
