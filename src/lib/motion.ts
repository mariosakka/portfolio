// Pure helpers behind the section arrangements and transitions (see the design doc, "Transition vocabulary").

export type Fit = 'contain' | 'cover'
interface Size { w: number; h: number }

// 'auto' crops (cover) only when the image shape is within 25% of the frame shape, so little is lost;
// anything else (screenshots, wide banners, logos) is shown whole. Unknown sizes contain.
export function imageFit(mode: Fit | 'auto', image: Size, frame: Size): Fit {
  if (mode !== 'auto') return mode
  if (!image.w || !image.h || !frame.w || !frame.h) return 'contain'
  const r = (image.w / image.h) / (frame.w / frame.h)
  return r >= 0.75 && r <= 1.34 ? 'cover' : 'contain'
}

// Coverflow pose of a slide `offset` slide-widths from the track center (negative = left).
// rotate: deg around Y (neighbors face the center); shift: fraction of the slide width toward the center.
export function coverflowFrame(offset: number): { rotate: number; scale: number; shift: number; opacity: number; z: number } {
  const o = Math.max(-3, Math.min(3, offset))
  const a = Math.abs(o)
  const near = Math.min(a, 1)
  const zero = (v: number) => (Object.is(v, -0) ? 0 : v)
  return {
    rotate: zero(-Math.sign(o) * near * 34),
    scale: 1 - Math.min(a, 2) * 0.12,
    shift: zero(-Math.sign(o) * Math.min(a, 2) * 0.16),
    opacity: Math.max(0, +(1 - near * 0.35 - Math.max(0, a - 1) * 0.65).toFixed(3)),
    z: 100 - Math.round(a * 10),
  }
}

// Card deck: `top` is the visible card; `moving` is the card that flies out to side `dir` after "next"
// and is tucked behind the stack on "settle".
export interface Deck { top: number; moving: number | null; dir: -1 | 1 }
export type DeckAction = { type: 'next'; dir?: -1 | 1 } | { type: 'prev' } | { type: 'settle' }
export function deckStep(s: Deck, a: DeckAction, n: number): Deck {
  if (a.type === 'settle') return { ...s, moving: null }
  if (n < 2) return s
  if (a.type === 'next') return { top: (s.top + 1) % n, moving: s.top, dir: a.dir ?? -1 }
  return { top: (s.top - 1 + n) % n, moving: null, dir: s.dir }
}
export const deckDepth = (i: number, top: number, n: number): number => (i - top + n) % n

// A drag counts as a swipe past 60px or a fifth of the card, whichever is smaller.
export function swipeDirection(dx: number, width: number): -1 | 0 | 1 {
  return Math.abs(dx) >= Math.min(60, width / 5) ? (dx < 0 ? -1 : 1) : 0
}

// Arrow keys (both orientations), Home and End over n items; null for other keys.
export function stepIndex(key: string, i: number, n: number, wrap = true): number | null {
  if (n < 1) return null
  const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[key]
  if (key === 'Home') return 0
  if (key === 'End') return n - 1
  if (d === undefined) return null
  return wrap ? (i + d + n) % n : Math.max(0, Math.min(n - 1, i + d))
}

// Entrance state, attribute data-enter. Content starts visible; it is hidden ('pending') only after an
// IntersectionObserver reported it off screen, so a missing or silent observer never leaves it hidden.
export type Reveal = 'static' | 'pending' | 'in'
export function revealNext(current: Reveal | undefined, visible: boolean, reduced: boolean): Reveal {
  if (reduced) return 'static'
  if (current === 'in' || visible) return 'in'
  return 'pending'
}
