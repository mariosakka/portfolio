import { describe, expect, it } from 'vitest'
import { bentoSpan, coverflowFrame, deckDepth, deckStep, imageFit, monogram, revealNext, stepIndex, swipeDirection } from './motion'

describe('imageFit', () => {
  it('honors an explicit mode', () => {
    expect(imageFit('cover', { w: 100, h: 900 }, { w: 400, h: 300 })).toBe('cover')
    expect(imageFit('contain', { w: 400, h: 300 }, { w: 400, h: 300 })).toBe('contain')
  })
  it('auto covers when the image shape is close to the frame and contains otherwise', () => {
    expect(imageFit('auto', { w: 960, h: 720 }, { w: 400, h: 300 })).toBe('cover')
    expect(imageFit('auto', { w: 960, h: 960 }, { w: 400, h: 300 })).toBe('cover') // ratio 0.75: a slim crop
    expect(imageFit('auto', { w: 960, h: 1707 }, { w: 400, h: 300 })).toBe('contain') // phone screenshot
    expect(imageFit('auto', { w: 240, h: 135 }, { w: 300, h: 400 })).toBe('contain')
  })
  it('auto contains until both sizes are known', () => {
    expect(imageFit('auto', { w: 0, h: 0 }, { w: 400, h: 300 })).toBe('contain')
    expect(imageFit('auto', { w: 400, h: 300 }, { w: 0, h: 0 })).toBe('contain')
  })
})

describe('coverflowFrame', () => {
  it('the centered slide is flat, full size and on top', () => {
    expect(coverflowFrame(0)).toEqual({ rotate: 0, scale: 1, shift: 0, opacity: 1, z: 100 })
  })
  it('neighbors turn toward the center, shrink, slide in and sit lower, symmetrically', () => {
    const r = coverflowFrame(1)
    const l = coverflowFrame(-1)
    expect(r.rotate).toBeLessThan(0)
    expect(l.rotate).toBe(-r.rotate)
    expect(r.scale).toBeLessThan(1)
    expect(l.scale).toBe(r.scale)
    expect(r.shift).toBeLessThan(0)
    expect(l.shift).toBe(-r.shift)
    expect(r.z).toBeLessThan(100)
  })
  it('clamps far slides and fades them out, and interpolates between', () => {
    expect(coverflowFrame(5)).toEqual(coverflowFrame(3))
    expect(coverflowFrame(3).opacity).toBe(0)
    const half = coverflowFrame(0.5)
    expect(half.rotate).toBeCloseTo(coverflowFrame(1).rotate / 2)
    expect(half.scale).toBeGreaterThan(coverflowFrame(1).scale)
    expect(coverflowFrame(1).opacity).toBeCloseTo(0.65) // neighbors dimmed, still visible
    expect(coverflowFrame(2).opacity).toBe(0)
  })
})

describe('deck', () => {
  const s0 = { top: 0, moving: null, dir: -1 as const }
  it('next sends the top card out to the swipe side and shows the following one, wrapping', () => {
    const s1 = deckStep(s0, { type: 'next' }, 3)
    expect(s1).toEqual({ top: 1, moving: 0, dir: -1 })
    expect(deckStep({ top: 2, moving: null, dir: -1 }, { type: 'next', dir: 1 }, 3)).toEqual({ top: 0, moving: 2, dir: 1 })
  })
  it('prev brings the last card back on top without a fly-out', () => {
    expect(deckStep(s0, { type: 'prev' }, 3)).toEqual({ top: 2, moving: null, dir: -1 })
  })
  it('settle clears the moving card; a single card never moves', () => {
    expect(deckStep({ top: 1, moving: 0, dir: 1 }, { type: 'settle' }, 3)).toEqual({ top: 1, moving: null, dir: 1 })
    expect(deckStep(s0, { type: 'next' }, 1)).toEqual(s0)
    expect(deckStep(s0, { type: 'prev' }, 0)).toEqual(s0)
  })
  it('depth counts cards below the top', () => {
    expect([0, 1, 2].map((i) => deckDepth(i, 1, 3))).toEqual([2, 0, 1])
  })
  it('swipeDirection needs a real drag', () => {
    expect(swipeDirection(-10, 300)).toBe(0)
    expect(swipeDirection(-80, 300)).toBe(-1)
    expect(swipeDirection(90, 300)).toBe(1)
    expect(swipeDirection(70, 1000)).toBe(1) // 60px is enough on wide cards
  })
})

