import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { Sprouts, layoutSprouts, pickVariant, SPROUT_VARIANTS, SPROUT_FLOWERS, SPROUT_OVERLAP, enqueueGrowth, growthStats, MAX_GROWING_PLANTS, growPlant, parsePath, pointAt, LEAF } from './index'
import type { Pt, SproutDensity, SproutLayout, SproutVariant, SproutsProps } from './index'

const DENSITIES: SproutDensity[] = [1, 2, 3]
const SIZES: [number, number][] = [[24, 20], [60, 40], [160, 100], [320, 200], [640, 360], [1200, 900], [180, 640], [960, 140]]
const LEAF_MODEL = parsePath(LEAF.d.replace(/Z$/, ''))

/** How far a point lies inside the parent rect (negative = outside). */
const depth = (p: Pt, w: number, hh: number): number => Math.min(p.x, w - p.x, p.y, hh - p.y)

/** Every drawn point of a layout: [point, half stroke width]. */
function artPoints(L: SproutLayout): [Pt, number][] {
  const out: [Pt, number][] = []
  const leaf = (x: number, y: number, rot: number, size: number): void => {
    const c = Math.cos((rot * Math.PI) / 180)
    const s = Math.sin((rot * Math.PI) / 180)
    for (let f = 0; f <= 1; f += 1 / 32) {
      const q = pointAt(LEAF_MODEL, f)
      out.push([{ x: x + (q.x * c - q.y * s) * size, y: y + (q.x * s + q.y * c) * size }, 0.5])
    }
  }
  for (const v of L.vines) for (let f = 0; f <= 1; f += 1 / 200) out.push([pointAt(v.path, f), v.width / 2])
  for (const lf of L.leaves) leaf(lf.x, lf.y, lf.rotate, lf.size)
  for (const p of L.plants) {
    for (const n of growPlant(p.spec).nodes) {
      for (let f = 0; f <= 1; f += 1 / 40) out.push([pointAt(n.stem, f), 1.1])
      for (const l of n.leaves) leaf(l.x, l.y, l.rotate, l.size)
      const r = n.flower.extent * n.at.scale
      for (let a = 0; a < 360; a += 15) out.push([{ x: n.at.x + r * Math.cos((a * Math.PI) / 180), y: n.at.y + r * Math.sin((a * Math.PI) / 180) }, 0])
      out.push([{ x: n.at.x, y: n.at.y }, 0])
    }
  }
  return out
}

