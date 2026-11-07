import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GardenHero from './GardenHero.vue'
import ItemCard from './ItemCard.vue'
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
    const c = mount(ItemCard, { props: { title: 'T', bud: true } })
    expect(c.text()).toBe('T')
    expect(c.find('.bud').exists()).toBe(true)
  })
})
