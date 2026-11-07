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

  it('works with one and zero items without controls', () => {
    make(['only'])
    expect(w!.findAll('[aria-roledescription="slide"]')).toHaveLength(1)
    expect(w!.find('button').exists()).toBe(false)
    w!.unmount()
    make([])
    expect(w!.findAll('[aria-roledescription="slide"]')).toHaveLength(0)
    expect(w!.find('button').exists()).toBe(false)
  })
})
