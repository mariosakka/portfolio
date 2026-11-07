import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemCard from './ItemCard.vue'

describe('ItemCard', () => {
  it('renders no anchor for a link with empty url', () => {
    const w = mount(ItemCard, { props: { title: 'T', links: [{ label: 'Live', url: '' }] } })
    expect(w.find('a').exists()).toBe(false)
  })
  it('ignores whitespace-only urls', () => {
    const w = mount(ItemCard, { props: { title: 'T', links: [{ label: 'Live', url: '   ' }] } })
    expect(w.find('a').exists()).toBe(false)
  })
  it('renders a real link and no chip list when tags empty', () => {
    const w = mount(ItemCard, { props: { title: 'T', tags: [], links: [{ label: 'Live', url: 'https://x.io' }] } })
    expect(w.find('a').attributes('href')).toBe('https://x.io')
    expect(w.find('ul').exists()).toBe(false)
  })
  it('emits open on click of the card button', async () => {
    const w = mount(ItemCard, { props: { title: 'T' } })
    await w.find('button').trigger('click')
    expect(w.emitted('open')).toHaveLength(1)
  })
  // url is typed string; the casts feed the runtime non-string case from untyped JSON
  it('binds trimmed url to href and tolerates non-string url', () => {
    const w = mount(ItemCard, { props: { title: 'T', links: [{ label: 'A', url: ' https://x.io ' }, { label: 'B', url: null as unknown as string }, { label: 'C', url: 5 as unknown as string }] } })
    expect(w.findAll('a')).toHaveLength(1)
    expect(w.find('a').attributes('href')).toBe('https://x.io')
  })
})