describe('stepIndex', () => {
  it('arrows move and wrap in both orientations', () => {
    expect(stepIndex('ArrowDown', 0, 3)).toBe(1)
    expect(stepIndex('ArrowRight', 2, 3)).toBe(0)
    expect(stepIndex('ArrowUp', 0, 3)).toBe(2)
    expect(stepIndex('ArrowLeft', 1, 3)).toBe(0)
  })
  it('clamps instead of wrapping when asked, Home and End jump, other keys are ignored', () => {
    expect(stepIndex('ArrowDown', 2, 3, false)).toBe(2)
    expect(stepIndex('ArrowUp', 0, 3, false)).toBe(0)
    expect(stepIndex('Home', 2, 3)).toBe(0)
    expect(stepIndex('End', 0, 3)).toBe(2)
    expect(stepIndex('Enter', 1, 3)).toBeNull()
    expect(stepIndex('ArrowDown', 0, 0)).toBeNull()
  })
})

describe('revealNext', () => {
  it('stays static under reduced motion', () => {
    expect(revealNext(undefined, false, true)).toBe('static')
  })
  it('only hides an element the observer reported off screen, so it never hides without the observer', () => {
    expect(revealNext(undefined, true, false)).toBe('in') // already in view: shown, no animation from hidden
    expect(revealNext(undefined, false, false)).toBe('pending')
    expect(revealNext('pending', true, false)).toBe('in')
    expect(revealNext('pending', false, false)).toBe('pending')
  })
  it('never animates twice', () => {
    expect(revealNext('in', false, false)).toBe('in')
  })
})

describe('bentoSpan and monogram', () => {
  it('fills the 4x2 desktop grid for 2 to 5 tiles and keeps phone rows full', () => {
    expect([0, 1, 2, 3, 4].map((i) => bentoSpan(i, 5))).toEqual(['col-span-2 md:col-span-2 md:row-span-2', '', '', '', ''])
    expect([0, 1, 2, 3].map((i) => bentoSpan(i, 4))).toEqual(['md:col-span-2 md:row-span-2', '', '', 'md:col-span-2'])
    expect([0, 1, 2].map((i) => bentoSpan(i, 3))).toEqual(['col-span-2 md:col-span-2 md:row-span-2', 'md:col-span-2', 'md:col-span-2'])
    expect(bentoSpan(1, 2)).toBe('md:col-span-2 md:row-span-2')
    expect(bentoSpan(6, 8)).toBe('')
  })
  it('the large tile can be any index; the phone-wide first tile is then a single cell from md', () => {
    expect([0, 1, 2, 3, 4].map((i) => bentoSpan(i, 5, 1))).toEqual(['col-span-2 md:col-span-1', 'md:col-span-2 md:row-span-2', '', '', ''])
    expect([0, 1, 2, 3].map((i) => bentoSpan(i, 4, 1))).toEqual(['', 'md:col-span-2 md:row-span-2', '', 'md:col-span-2'])
    expect(bentoSpan(0, 3, 2)).toBe('col-span-2 md:col-span-2')
  })
  it('monogram takes up to two initials of real words', () => {
    expect(monogram('Microsoft')).toBe('M')
    expect(monogram('GDG Europe')).toBe('GE')
    expect(monogram('  - FILS-UPB ')).toBe('F')
    expect(monogram('')).toBe('')
  })
})
