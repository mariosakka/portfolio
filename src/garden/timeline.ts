import { ref, unref, watch, onBeforeUnmount } from 'vue'
import type { Ref } from 'vue'
import type { GrowthPhase, TimelineOptions } from './types'

/** Where each stage of the single 0..1 growth timeline starts and ends. */
export const PHASES = {
  stem: [0, 0.18],
  leaf: [0.1, 0.28],
  calyx: [0.2, 0.3],
  bud: [0.26, 0.42],
  open: [0.42, 0.68],
  stamen: [0.68, 0.84],
  pollen: [0.82, 0.95],
} as const

export const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))
export const ramp = (p: number, a: number, b: number): number => (b <= a ? (p >= b ? 1 : 0) : clamp01((p - a) / (b - a)))
export const easeOut = (t: number): number => 1 - (1 - t) ** 3

/**
 * Pure mapping from plant progress to every stage: stem, leaves, calyx, bud, petals opening, stamens,
 * pollen. Each value is monotonic non-decreasing. Stamens stay at 0 until the petals are fully open
 * and pollen stays at 0 until the filaments are nearly grown.
 */
export function phase(progress: number): GrowthPhase {
  const p = clamp01(progress)
  return {
    stem: ramp(p, ...PHASES.stem),
    leaf: ramp(p, ...PHASES.leaf),
    calyx: ramp(p, ...PHASES.calyx),
    bud: ramp(p, ...PHASES.bud),
    open: ramp(p, ...PHASES.open),
    stamen: ramp(p, ...PHASES.stamen),
    pollen: ramp(p, ...PHASES.pollen),
    idle: p >= 1,
  }
}

/** How far one petal has unfurled (0..1) for a given `open`. Layer 0 (outermost) opens first. */
export function petalPhase(open: number, layer: number, layers: number, index: number, count: number): number {
  const start = (layer / layers) * 0.45 + (index / Math.max(1, count)) * 0.15
  return easeOut(ramp(open, start, start + 0.4))
}

/**
 * Tween a plant's progress 0 -> 1 over `duration` ms once `start` becomes true. Reduced motion, a missing
 * requestAnimationFrame or `isStatic` jump straight to the final state (1).
 */
export function useGrowthTimeline(start: Ref<boolean>, { duration = 3200, delay = 0, isStatic = false }: TimelineOptions = {}): Ref<number> {
  const reduce = typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const noRaf = typeof requestAnimationFrame === 'undefined'
  const progress = ref(reduce || noRaf || unref(isStatic) ? 1 : 0)
  let raf = 0
  let t0 = 0
  const tick = (): void => {
    const p = clamp01((performance.now() - t0 - delay) / duration)
    progress.value = p
    raf = p < 1 ? requestAnimationFrame(tick) : 0
  }
  watch(start, (on) => {
    if (!on || progress.value >= 1 || raf) return
    t0 = performance.now()
    raf = requestAnimationFrame(tick)
  }, { immediate: true })
  watch(() => unref(isStatic), (s) => { if (s) { cancelAnimationFrame(raf); raf = 0; progress.value = 1 } })
  onBeforeUnmount(() => { if (raf) cancelAnimationFrame(raf) })
  return progress
}
