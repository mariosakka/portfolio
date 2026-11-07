import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Directive, Ref } from 'vue'
import { revealNext } from './motion'
import type { Reveal } from './motion'

// Shared motion directives (transition vocabulary in the design doc). They only write data attributes and
// CSS variables; the looks live in style.css, and `prefers-reduced-motion` turns all of them off there too.

const query = (q: string) => typeof matchMedia === 'function' && matchMedia(q).matches
export const prefersReducedMotion = () => query('(prefers-reduced-motion: reduce)')
export const finePointer = () => query('(hover: hover) and (pointer: fine)')

// Reactive media query for components (false until mounted and in jsdom without matchMedia).
export function useMedia(q: string): Ref<boolean> {
  const on = ref(false)
  let mq: MediaQueryList | undefined
  const sync = () => { on.value = !!mq?.matches }
  onMounted(() => {
    if (typeof matchMedia !== 'function') return
    mq = matchMedia(q)
    sync()
    mq.addEventListener?.('change', sync)
  })
  onBeforeUnmount(() => mq?.removeEventListener?.('change', sync))
  return on
}

export type RevealVariant = 'fade-up' | 'scale' | 'slide' | 'wipe' | 'mask' | 'stagger'

// One observer for every entrance. The first report decides: off screen -> hidden ('pending') until it
// scrolls in; already (partly) on screen -> shown as is. Without an observer nothing is ever hidden.
let io: IntersectionObserver | undefined
function observer(): IntersectionObserver | undefined {
  if (io || typeof IntersectionObserver === 'undefined') return io
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const el = e.target as HTMLElement
      const cur = el.dataset.enter as Reveal | undefined
      const enough = e.intersectionRatio >= 0.15 || e.intersectionRect.height >= innerHeight * 0.25
      const next = revealNext(cur, cur ? enough : e.isIntersecting, prefersReducedMotion())
      if (next === 'static') delete el.dataset.enter
      else el.dataset.enter = next
      if (next !== 'pending') io?.unobserve(el)
    }
  }, { threshold: [0, 0.15, 0.3] })
  return io
}

export const vReveal: Directive<HTMLElement, RevealVariant | undefined> = {
  mounted(el, { value }) {
    el.dataset.reveal = value ?? 'fade-up'
    if (!prefersReducedMotion()) observer()?.observe(el)
  },
  unmounted(el) {
    io?.unobserve(el)
  },
}

// Pointer tilt (default) or magnet (v-pointer:magnet), mouse-like fine pointers only, never on touch or
// under reduced motion. Writes --px/--py in -1..1 at most once per frame.
const cleanups = new WeakMap<HTMLElement, () => void>()
export const vPointer: Directive<HTMLElement, undefined> = {
  mounted(el, { arg }) {
    el.dataset.pointer = arg === 'magnet' ? 'magnet' : 'tilt'
    let raf = 0
    let x = 0
    let y = 0
    let rect: DOMRect | undefined // read once per hover (pointerenter), not per move: no forced layout, no jitter
    const write = () => {
      raf = 0
      el.style.setProperty('--px', x.toFixed(3))
      el.style.setProperty('--py', y.toFixed(3))
    }
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen' || !finePointer() || prefersReducedMotion()) return
      rect ??= el.getBoundingClientRect()
      const r = rect
      if (!r.width || !r.height) return
      x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1))
      y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1))
      el.dataset.pointerOn = ''
      raf ||= requestAnimationFrame(write)
    }
    const enter = () => { rect = undefined }
    const leave = () => {
      rect = undefined
      cancelAnimationFrame(raf)
      raf = 0
      delete el.dataset.pointerOn
      el.style.removeProperty('--px')
      el.style.removeProperty('--py')
    }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    cleanups.set(el, () => {
      leave()
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
    })
  },
  unmounted(el) {
    cleanups.get(el)?.()
    cleanups.delete(el)
  },
}

// Subtle parallax for large images: one passive scroll listener for all of them, at most one write per
// frame, --parallax in -1..1 (element center vs viewport center). Not installed under reduced motion.
const parallaxEls = new Set<HTMLElement>()
let parallaxRaf = 0
function parallaxFrame() {
  parallaxRaf = 0
  for (const el of parallaxEls) {
    const r = el.getBoundingClientRect()
    if (r.bottom < 0 || r.top > innerHeight) continue
    const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight
    el.style.setProperty('--parallax', Math.max(-1, Math.min(1, p)).toFixed(3))
  }
}
const onParallaxScroll = () => { parallaxRaf ||= requestAnimationFrame(parallaxFrame) }
export const vParallax: Directive<HTMLElement, boolean | undefined> = {
  mounted(el, { value }) {
    if (value === false) return
    el.dataset.parallax = ''
    if (prefersReducedMotion()) return
    if (!parallaxEls.size) addEventListener('scroll', onParallaxScroll, { passive: true })
    parallaxEls.add(el)
    onParallaxScroll()
  },
  unmounted(el) {
    if (!parallaxEls.delete(el) || parallaxEls.size) return
    removeEventListener('scroll', onParallaxScroll)
    cancelAnimationFrame(parallaxRaf)
    parallaxRaf = 0
  },
}
