import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import about from '../../data/about.json'
import certificates from '../../data/certificates.json'

// Data shapes the real JSON does not have today: no items at all, and many certificates.
// Each test mocks one JSON module and imports the section fresh.
beforeEach(() => {
  vi.resetModules()
  window.matchMedia = ((q: string) => ({ matches: q.includes('768px') })) as unknown as typeof window.matchMedia
  HTMLElement.prototype.scrollTo = vi.fn() as unknown as HTMLElement['scrollTo']
})
afterEach(() => { vi.doUnmock('../../data/experience.json'); vi.doUnmock('../../data/education.json'); vi.doUnmock('../../data/certificates.json'); vi.doUnmock('../../data/about.json') })

test.each([
  ['experience', './ExperienceSection.vue', '../../data/experience.json'],
  ['education', './EducationSection.vue', '../../data/education.json'],
  ['certificates', './CertificatesSection.vue', '../../data/certificates.json'],
])('%s with no items renders nothing and does not throw', async (_, comp, json) => {
  vi.doMock(json, () => ({ default: [] }))
  const C = (await import(comp)).default
  const w = mount(C)
  expect(w.text()).toBe('')
  expect(w.find('[role="tab"], [data-deck-card], li').exists()).toBe(false)
  w.unmount()
})

test('skills with an empty list render nothing', async () => {
  vi.doMock('../../data/about.json', () => ({ default: { ...about, skills: [] } }))
  const C = (await import('./SkillsSection.vue')).default
  expect(mount(C).find('ul').exists()).toBe(false)
})

test.each([6, 7, 9, 12])('%i certificates: every tile renders, desktop rows fill exactly', async (n) => {
  const many = Array.from({ length: n }, (_, i) => ({ ...certificates[i % certificates.length], id: `c${i}`, title: `Cert ${i}` }))
  vi.doMock('../../data/certificates.json', () => ({ default: many }))
  const C = (await import('./CertificatesSection.vue')).default
  const w = mount(C)
  const tiles = w.findAll('[aria-label="Certificates"] > li')
  expect(tiles.map((t) => t.find('h3').text())).toEqual(many.map((c) => c.title))
  const cells = tiles.reduce((sum, t) => sum + (t.classes().includes('md:col-span-2') ? 2 : 1), 0)
  const rows = Number((w.get('ul').element as HTMLElement).style.getPropertyValue('--rows'))
  expect(cells).toBe(rows * 4)
  expect(tiles.some((t) => t.classes().includes('md:row-span-2'))).toBe(false)
})

test('the timeline rail is vertical from md', async () => {
  const C = (await import('./ExperienceSection.vue')).default
  const w = mount(C)
  await w.vm.$nextTick()
  expect(w.get('[role="tablist"]').attributes('aria-orientation')).toBe('vertical')
})
