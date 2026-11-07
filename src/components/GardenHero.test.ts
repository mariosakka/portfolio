import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GardenHero from './GardenHero.vue'
import SectionBlock from './SectionBlock.vue'

describe('garden placement', () => {
  it('renders fully grown art with reduced motion and adds no text', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const w = mount(GardenHero)
    expect(w.findAll('svg.g-vine, svg.g-page-vine').length).toBeGreaterThanOrEqual(4)
    w.findAll('svg').forEach((v) => expect(v.attributes('aria-hidden')).toBe('true'))
    w.findAll('svg.g-vine').forEach((v) => expect(v.classes()).toContain('g-is-grown'))
    w.findAll('svg.g-page-vine').forEach((v) => expect(v.classes()).toContain('g-is-static'))
    expect(w.text()).toBe('')
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.classes()).toContain('pointer-events-none')
  })
  it('keeps heading and card text identical with garden art', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const s = mount(SectionBlock, { props: { id: 'x', title: 'Hello' } })
    expect(s.text()).toBe('Hello')
    expect(s.find('svg.g-vine').exists()).toBe(true)
  })
})

describe('garden breakpoints', () => {
  it('shows the long vines only from 1400px, above the nav; the edge vine sits behind content', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const w = mount(GardenHero)
    expect(w.classes()).not.toContain('z-20') // a z-index on the root would trap the edge vine above the content
    const cls = (v: { element: Element }): string => v.element.parentElement?.className ?? ''
    const wide = w.findAll('svg').filter((v) => cls(v).includes('min-[1400px]:block'))
    expect(wide.length).toBeGreaterThanOrEqual(3) // left, right, hero corner
    wide.forEach((v) => { expect(cls(v)).toContain('hidden'); expect(cls(v)).toContain('z-20') })
    const edge = w.findAll('svg.g-page-vine.g-is-compact')
    expect(edge).toHaveLength(2) // phone strip and tablet/laptop strip
    edge.forEach((v) => { expect(cls(v)).toContain('-z-10'); expect(cls(v)).toContain('overflow-hidden') })
  })
})
