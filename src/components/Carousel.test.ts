import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { VueWrapper } from '@vue/test-utils'
import { h } from 'vue'
import Carousel from './Carousel.vue'
import { coverflowFrame } from '../lib/motion'

let w: VueWrapper | undefined
const scrollTo = vi.fn()
let reduced = false
beforeEach(() => {
  scrollTo.mockClear()
  reduced = false
  window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') && reduced })) as unknown as typeof window.matchMedia
  // jsdom has no layout scrolling; the carousel calls scrollTo on its track.
  HTMLElement.prototype.scrollTo = scrollTo as unknown as HTMLElement['scrollTo']
})
afterEach(() => { w?.unmount(); vi.useRealTimers(); vi.restoreAllMocks() })

const make = (items: string[]) => {
  w = mount(Carousel, {
    props: { items, label: 'Things' },
    slots: { slide: ({ item }: { item: unknown }) => h('a', { class: 'it', href: '#x' }, String(item)) },
    attachTo: document.body,
  }) as unknown as VueWrapper
  return w
}
const prev = () => w!.get('button[aria-label="Previous slide"]')
const next = () => w!.get('button[aria-label="Next slide"]')
const dots = () => w!.findAll('[data-dots] button')
const track = () => w!.get('[data-track]').element as HTMLElement
// Fake layout: slides 600px wide at x = 200 + 600 i in a 1000px track, scrollLeft settable.
function layout(n: number) {
  const t = track()
  ;[...t.children].forEach((c, i) => Object.defineProperties(c, { offsetLeft: { value: 200 + i * 600 }, offsetWidth: { value: 600 } }))
  let left = 0
  Object.defineProperties(t, { clientWidth: { value: 1000 }, scrollWidth: { value: 400 + n * 600 }, scrollLeft: { get: () => left, set: (v: number) => { left = v } } })
  return (v: number) => { left = v; t.dispatchEvent(new Event('scroll')) }
}

describe('Carousel (coverflow)', () => {
  it('is a labelled carousel region with labelled slides, the current one marked', () => {
    make(['a', 'b', 'c'])
    const r = w!.get('[role="region"]')
    expect(r.attributes('aria-roledescription')).toBe('carousel')
    expect(r.attributes('aria-label')).toBe('Things')
    const slides = w!.findAll('[aria-roledescription="slide"]')
    expect(slides.map((s) => s.attributes('aria-label'))).toEqual(['1 of 3', '2 of 3', '3 of 3'])
    expect(slides.map((s) => s.attributes('aria-current'))).toEqual(['true', undefined, undefined])
    expect(w!.findAll('.it').map((p) => p.text())).toEqual(['a', 'b', 'c'])
    expect(w!.get('[data-track]').attributes('aria-label')).toBe('Things slides')
  })

  it('one dot per slide, counter, prev disabled at the start and next at the end', async () => {
    make(['a', 'b'])
    expect(dots()).toHaveLength(2)
    expect(w!.text()).toContain('1 / 2')
    expect(prev().attributes('aria-disabled')).toBe('true')
    expect(prev().attributes('disabled')).toBeUndefined() // stays focusable
    await next().trigger('click')
    expect(w!.get('[aria-live]').text()).toContain('Slide 2 of 2')
    expect(next().attributes('aria-disabled')).toBe('true')
    expect(prev().attributes('aria-disabled')).toBeUndefined()
  })

  it('an arrow at its end keeps focus and does nothing when pressed', async () => {
    make(['a', 'b'])
    await next().trigger('click')
    scrollTo.mockClear()
    ;(next().element as HTMLButtonElement).focus()
    await next().trigger('click')
    expect(document.activeElement).toBe(next().element)
    expect(scrollTo).not.toHaveBeenCalled()
    expect(w!.text()).toContain('2 / 2')
  })

  it('next and dots center the chosen slide on the track', async () => {
    make(['a', 'b', 'c'])
    layout(3)
    await next().trigger('click')
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 600, behavior: 'smooth' }) // 800 + 300 - 500
    await dots()[2].trigger('click')
    expect(scrollTo).toHaveBeenLastCalledWith({ left: 1200, behavior: 'smooth' })
    expect(dots()[2].attributes('aria-current')).toBe('true')
  })

  it('arrow keys, Home and End on the track clamp at the ends; keys on a control inside stay native', async () => {
    make(['a', 'b', 'c'])
    const t = w!.get('[data-track]')
    expect(t.attributes('tabindex')).toBe('0')
    await t.trigger('keydown', { key: 'End' })
    expect(w!.text()).toContain('3 / 3')
    await t.trigger('keydown', { key: 'ArrowRight' })
    expect(w!.text()).toContain('3 / 3')
    await t.trigger('keydown', { key: 'ArrowLeft' })
    expect(w!.text()).toContain('2 / 3')
    await t.trigger('keydown', { key: 'Home' })
    expect(w!.text()).toContain('1 / 3')
    await dots()[0].trigger('keydown', { key: 'ArrowRight' })
    expect(w!.text()).toContain('1 / 3')
  })

  it('a click on a side slide centers it instead of following its link', async () => {
    make(['a', 'b', 'c'])
    layout(3)
    const e = new MouseEvent('click', { bubbles: true, cancelable: true })
    w!.findAll('.it')[1].element.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    await w!.vm.$nextTick()
    expect(w!.text()).toContain('2 / 3')
    const e2 = new MouseEvent('click', { bubbles: true, cancelable: true })
    w!.findAll('.it')[1].element.dispatchEvent(e2)
    expect(e2.defaultPrevented).toBe(false) // the centered slide's link works
  })

  it('poses every slide from the scroll position, one write per frame, and follows a settled swipe', async () => {
    vi.useFakeTimers()
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((f) => { frames.push(f); return frames.length })
    make(['a', 'b', 'c'])
    const scroll = layout(3)
    frames.splice(0).forEach((f) => f(0))
    scroll(300)
    scroll(600)
    expect(frames).toHaveLength(1) // throttled: two scroll events, one frame
    frames.splice(0).forEach((f) => f(0))
    const s = [...track().children] as HTMLElement[]
    expect(s[1].style.getPropertyValue('--cf-r')).toBe('0.00deg')
    expect(s[1].style.zIndex).toBe('100')
    expect(s[2].style.getPropertyValue('--cf-r')).toBe(`${coverflowFrame(1).rotate.toFixed(2)}deg`)
    expect(s[0].style.getPropertyValue('--cf-s')).toBe(coverflowFrame(-1).scale.toFixed(3))
    await vi.advanceTimersByTimeAsync(150)
    expect(w!.text()).toContain('2 / 3')
  })

  it('under reduced motion: instant scrolling and no pose variables', async () => {
    reduced = true
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((f) => { f(0); return 0 })
    make(['a', 'b'])
    const scroll = layout(2)
    scroll(600)
    expect((track().children[0] as HTMLElement).style.getPropertyValue('--cf-r')).toBe('')
    await next().trigger('click')
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ behavior: 'auto' }))
  })

  it('one and zero items: no controls', () => {
    make(['only'])
    expect(w!.get('[aria-roledescription="slide"]').classes()).toContain('basis-full')
    expect(w!.find('button').exists()).toBe(false)
    w!.unmount()
    make([])
    expect(w!.findAll('[aria-roledescription="slide"]')).toHaveLength(0)
  })
})
