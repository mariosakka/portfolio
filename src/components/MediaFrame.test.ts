import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import MediaFrame from './MediaFrame.vue'
import CardGarden from './CardGarden.vue'

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
  it('is an empty seam today: renders only its slot, with harmless defaults', () => {
    const w = mount(CardGarden, { props: { seed: 3 }, slots: { default: '<i>x</i>' } })
    expect(w.html()).toBe('<i>x</i>')
    expect(w.props()).toEqual({ seed: 3, variant: 'default', density: 1, active: true })
    expect(mount(CardGarden, { props: { seed: 'a' } }).text()).toBe('')
  })
})
