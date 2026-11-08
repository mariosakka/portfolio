import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MediaFrame from './MediaFrame.vue'
import CardGarden from './CardGarden.vue'
import { Sprouts } from '@mariosakka/sprouts-vue'

const load = async (w: ReturnType<typeof mount>, nw: number, nh: number, fw: number, fh: number) => {
  Object.defineProperties(w.element, { clientWidth: { value: fw }, clientHeight: { value: fh } })
  const img = w.get('img')
  Object.defineProperties(img.element, { naturalWidth: { value: nw }, naturalHeight: { value: nh } })
  await img.trigger('load')
  return img
}

describe('MediaFrame', () => {
  it('a framed flat surface with a thin border and rounded corners', () => {
    const w = mount(MediaFrame, { props: { src: '/a.webp', alt: 'A' } })
    expect(w.get('figure').classes()).toEqual(expect.arrayContaining(['bg-night-900', 'border-line', 'rounded-[1.35rem]', 'overflow-hidden']))
    expect(w.get('img').attributes('alt')).toBe('A')
    expect(w.get('img').attributes('data-fit')).toBe('contain') // before load
  })

  it('auto covers an image shaped like its frame and contains a phone screenshot', async () => {
    const a = mount(MediaFrame, { props: { src: '/a.webp' } })
    expect((await load(a, 960, 720, 400, 300)).classes()).toContain('object-cover')
    const b = mount(MediaFrame, { props: { src: '/b.webp' } })
    expect((await load(b, 960, 1707, 400, 300)).classes()).toContain('object-contain')
  })

  it('logos are always contained, an explicit fit wins', async () => {
    const logo = mount(MediaFrame, { props: { src: '/l.webp', logo: true } })
    expect((await load(logo, 400, 300, 400, 300)).attributes('data-fit')).toBe('contain')
    const cover = mount(MediaFrame, { props: { src: '/c.webp', fit: 'cover' } })
    expect(cover.get('img').classes()).toContain('object-cover')
  })

  it('parallax is opt-in', () => {
    expect(mount(MediaFrame, { props: { src: '/a.webp' } }).get('img').attributes('data-parallax')).toBeUndefined()
    expect(mount(MediaFrame, { props: { src: '/a.webp', parallax: true } }).get('img').attributes('data-parallax')).toBe('')
  })
})

describe('CardGarden', () => {
  it('renders the published Sprouts overlay beside its slot, with its stable layout props passed through', () => {
    const w = mount(CardGarden, { props: { seed: 'card-x', density: 3, reach: 44, isStatic: true }, slots: { default: '<i>x</i>' } })
    const sprouts = w.findComponent(Sprouts)
    expect(sprouts.exists()).toBe(true)
    expect(sprouts.props()).toMatchObject({ seed: 'card-x', density: 3, reach: 44, variant: 'auto', static: true })
    expect(w.get('.sprouts').attributes('aria-hidden')).toBe('true')
    expect(w.html()).toContain('<i>x</i>')
  })

  it('maps variant default to auto and passes a pinned variant through', () => {
    expect(mount(CardGarden, { props: { seed: 1 } }).findComponent(Sprouts).props('variant')).toBe('auto')
    expect(mount(CardGarden, { props: { seed: 1, variant: 'hang' } }).findComponent(Sprouts).props('variant')).toBe('hang')
  })

  it.each([[true, 56], [false, 32]])('passes the slot reach by breakpoint (wide %s: %spx), or the override', async (wide, px) => {
    const saved = window.matchMedia
    window.matchMedia = ((q: string) => ({ matches: q.includes('640px') && wide })) as unknown as typeof window.matchMedia
    const w = mount(CardGarden, { props: { seed: 1 }, slots: { default: '<b>{{ params.reach }}</b>' } })
    await w.vm.$nextTick()
    expect(w.text()).toBe(String(px))
    expect(mount(CardGarden, { props: { seed: 1, reach: 10 }, slots: { default: '<b>{{ params.reach }}</b>' } }).text()).toBe('10')
    window.matchMedia = saved
  })
})
