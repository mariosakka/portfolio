import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import Carousel from './Carousel.vue'

let w: VueWrapper | undefined
const scrollTo = vi.fn()
beforeEach(() => {
  scrollTo.mockClear()
  // jsdom has no layout scrolling; the carousel calls scrollTo on its track.
  HTMLElement.prototype.scrollTo = scrollTo as unknown as HTMLElement['scrollTo']
})
afterEach(() => w?.unmount())

const make = (items: string[]) => {
  w = mount(Carousel, {
    props: { items, label: 'Things' },
    slots: { slide: ({ item }: { item: unknown }) => h('p', { class: 'it' }, String(item)) },
    attachTo: document.body,
  }) as unknown as VueWrapper
  return w
}
const prev = () => w!.get('button[aria-label="Previous slide"]')
const next = () => w!.get('button[aria-label="Next slide"]')
const dots = () => w!.findAll('[data-dots] button')

describe('Carousel', () => {
  it('is a labelled carousel region with labelled slides', () => {
    make(['a', 'b', 'c'])
    const r = w!.get('[role="region"]')
    expect(r.attributes('aria-roledescription')).toBe('carousel')
    expect(r.attributes('aria-label')).toBe('Things')
    const slides = w!.findAll('[aria-roledescription="slide"]')
    expect(slides.map((s) => s.attributes('role'))).toEqual(['group', 'group', 'group'])
    expect(slides.map((s) => s.attributes('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3'])
    expect(w!.findAll('.it').map((p) => p.text())).toEqual(['a', 'b', 'c'])
  })

  it('renders one dot per slide with the current one marked', () => {
    make(['a', 'b', 'c'])
    expect(dots()).toHaveLength(3)
    expect(dots().map((d) => d.attributes('aria-current'))).toEqual(['true', undefined, undefined])
    expect(w!.text()).toContain('1 / 3')
  })

  it('disables prev at the start and next at the end', async () => {
    make(['a', 'b'])
    expect(prev().attributes('disabled')).toBeDefined()
    expect(next().attributes('disabled')).toBeUndefined()
    await next().trigger('click')
    expect(prev().attributes('disabled')).toBeUndefined()
    expect(next().attributes('disabled')).toBeDefined()
  })

  it('scrolls the track on next and dot clicks', async () => {
    make(['a', 'b', 'c'])
    await next().trigger('click')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(w!.text()).toContain('2 / 3')
    await dots()[2].trigger('click')
    expect(scrollTo).toHaveBeenCalledTimes(2)
    expect(dots()[2].attributes('aria-current')).toBe('true')
  })

  it('handles ArrowRight and ArrowLeft on the track', async () => {
    make(['a', 'b', 'c'])
    const track = w!.get('[data-track]')
    expect(track.attributes('tabindex')).toBe('0')
    await track.trigger('keydown', { key: 'ArrowRight' })
    await track.trigger('keydown', { key: 'ArrowRight' })
    expect(w!.text()).toContain('3 / 3')
    await track.trigger('keydown', { key: 'ArrowRight' })
    expect(w!.text()).toContain('3 / 3')
    await track.trigger('keydown', { key: 'ArrowLeft' })
    expect(w!.text()).toContain('2 / 3')
  })

  it('follows native scrolling (swipe) once it settles, and the end', async () => {
    vi.useFakeTimers()
    make(['a', 'b', 'c'])
    const t = w!.get('[data-track]').element as HTMLElement
    ;[...t.children].forEach((c, i) => Object.defineProperty(c, 'offsetLeft', { value: i * 100 }))
    Object.defineProperties(t, { clientWidth: { value: 120 }, scrollWidth: { value: 300 }, scrollLeft: { value: 95, writable: true } })
    t.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(150)
    expect(w!.text()).toContain('2 / 3')
    t.scrollLeft = 180
    t.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(150)
    expect(dots()[2].attributes('aria-current')).toBe('true')
    vi.useRealTimers()
  })

  it('announces position with context and names the scrollable track', async () => {
    make(['a', 'b', 'c'])
    await next().trigger('click')
    expect(w!.get('[aria-live]').text()).toContain('Slide 2 of 3')
    expect(w!.get('[data-track]').attributes('aria-label')).toBe('Things slides')
  })

  it('arrow keys on a control inside keep native behavior', async () => {
    make(['a', 'b', 'c'])
    await dots()[0].trigger('keydown', { key: 'ArrowRight' })
    await next().trigger('keydown', { key: 'ArrowRight' })
    expect(w!.text()).toContain('1 / 3')
  })

  it('uses instant scrolling under reduced motion, smooth otherwise', async () => {
    const mm = window.matchMedia
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia
    make(['a', 'b'])
    await next().trigger('click')
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'auto' }))
    window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
    await prev().trigger('click')
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'smooth' }))
    window.matchMedia = mm
  })

  describe('with layout', () => {
    // Fake layout: slides at `offsets`, a track `client` px wide and `scroll` px of content.
    // scrollTo clamps like a browser and fires a scroll event, so the settle sync runs too.
    async function layout(offsets: number[], client: number, scroll: number) {
      vi.useFakeTimers()
      make(offsets.map((_, i) => `s${i}`))
      const t = w!.get('[data-track]').element as HTMLElement
      ;[...t.children].forEach((c, i) => Object.defineProperty(c, 'offsetLeft', { value: offsets[i] }))
      let left = 0
      Object.defineProperties(t, {
        clientWidth: { value: client },
        scrollWidth: { value: scroll },
        scrollLeft: { get: () => left, set: (v: number) => { left = v } },
      })
      t.scrollTo = vi.fn((o: ScrollToOptions) => {
        left = Math.max(0, Math.min(o.left ?? 0, scroll - client))
        t.dispatchEvent(new Event('scroll'))
      }) as unknown as HTMLElement['scrollTo']
      window.dispatchEvent(new Event('resize'))
      await vi.advanceTimersByTimeAsync(0)
      return { left: () => left }
    }
    const settle = () => vi.advanceTimersByTimeAsync(200)
    const counter = () => w!.get('[aria-live] [aria-hidden]').text().replace(/\s+/g, ' ')
    const currentDot = () => dots().findIndex((d) => d.attributes('aria-current') === 'true')
    afterEach(() => vi.useRealTimers())

    it('one slide in view: Next visits every slide once, the last stop is the scroll end', async () => {
      const s = await layout([0, 830, 1660], 960, 2466)
      expect(dots()).toHaveLength(3)
      const seen: [string, number, number][] = []
      for (let k = 0; k < 2; k++) {
        await next().trigger('click')
        await settle()
        seen.push([counter(), currentDot(), s.left()])
      }
      expect(seen).toEqual([['2 / 3', 1, 830], ['3 / 3', 2, 1506]])
      expect(next().attributes('disabled')).toBeDefined()
    })

    it('two slides in view: stops are only the reachable positions, Next never skips, Prev reverses', async () => {
      // 4 slides 460px wide + 24px gap in a 960px track: max scroll 952, so slides 3 and 4 share the end stop.
      const s = await layout([0, 484, 968, 1452], 960, 1912)
      expect(dots()).toHaveLength(3)
      expect(counter()).toBe('1 / 3')
      const fwd: [string, number, number][] = []
      for (let k = 0; k < 2; k++) {
        await next().trigger('click')
        await settle()
        fwd.push([counter(), currentDot(), s.left()])
      }
      expect(fwd).toEqual([['2 / 3', 1, 484], ['3 / 3', 2, 952]])
      expect(next().attributes('disabled')).toBeDefined()
      const back: [string, number, number][] = []
      for (let k = 0; k < 2; k++) {
        await prev().trigger('click')
        await settle()
        back.push([counter(), currentDot(), s.left()])
      }
      expect(back).toEqual([['2 / 3', 1, 484], ['1 / 3', 0, 0]])
      expect(prev().attributes('disabled')).toBeDefined()
    })

    it('a dot jump and a swipe that ends between stops settle on the nearest stop', async () => {
      const s = await layout([0, 484, 968, 1452], 960, 1912)
      await dots()[2].trigger('click')
      await settle()
      expect([counter(), s.left()]).toEqual(['3 / 3', 952])
      const t = w!.get('[data-track]').element as HTMLElement
      t.scrollLeft = 520
      t.dispatchEvent(new Event('scroll'))
      await settle()
      expect([counter(), currentDot()]).toEqual(['2 / 3', 1])
    })

    it('everything fits: one stop, no controls', async () => {
      await layout([0, 484], 960, 944)
      expect(w!.find('[data-dots]').exists()).toBe(false)
    })
  })

  it('works with one and zero items without controls', () => {
    make(['only'])
    expect(w!.findAll('[aria-roledescription="slide"]')).toHaveLength(1)
    expect(w!.get('[aria-roledescription="slide"]').classes()).toContain('basis-full')
    expect(w!.find('button').exists()).toBe(false)
    w!.unmount()
    make([])
    expect(w!.findAll('[aria-roledescription="slide"]')).toHaveLength(0)
    expect(w!.find('button').exists()).toBe(false)
  })
})
