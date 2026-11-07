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

  it('long tag lists show the first tags and a +k chip; the modal lists them all', async () => {
    const tags = ['Kotlin', 'Android SDK', 'XML', 'Android Views', 'ExpressJS', 'Heroku', 'OpenAI API', 'Firebase', 'GitHub Actions', 'Docker']
    make({ tags, description: 'D' })
    const chips = w!.findAll('article ul li').map((l) => l.text())
    const plus = chips[chips.length - 1]
    expect(plus).toMatch(/^\+\d+/)
    const k = Number(plus.match(/^\+(\d+)/)![1])
    expect(chips.slice(0, -1)).toEqual(tags.slice(0, tags.length - k))
    expect(w!.get('[data-more-tags]').text()).toContain(`and ${k} more`)
    await readMore()!.trigger('click')
    const dialog = document.querySelector('[role="dialog"]')!
    expect([...dialog.querySelectorAll('li')].map((l) => l.textContent?.trim())).toEqual(tags)
  })

  it('facts hide empty and repeated values', () => {
    make({ facts: [{ label: 'Field', value: 'X' }, { label: 'Dept', value: 'X' }, { label: 'GPA', value: '' }, { label: 'Loc', value: 'Y' }] })
    expect(w!.findAll('dt').map((d) => d.text())).toEqual(['Field', 'Loc'])
  })

  it('shows the image cleanly on the flat media surface: no canvas wash, no blur, no image-derived backdrop', () => {
    make({ image: '/a.webp', logo: true })
    expect(w!.findAll('img')).toHaveLength(1)
    expect(w!.find('canvas').exists()).toBe(false)
    expect(w!.html()).not.toMatch(/blur|drop-shadow|filter/)
    expect(w!.get('figure').classes()).toEqual(expect.arrayContaining(['bg-night-900', 'border', 'border-line']))
    expect(w!.get('img').attributes('data-fit')).toBe('contain')
  })

  it('is position: relative, does not clip (room for card sprouts) and holds a CardGarden seeded by the title', () => {
    make({ image: '/a.webp' })
    const article = w!.get('article')
    expect(article.classes()).toContain('relative')
    expect(article.classes().some((c) => c.startsWith('overflow-'))).toBe(false)
    expect(w!.findComponent({ name: 'CardGarden' }).props('seed')).toBe('T')
  })

  it('draws an accent underline under a spotlight title only when asked', () => {
    make({})
    expect(w!.find('[data-underline]').exists()).toBe(false)
    w!.unmount()
    make({ underline: true })
    expect(w!.get('h3 [data-underline]').attributes('aria-hidden')).toBe('true')
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