describe('layoutSprouts containment', () => {
  it('never draws deeper than the allowed overlap inside the parent, nor outside the reach ring', () => {
    let checked = 0
    for (const variant of [...SPROUT_VARIANTS, 'auto'] as const) {
      for (const density of DENSITIES) {
        for (const [w, hh] of SIZES) {
          for (const seed of [0, 1, 2, 5, 'card-a', 'photo']) {
            const reach = typeof seed === 'number' && seed % 2 ? 64 : 40
            const L = layoutSprouts({ seed, variant, density, width: w, height: hh, reach })
            const id = `${variant}/${density}/${w}x${hh}/${seed}`
            let deepest = -Infinity
            let ring = 0
            for (const [p, half] of artPoints(L)) {
              deepest = Math.max(deepest, depth(p, w, hh) + half)
              ring = Math.max(ring, -p.x - reach, p.x - w - reach, -p.y - reach, p.y - hh - reach)
              checked++
            }
            expect(deepest, id).toBeLessThanOrEqual(SPROUT_OVERLAP + 1e-6)
            expect(ring, id).toBeLessThanOrEqual(1)
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(100000)
  }, 60000)
  it('anchors every plant on a vine', () => {
    for (const variant of SPROUT_VARIANTS) {
      const L = layoutSprouts({ seed: 3, variant, density: 3, width: 320, height: 200 })
      for (const p of L.plants) {
        const a = p.spec.anchor
        const near = Math.min(...L.vines.map((v) => Math.min(...Array.from({ length: 401 }, (_, i) => { const q = pointAt(v.path, i / 400); return Math.hypot(q.x - a.x, q.y - a.y) }))))
        expect(near, `${variant} ${p.id}`).toBeLessThan(1)
      }
    }
  })
})

describe('layoutSprouts variety', () => {
  it('is deterministic per seed and differs between seeds', () => {
    for (const variant of SPROUT_VARIANTS) {
      const o = { seed: 'x', variant, density: 2 as const, width: 320, height: 200 }
      expect(layoutSprouts(o)).toEqual(layoutSprouts(o))
      expect(layoutSprouts(o).vines[0]?.path.d).not.toBe(layoutSprouts({ ...o, seed: 'y' }).vines[0]?.path.d)
    }
  })
  it('auto picks a variant from the seed: neighbouring numeric seeds differ, strings spread too', () => {
    for (let s = 0; s < 30; s++) expect(pickVariant(s)).not.toBe(pickVariant(s + 1))
    expect(new Set(Array.from({ length: 12 }, (_, i) => pickVariant(i))).size).toBe(SPROUT_VARIANTS.length)
    expect(new Set(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].map(pickVariant)).size).toBeGreaterThanOrEqual(4)
    expect(layoutSprouts({ seed: 7, width: 300, height: 200 }).variant).toBe(pickVariant(7))
  })
  it('grows the stated number of flowers per density, plus buds and leaves, in varied species, sizes and colours', () => {
    const species = new Set<string>()
    const palettes = new Set<string>()
    for (const variant of SPROUT_VARIANTS) {
      for (const density of DENSITIES) {
        for (const [w, hh] of [[160, 100], [320, 200], [640, 360], [1200, 900], [180, 640], [960, 140]] as const) {
          for (let seed = 0; seed < 8; seed++) {
            const L = layoutSprouts({ seed, variant, density, width: w, height: hh })
            const [lo, hi] = SPROUT_FLOWERS[density]
            const id = `${variant}/${density}/${w}x${hh}/${seed}`
            expect(L.flowers, id).toBeGreaterThanOrEqual(lo)
            expect(L.flowers, id).toBeLessThanOrEqual(hi)
            expect(L.flowers, id).toBe(L.plants.reduce((a, p) => a + p.flowers, 0))
            expect(L.buds, id).toBeGreaterThanOrEqual(1)
            expect(L.leaves.length, id).toBeGreaterThanOrEqual(density + 1)
            for (const p of L.plants) {
              species.add(p.spec.species)
              palettes.add(growPlant(p.spec).nodes[0]?.flower.palette.outer[1] ?? '')
            }
          }
        }
      }
    }
    expect([...species].sort()).toEqual(['bell', 'bloom', 'cornflower', 'daisy', 'forgetmenot'])
    expect(palettes.size).toBeGreaterThanOrEqual(8) // 5 species palettes plus extra blue, violet and pale hues
    const sizes = layoutSprouts({ seed: 4, variant: 'corners', density: 3, width: 640, height: 360 }).plants.map((p) => growPlant(p.spec).nodes[0]).map((n) => (n ? n.flower.extent * n.at.scale : 0))
    expect(Math.max(...sizes) / Math.min(...sizes)).toBeGreaterThan(1.6) // small to large
  })
  it('starts vines out of sync (staggered up to ~1.4s, not left to right) and blooms in an irregular order', () => {
    let unsortedVines = 0
    let unsortedPlants = 0
    for (let seed = 0; seed < 12; seed++) {
      const L = layoutSprouts({ seed, variant: 'burst', density: 3, width: 640, height: 360 })
      const ds = L.vines.map((v) => v.delay)
      expect(Math.min(...ds)).toBeGreaterThan(0) // a moment after the card itself appears
      expect(Math.max(...ds)).toBeLessThanOrEqual(2200)
      expect(new Set(ds).size).toBe(ds.length)
      expect(new Set(L.vines.map((v) => v.duration)).size).toBeGreaterThan(1)
      expect(new Set(L.vines.map((v) => v.ease)).size).toBeGreaterThan(1)
      const byX = [...L.vines].sort((a, b) => (a.path.segs[0]?.p0.x ?? 0) - (b.path.segs[0]?.p0.x ?? 0)).map((v) => v.delay)
      if (byX.some((d, i) => i && d < (byX[i - 1] ?? 0))) unsortedVines++
      const px = [...L.plants].sort((a, b) => a.spec.anchor.x - b.spec.anchor.x).map((p) => p.delay)
      if (px.some((d, i) => i && d < (px[i - 1] ?? 0))) unsortedPlants++
      expect(L.total).toBeGreaterThanOrEqual(Math.max(...L.plants.map((p) => p.delay + p.duration)))
    }
    expect(unsortedVines).toBeGreaterThan(8)
    expect(unsortedPlants).toBeGreaterThan(8)
  })
})

// ---- component ----

class MockIO {
  static all: MockIO[] = []
  cb: (e: { isIntersecting: boolean; intersectionRatio: number }[]) => void
  opts: IntersectionObserverInit | undefined
  disconnected = false
  constructor(cb: MockIO['cb'], opts?: IntersectionObserverInit) { this.cb = cb; this.opts = opts; MockIO.all.push(this) }
  observe() {}
  disconnect() { this.disconnected = true }
  fire(on: boolean) { this.cb([{ isIntersecting: on, intersectionRatio: on ? 0.3 : 0 }]) }
}
class MockRO {
  static all: MockRO[] = []
  disconnected = false
  cb: () => void
  constructor(cb: () => void) { this.cb = cb; MockRO.all.push(this) }
  observe() {}
  disconnect() { this.disconnected = true }
}
let now = 0
let frames: ((t: number) => void)[] = []
const flush = async (ms: number): Promise<void> => {
  for (let t = 0; t < ms; t += 100) {
    now += 100
    const run = frames
    frames = []
    run.forEach((f) => f(now))
  }
  await nextTick()
}

function setup(reduce = false): void {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce })
  MockIO.all = []; MockRO.all = []; frames = []; now = 0
  vi.stubGlobal('IntersectionObserver', MockIO)
  vi.stubGlobal('ResizeObserver', MockRO)
  vi.stubGlobal('requestAnimationFrame', (f: (t: number) => void) => { frames.push(f); return frames.length })
  vi.stubGlobal('cancelAnimationFrame', () => { frames = [] })
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(320)
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(200)
}
const live: ReturnType<typeof mount>[] = []
// Mounted into a fresh div (its parent element), the way it sits inside a card.
const card = (props: SproutsProps) => { const w = mount(Sprouts, { props, attachTo: document.body }); live.push(w); return w }
const opacities = (w: ReturnType<typeof mount>, sel: string): number[] => w.findAll(sel).map((e) => Number(/opacity: ([\d.]+)/.exec(e.attributes('style') ?? '')?.[1]))
const dash = (w: ReturnType<typeof mount>): number[] => w.findAll('.g-sprout-vine').map((e) => Number(e.attributes('stroke-dashoffset')))

beforeEach(() => setup())
afterEach(() => { live.splice(0).forEach((w) => { try { w.unmount() } catch { /* already unmounted */ } }); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.replaceChildren() })

describe('Sprouts component', () => {
  it('renders one decorative, unfocusable, non-interactive svg around the parent and adds no text', async () => {
    const w = card({ seed: 1, isStatic: true, reach: 30 })
    await nextTick()
    const svg = w.findAll('svg.g-sprouts')
    expect(svg).toHaveLength(1)
    const s = svg[0]
    if (!s) throw new Error('no svg')
    expect(s.attributes('aria-hidden')).toBe('true')
    expect(s.attributes('focusable')).toBe('false')
    expect(s.attributes('width')).toBe('380')
    expect(s.attributes('height')).toBe('260')
    expect(s.attributes('viewBox')).toBe('-30 -30 380 260')
    expect(s.attributes('style')).toMatch(/left: -30px; top: -30px/)
    expect(w.text()).toBe('')
    expect(w.findAll('svg svg')).toHaveLength(0)
    expect(w.find('[tabindex]').exists()).toBe(false)
  })
  it('manual: progress 0 shows nothing and no pollen, 1 shows the final state with pollen', async () => {
    const w = card({ seed: 2, trigger: 'manual', progress: 0, density: 3 })
    await nextTick()
    expect(dash(w).length).toBeGreaterThan(0)
    expect(dash(w).every((d) => d === 1)).toBe(true)
    expect(opacities(w, '.g-pollen').length).toBeGreaterThan(0)
    expect(opacities(w, '.g-pollen').every((o) => o === 0)).toBe(true)
    await w.setProps({ progress: 0.5 })
    expect(dash(w).some((d) => d > 0 && d < 1) || dash(w).some((d) => d === 0)).toBe(true)
    await w.setProps({ progress: 1 })
    expect(dash(w).every((d) => d === 0)).toBe(true)
    expect(opacities(w, '.g-pollen').every((o) => o === 1)).toBe(true)
    expect(frames).toHaveLength(0) // manual runs no timeline
  })
  it('isStatic and reduced motion render the final state at once, without observers', async () => {
    const st = card({ seed: 3, isStatic: true })
    await nextTick()
    expect(dash(st).every((d) => d === 0)).toBe(true)
    expect(opacities(st, '.g-pollen').every((o) => o === 1)).toBe(true)
    setup(true)
    const rm = card({ seed: 3 })
    await nextTick()
    expect(dash(rm).every((d) => d === 0)).toBe(true)
    expect(opacities(rm, '.g-pollen').every((o) => o === 1)).toBe(true)
    expect(MockIO.all).toHaveLength(0)
    expect(rm.findAll('.g-is-swaying')).toHaveLength(0)
  })
  it('visible: grows once ~25% visible, completes, then stops all frame work and never retracts', async () => {
    const w = card({ seed: 4 })
    await nextTick()
    expect(MockIO.all).toHaveLength(1)
    expect(MockIO.all[0]?.opts?.threshold).toBe(0.25)
    expect(dash(w).every((d) => d === 1)).toBe(true)
    await flush(500)
    expect(dash(w).every((d) => d === 1)).toBe(true) // nothing before it is visible
    MockIO.all[0]?.fire(true)
    await flush(100)
    expect(MockIO.all[0]?.disconnected).toBe(true)
    for (let i = 0; i < 30 && dash(w).every((d) => d === 1); i++) await flush(100)
    const mid = dash(w)
    expect(mid.some((d) => d < 1)).toBe(true)
    expect(mid.some((d) => d === 1)).toBe(true) // not all vines start together
    await flush(12000)
    expect(dash(w).every((d) => d === 0)).toBe(true)
    expect(opacities(w, '.g-pollen').every((o) => o === 1)).toBe(true)
    expect(frames).toHaveLength(0) // no per-frame work after growth
    expect(growthStats().running).toBe(0)
  })
  it('active: waits for active, grows, and stays grown when active turns false', async () => {
    const w = card({ seed: 5, trigger: 'active', active: false })
    await flush(1000)
    expect(dash(w).every((d) => d === 1)).toBe(true)
    expect(MockIO.all).toHaveLength(0)
    await w.setProps({ active: true })
    await flush(12000)
    expect(dash(w).every((d) => d === 0)).toBe(true)
    await w.setProps({ active: false })
    expect(dash(w).every((d) => d === 0)).toBe(true)
  })
  it('caps simultaneously growing plants globally and queues the rest', async () => {
    const cards = Array.from({ length: 9 }, (_, i) => card({ seed: i, trigger: 'active', active: false, density: 3 }))
    for (const c of cards) await c.setProps({ active: true })
    let peak = 0
    for (let i = 0; i < 600 && growthStats().running + growthStats().queued > 0; i++) {
      await flush(100)
      peak = Math.max(peak, growthStats().plants)
      expect(growthStats().plants).toBeLessThanOrEqual(MAX_GROWING_PLANTS)
    }
    expect(peak).toBeGreaterThan(0)
    expect(growthStats()).toMatchObject({ running: 0, queued: 0, plants: 0 })
    for (const c of cards) expect(dash(c).every((d) => d === 0)).toBe(true)
  }, 30000)
  it('the queue starts the next grower only when slots free up', () => {
    const done: number[] = []
    const make = (i: number, plants: number) => enqueueGrowth({ plants, begin: () => { done.push(i) }, tick: (t) => t >= 300 })
    const cancel = [make(0, MAX_GROWING_PLANTS - 4), make(1, 10), make(2, 4)]
    expect(done).toEqual([0])
    expect(growthStats().queued).toBe(2)
    for (let i = 0; i < 4; i++) { now += 100; const run = frames; frames = []; run.forEach((f) => f(now)) }
    expect(done).toEqual([0, 1, 2])
    cancel.forEach((c) => c())
    expect(growthStats()).toMatchObject({ running: 0, queued: 0, plants: 0 })
  })
  it('cleans up observers, frames, queue slots and listeners on unmount', async () => {
    const remove = vi.spyOn(window, 'removeEventListener')
    const a = card({ seed: 6 })
    const b = card({ seed: 7, trigger: 'active', active: true, sway: true })
    await flush(300)
    expect(growthStats().running + growthStats().queued).toBeGreaterThan(0)
    a.unmount(); b.unmount()
    expect(MockIO.all.every((o) => o.disconnected)).toBe(true)
    expect(MockRO.all.length).toBeGreaterThan(0)
    expect(MockRO.all.every((o) => o.disconnected)).toBe(true)
    expect(growthStats()).toMatchObject({ running: 0, queued: 0, plants: 0 })
    await flush(300)
    expect(frames).toHaveLength(0)
    // a swaying, grown card registers one scroll listener and removes it again
    const c = card({ seed: 8, isStatic: false, trigger: 'manual', progress: 1, sway: true })
    await flush(200)
    expect(c.findAll('.g-is-swaying').length).toBeGreaterThan(0)
    expect(c.findAll('.g-is-swaying').length).toBeLessThanOrEqual(6)
    c.unmount()
    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
  it('renders the same art for the same seed and different art for another', async () => {
    const sig = async (seed: string, variant: SproutVariant | 'auto' = 'auto'): Promise<string[]> => {
      const w = card({ seed, variant, isStatic: true })
      await nextTick()
      return w.findAll('.g-sprout-vine, .g-plant-stem').map((e) => e.attributes('d') ?? '')
    }
    expect(await sig('a')).toEqual(await sig('a'))
    expect(await sig('a', 'edge')).not.toEqual(await sig('b', 'edge'))
  })
})
