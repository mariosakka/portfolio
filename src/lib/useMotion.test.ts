import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, withDirectives } from 'vue'
import { vParallax, vPointer, vReveal } from './useMotion'

// One fake IntersectionObserver for the module's shared observer; tests feed it entries by hand.
type Cb = (entries: Partial<IntersectionObserverEntry>[]) => void
let fire: Cb = () => {}
const observed = new Set<Element>()
beforeAll(() => {
  globalThis.IntersectionObserver = class {
    constructor(cb: Cb) { fire = cb }
    observe(el: Element) { observed.add(el) }
    unobserve(el: Element) { observed.delete(el) }
    disconnect() {}
  } as unknown as typeof IntersectionObserver
})
let reduced = false
let fine = true
window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') ? reduced : fine })) as unknown as typeof window.matchMedia
afterEach(() => { reduced = false; fine = true; document.body.innerHTML = '' })

const withDir = (dir: Parameters<typeof withDirectives>[1][number]) =>
  mount(defineComponent({ render: () => withDirectives(h('div', { class: 'box' }, 'Hello'), [dir]) }), { attachTo: document.body })
const entry = (el: Element, isIntersecting: boolean, ratio = isIntersecting ? 0.5 : 0) =>
  ({ target: el, isIntersecting, intersectionRatio: ratio, intersectionRect: { height: ratio * 400 } as DOMRectReadOnly })

describe('vReveal', () => {
  it('content is visible until the observer reports it off screen, then reveals once', () => {
    const w = withDir([vReveal, 'wipe'])
    const el = w.get('.box').element as HTMLElement
    expect(el.dataset.reveal).toBe('wipe')
    expect(el.dataset.enter).toBeUndefined() // no observer report yet: nothing hidden
    fire([entry(el, false)])
    expect(el.dataset.enter).toBe('pending')
    fire([entry(el, true, 0.05)]) // barely in: keep waiting
    expect(el.dataset.enter).toBe('pending')
    fire([entry(el, true)])
    expect(el.dataset.enter).toBe('in')
    expect(observed.has(el)).toBe(false)
    w.unmount()
  })

  it('an element already on screen is never hidden', () => {
    const w = withDir([vReveal])
    const el = w.get('.box').element as HTMLElement
    fire([entry(el, true, 0.02)])
    expect(el.dataset.enter).toBe('in')
    expect(el.dataset.reveal).toBe('fade-up')
    w.unmount()
  })

  it('under reduced motion it is not observed and never hidden', () => {
    reduced = true
    const w = withDir([vReveal, 'scale'])
    const el = w.get('.box').element as HTMLElement
    expect(observed.has(el)).toBe(false)
    expect(el.dataset.enter).toBeUndefined()
    w.unmount()
  })
})

describe('vPointer', () => {
  const rect = { left: 0, top: 0, width: 200, height: 100 } as DOMRect
  const move = (el: Element, pointerType: string) => {
    const e = new MouseEvent('pointermove', { clientX: 150, clientY: 25 })
    Object.defineProperty(e, 'pointerType', { value: pointerType })
    el.dispatchEvent(e)
  }
  it('writes the pointer position for a mouse, once per frame, and resets on leave', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((f) => { f(0); return 0 }) // sync frame
    const w = withDir([vPointer, undefined, 'magnet'])
    const el = w.get('.box').element as HTMLElement
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect)
    expect(el.dataset.pointer).toBe('magnet')
    move(el, 'mouse')
    expect([el.style.getPropertyValue('--px'), el.style.getPropertyValue('--py')]).toEqual(['0.500', '-0.500'])
    expect(el.dataset.pointerOn).toBe('')
    el.dispatchEvent(new MouseEvent('pointerleave'))
    expect(el.style.getPropertyValue('--px')).toBe('')
    expect(el.dataset.pointerOn).toBeUndefined()
    raf.mockRestore()
    w.unmount()
  })
  it.each([
    ['touch', true, false],
    ['mouse', false, false],
    ['mouse', true, true],
  ])('ignores %s (fine pointer %s, reduced %s)', (type, isFine, isReduced) => {
    fine = isFine
    reduced = isReduced
    const w = withDir([vPointer])
    const el = w.get('.box').element as HTMLElement
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect)
    move(el, type)
    expect(el.dataset.pointer).toBe('tilt')
    expect(el.dataset.pointerOn).toBeUndefined()
    expect(el.style.getPropertyValue('--px')).toBe('')
    w.unmount()
  })
})

describe('vParallax', () => {
  it('writes the offset from the viewport center on scroll, not under reduced motion', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((f) => { f(0); return 0 }) // sync frame
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })
    const w = withDir([vParallax])
    const el = w.get('.box').element as HTMLElement
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ top: 500, bottom: 700, height: 200 } as DOMRect)
    window.dispatchEvent(new Event('scroll'))
    expect(el.style.getPropertyValue('--parallax')).toBe('0.250')
    w.unmount()
    reduced = true
    const w2 = withDir([vParallax])
    const el2 = w2.get('.box').element as HTMLElement
    window.dispatchEvent(new Event('scroll'))
    expect(el2.style.getPropertyValue('--parallax')).toBe('')
    raf.mockRestore()
    w2.unmount()
  })
})
