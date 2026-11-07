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
    expect(w.text()).toContain('1 / 9')
    expect(w.findAll('[data-cf-pose] article')).toHaveLength(9)
    const f = w.findAll('[data-filter] button')
    expect(f.map((b) => b.text())).toEqual(['All', 'Web', 'Embedded', 'Games', 'App', 'Algorithms'])
    expect(f[0].attributes('aria-pressed')).toBe('true')
    await f[2].trigger('click')
    expect(f[2].attributes('aria-pressed')).toBe('true')
    expect(slides(w).map((s) => s.find('h3').text())).toEqual(['DIY Laptop Cooling Pad', 'Monitor.IoT'])
  })

  test('changing the filter resets to the first slide', async () => {
    w = mount(ProjectsSection)
    await w.get('button[aria-label="Next slide"]').trigger('click')
    expect(w.text()).toContain('2 / 9')
    await w.findAll('[data-filter] button')[1].trigger('click')
    expect(w.text()).toContain('1 / 3')
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
    expect(tabs.map((t) => t.attributes('aria-selected'))).toEqual(['true', 'false'])
    expect(tabs.map((t) => t.attributes('tabindex'))).toEqual(['0', '-1'])
    expect(w.text()).toContain('Present')
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
    await tabs()[1].trigger('keydown', { key: 'ArrowDown' }) // wraps to the first
    expect(tabs()[0].attributes('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs()[0].element)
    await tabs()[0].trigger('keydown', { key: 'ArrowLeft' })
    expect(tabs()[1].attributes('aria-selected')).toBe('true')
    await tabs()[1].trigger('keydown', { key: 'Home' })
    expect(w.get('[role="tabpanel"]').attributes('aria-labelledby')).toBe('exp-tab-0')
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
    expect(w.findAll('article')).toHaveLength(2)
    expect(w.text()).toContain('9.6/10')
    expect(w.text()).not.toContain('undefined')
    expect(cards(w).map((c) => c.attributes('inert') !== undefined)).toEqual([false, true])
    expect(w.get('[aria-live]').text()).toContain(`Card 1 of 2: ${education[0].degree}`)
  })

  test('Next flies the top card out, then tucks it behind; Previous and arrow keys work too', async () => {
    vi.useFakeTimers()
    w = mount(EducationSection)
    await w.get('button[aria-label="Next card"]').trigger('click')
    expect(top(w)).toBe(1)
    expect((cards(w)[0].element as HTMLElement).style.transform).toContain('translateX(-112%)') // flying out
    await vi.advanceTimersByTimeAsync(450)
    expect((cards(w)[0].element as HTMLElement).style.transform).toContain('translate(16px, 16px)') // tucked under
    expect(w.get('[aria-live]').text()).toContain('Card 2 of 2')
    const deck = w.get('[data-deck]')
    await deck.trigger('keydown', { key: 'ArrowRight' })
    expect(top(w)).toBe(0)
    await deck.trigger('keydown', { key: 'ArrowLeft' })
    expect(top(w)).toBe(1)
    await w.get('button[aria-label="Previous card"]').trigger('click')
    expect(top(w)).toBe(0)
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
  test('all 4 tiles at once with images, the first one large on desktop', () => {
    w = mount(CertificatesSection)
    const tiles = w.findAll('[aria-label="Certificates"] > li')
    expect(tiles).toHaveLength(certificates.length)
    expect(tiles[0].classes()).toEqual(expect.arrayContaining(['md:col-span-2', 'md:row-span-2']))
    expect(tiles.map((t) => t.find('img').attributes('src'))).toEqual(certificates.map((c) => c.image))
    expect(tiles.every((t) => t.find('article').classes().includes('relative'))).toBe(true)
    expect(w.text()).not.toContain('undefined')
    expect(w.findAll('a').filter((a) => a.attributes('aria-label')?.startsWith('Credential ('))).toHaveLength(2)
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
  expect(w.findAll('article')).toHaveLength(1)
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
    'https://www.linkedin.com/in/mohamad-mario-sakka-37388a29b',
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

test('skills: all 12 skills from about.json in a staggered cluster', () => {
  w = mount(SkillsSection)
  expect(w.findAll('[aria-label="Skills"] [data-skill]').map((l) => l.text())).toEqual(about.skills)
  expect(about.skills).toHaveLength(12)
  const items = w.findAll('[aria-label="Skills"] > li')
  expect(items.every((li) => li.attributes('data-stagger') === '')).toBe(true)
  expect(new Set(items.map((li) => li.attributes('style'))).size).toBeGreaterThan(6) // offsets vary
})
