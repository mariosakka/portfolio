import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SectionBlock from './SectionBlock.vue'

describe('SectionBlock', () => {
  it('is at least one screen tall (below the nav) and centers its content, with no layout in jsdom to check', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const s = mount(SectionBlock, { props: { id: 'x', title: 'Hello' }, slots: { default: '<p>body</p>' } })
    const c = s.get('section').classes()
    for (const k of ['min-h-[var(--section-h)]', 'flex', 'flex-col', 'justify-center', 'scroll-mt-[var(--nav-h)]']) expect(c).toContain(k)
    expect(s.get('h2').text()).toBe('Hello')
  })
})
