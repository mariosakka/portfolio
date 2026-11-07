import { afterEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import HeroCard from './HeroCard.vue'

let w: VueWrapper | undefined
afterEach(() => { w?.unmount(); document.body.innerHTML = '' })
const make = (props: Record<string, unknown>) => (w = mount(HeroCard, { props: { title: 'T', ...props }, attachTo: document.body }))
const readMore = () => w!.findAll('button').find((b) => b.text().startsWith('Read more'))

describe('HeroCard', () => {
  it('hides empty links, empty tags, image and meta', () => {
    make({ links: [{ label: 'Live', url: '' }, { label: 'GitHub', url: '  ' }, { label: 'X', url: null as unknown as string }], tags: [] })
    expect(w!.find('a').exists()).toBe(false)
    expect(w!.find('ul').exists()).toBe(false)
    expect(w!.find('img').exists()).toBe(false)
    expect(readMore()).toBeUndefined()
    expect(w!.text()).not.toContain('undefined')
  })

  it('renders image, eyebrow, meta, tags and trimmed real links', () => {
    make({ image: '/img/a.webp', eyebrow: 'Acme', meta: 'Jan 2025 - Present', tags: ['Vue'], links: [{ label: 'Live', url: ' https://x.io ' }, { label: 'GitHub', url: '' }] })
    expect(w!.find('img[src="/img/a.webp"]').exists()).toBe(true)
    expect(w!.text()).toContain('Acme')
    expect(w!.text()).toContain('Jan 2025 - Present')
    expect(w!.findAll('li').map((l) => l.text())).toEqual(['Vue'])
    expect(w!.findAll('a').map((a) => a.attributes('href'))).toEqual(['https://x.io'])
  })

  it('facts hide empty and repeated values', () => {
    make({ facts: [{ label: 'Field', value: 'X' }, { label: 'Dept', value: 'X' }, { label: 'GPA', value: '' }, { label: 'Loc', value: 'Y' }] })
    expect(w!.findAll('dt').map((d) => d.text())).toEqual(['Field', 'Loc'])
  })

  it('logo images are a fixed tile, other images fill the frame uncropped', () => {
    make({ image: '/a.webp', logo: true })
    expect(w!.findAll('img')[1].classes()).toContain('h-28')
    w!.unmount()
    make({ image: '/a.webp' })
    expect(w!.findAll('img')[1].classes()).toContain('object-contain')
  })

  it('split layout puts the image on the requested side', () => {
    make({ image: '/a.webp', layout: 'split', imageSide: 'right' })
    expect(w!.get('figure').classes()).toContain('md:order-last')
  })

  it.each([
    [{ longDescription: 'LONG', description: 'DESC', shortDescription: 'SHORT' }, 'LONG'],
    [{ longDescription: '', description: 'DESC', shortDescription: 'SHORT' }, 'DESC'],
    [{ shortDescription: 'SHORT' }, 'SHORT'],
  ])('Read more opens the modal with the fallback chain %#', async (props, expected) => {
    make(props)
    await readMore()!.trigger('click')
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog?.getAttribute('aria-label')).toBe('T')
    expect(dialog?.textContent).toContain(expected)
    expect(dialog?.textContent).not.toContain('undefined')
  })
})
