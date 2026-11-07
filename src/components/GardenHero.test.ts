import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GardenHero from './GardenHero.vue'
import SectionBlock from './SectionBlock.vue'

describe('garden placement', () => {
  it('renders fully grown art with reduced motion and adds no text', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const w = mount(GardenHero)
    const vines = w.findAll('svg.vine')
    expect(vines.length).toBeGreaterThanOrEqual(2)
    vines.forEach((v) => expect(v.classes()).toContain('is-grown'))
    expect(w.text()).toBe('')
    expect(w.attributes('aria-hidden')).toBe('true')
    expect(w.classes()).toContain('pointer-events-none')
  })
  it('keeps heading and card text identical with garden art', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const s = mount(SectionBlock, { props: { id: 'x', title: 'Hello' } })
    expect(s.text()).toBe('Hello')
    expect(s.find('svg.vine').exists()).toBe(true)
  })
})

describe('garden breakpoints', () => {
  it('shows the big vines only from 1400px and sits above the nav', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const w = mount(GardenHero)
    expect(w.classes()).toContain('z-20')
    w.findAll('svg.vine').forEach((v) => {
      const cls = v.element.parentElement?.className ?? ''
      expect(cls).toContain('hidden')
      expect(cls).toContain('min-[1400px]:block')
    })
  })
})
