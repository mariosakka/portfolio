/* eslint-disable vue/one-component-per-file -- test helpers define throwaway components */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useGrow, Vine, Bloom, Cornflower, Leaf, Bud, Bell, ForgetMeNot, Daisy, Spray, Plant, PageVine, scrollProgress, makeVinePath, placeItems, pointAt, parsePath, distanceToPath, generateFlower, growPlant, phase, petalPhase, PHASES, useGrowthTimeline, FLOWER_SPECIES } from './index'
import type { GrowOptions, PlantSpec, Species } from './index'

const here = dirname(fileURLToPath(import.meta.url))

function mockMedia(reduce: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({ matches: reduce })
}
class MockIO {
  private cb: (entries: { isIntersecting: boolean }[]) => void
  constructor(cb: (entries: { isIntersecting: boolean }[]) => void) { this.cb = cb; instances.push(this) }
  observe() {}
  disconnect() {}
  fire(isIntersecting: boolean) { this.cb([{ isIntersecting }]) }
}
const instances: MockIO[] = []
const io = (): MockIO => {
  const last = instances[instances.length - 1]
  if (!last) throw new Error('no IntersectionObserver was created')
  return last
}
function mockIO() {
  vi.stubGlobal('IntersectionObserver', MockIO)
}
function probe(opts?: GrowOptions) {
  let grown: ReturnType<typeof useGrow> | undefined
  const C = defineComponent({
    setup() { const el = ref(null); grown = useGrow(el, opts); return () => h('div', { ref: el }) },
  })
  mount(C)
  return () => grown?.value
}

afterEach(() => { instances.length = 0; vi.unstubAllGlobals() })

describe('useGrow', () => {
  it('is true immediately with reduced motion', () => {
    mockMedia(true); mockIO()
    expect(probe()()).toBe(true)
  })
  it('is true when IntersectionObserver is missing', () => {
    mockMedia(false)
    expect(probe()()).toBe(true)
  })
  it('waits for intersection', async () => {
    mockMedia(false); mockIO()
    const g = probe()
    expect(g()).toBe(false)
    io().fire(true); await nextTick()
    expect(g()).toBe(true)
  })
  it('once:true stays true after leaving; otherwise toggles', async () => {
    mockMedia(false); mockIO()
    const g = probe({ once: true })
    io().fire(true); io().fire(false)
    expect(g()).toBe(true)
    const g2 = probe({ once: false })
    io().fire(true); io().fire(false)
    expect(g2()).toBe(false)
  })
})

describe('components', () => {
  it('Vine renders its path and is-grown only after growth', async () => {
    mockMedia(false); mockIO()
    const w = mount(Vine, { props: { path: 'M0 0 L10 10' }, slots: { default: () => h(Leaf) } })
    expect(w.find('path.vine-stem').attributes('d')).toBe('M0 0 L10 10')
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.classes()).not.toContain('is-grown')
    io().fire(true); await nextTick()
    expect(w.classes()).toContain('is-grown')
    expect(w.find('.leaf').classes()).toContain('is-grown')
  })
  it('is-static shows everything and reduced motion renders grown', () => {
    mockMedia(false); mockIO()
    expect(mount(Vine, { props: { path: 'M0 0', isStatic: true } }).classes()).toContain('is-static')
    mockMedia(true)
    expect(mount(Bloom, { attrs: {} }).classes()).toContain('is-grown')
  })
  it('static Vine makes Leaf/Bud children static without an observer firing', () => {
    mockMedia(false); mockIO()
    const w = mount(Vine, { props: { path: 'M0 0', isStatic: true }, slots: { default: () => [h(Leaf), h(Bud)] } })
    expect(w.find('.leaf').classes()).toContain('is-static')
    expect(w.find('.bud').classes()).toContain('is-static')
  })
  it('static Bloom inside a grown Vine has no sway class', () => {
    mockMedia(false); mockIO()
    const w = mount(Vine, { props: { path: 'M0 0', grown: true }, slots: { default: () => h(Bloom, { isStatic: true }) } })
    expect(w.find('.bloom').classes()).toContain('is-static')
    expect(w.find('.bloom').classes()).not.toContain('is-swaying')
    expect(w.find('.vine').classes()).not.toContain('is-swaying')
  })
  it('children inside a Vine create no observer of their own', () => {
    mockMedia(false); mockIO()
    mount(Vine, { props: { path: 'M0 0' }, slots: { default: () => [h(Leaf), h(Bloom), h(Bud)] } })
    expect(instances).toHaveLength(1)
  })
})

describe('scrollProgress', () => {
  it('maps scroll to a clamped 0..1 fraction with the tip ahead of the viewport centre', () => {
    expect(scrollProgress(-1000, 6000, 1000)).toBe(0)
    const top = scrollProgress(0, 6000, 1000)
    expect(top).toBeGreaterThan(0.1) // tip at 60% of the viewport, not at the top edge
    expect(top).toBeLessThan(0.12)
    expect(scrollProgress(5000, 6000, 1000)).toBe(1) // bottom of page
    expect(scrollProgress(99999, 6000, 1000)).toBe(1)
    expect(scrollProgress(0, 300, 1000)).toBe(1) // page shorter than the viewport
    expect(scrollProgress(0, 0, 1000)).toBe(1)
    let prev = 0
    for (let y = 0; y <= 5000; y += 250) {
      const p = scrollProgress(y, 6000, 1000)
      expect(p).toBeGreaterThanOrEqual(prev)
      prev = p
    }
  })
})

describe('makeVinePath', () => {
  it('is deterministic per seed and differs between seeds', () => {
    expect(makeVinePath({ seed: 3, height: 4000 }).d).toBe(makeVinePath({ seed: 3, height: 4000 }).d)
    expect(makeVinePath({ seed: 3, height: 4000 }).d).not.toBe(makeVinePath({ seed: 4, height: 4000 }).d)
  })
  it('stays inside the margin strip and spans the height with increasing arc fractions', () => {
    for (const width of [32, 180]) {
      const v = makeVinePath({ seed: 9, height: 5800, width })
      for (const s of v.samples) {
        expect(s.x).toBeGreaterThanOrEqual(0)
        expect(s.x).toBeLessThanOrEqual(width)
      }
      for (const n of v.d.matchAll(/-?\d+(?:\.\d+)?/g)) expect(Number.isFinite(Number(n[0]))).toBe(true)
      expect(v.samples[v.samples.length - 1]?.y).toBeCloseTo(5800, 0)
      expect(v.samples[v.samples.length - 1]?.f).toBe(1)
      expect(v.samples[0]?.f).toBe(0)
      v.samples.forEach((s, i) => { if (i) expect(s.f).toBeGreaterThanOrEqual(v.samples[i - 1]?.f ?? 0) })
    }
  })
  it('keeps the prefix stable when the page grows', () => {
    const a = makeVinePath({ seed: 5, height: 2000 })
    const b = makeVinePath({ seed: 5, height: 4000 })
    expect(b.d.startsWith(a.d.slice(0, a.d.lastIndexOf('C')))).toBe(true)
  })
})

describe('path anchoring', () => {
  const vine = makeVinePath({ seed: 2, height: 3000 })
  it('pointAt returns points on the curve, with ordered y and a tangent', () => {
    let prevY = -1
    for (let f = 0; f <= 1; f += 0.05) {
      const a = pointAt(vine, f)
      expect(distanceToPath(vine, a, 300)).toBeLessThan(0.1)
      expect(a.y).toBeGreaterThanOrEqual(prevY)
      prevY = a.y
      expect(a.angle).toBeGreaterThan(0) // the vine runs downwards
      expect(a.angle).toBeLessThan(180)
    }
    expect(pointAt(vine, 0).y).toBe(0)
    expect(pointAt(vine, 1).y).toBeCloseTo(3000, 0)
  })
  it('parsePath handles M/C/Q/L and rejects unsupported commands', () => {
    const m = parsePath('M0 0 L10 0 Q20 0 20 10 C20 20 30 30 40 30 S50 20 60 30')
    expect(m.segs).toHaveLength(4)
    expect(m.segs[3]?.p1).toEqual({ x: 50, y: 30 })
    expect(parsePath('M0 0 C0 10 10 20 20 20 S40 10 40 0').segs[1]?.p1).toEqual({ x: 30, y: 20 })
    expect(pointAt(m, 0)).toMatchObject({ x: 0, y: 0 })
    expect(pointAt(m, 1).x).toBeCloseTo(60)
    expect(() => parsePath('M0 0 A5 5 0 0 1 10 10')).toThrow()
    expect(() => parsePath('L0 0')).toThrow()
  })
})

describe('generateFlower', () => {
  const species = Object.keys(FLOWER_SPECIES) as Species[]
  it('is deterministic for a seed and varies between seeds', () => {
    for (const sp of species) expect(generateFlower(sp, 4)).toEqual(generateFlower(sp, 4))
    expect(generateFlower('bloom', 4).petals[0]?.d).not.toBe(generateFlower('bloom', 5).petals[0]?.d)
  })
  it('layers get smaller towards the centre and are offset by half a step', () => {
    const f = generateFlower('bloom', 1)
    const mean = (l: number): number => { const ps = f.petals.filter((p) => p.layer === l); return ps.reduce((a, p) => a + p.length, 0) / ps.length }
    expect(f.layers).toBe(2)
    expect(mean(0)).toBeGreaterThan(mean(1))
    expect(f.petals).toHaveLength(10)
    const a0 = f.petals.find((p) => p.layer === 0 && p.index === 0)?.angle ?? 0
    const a1 = f.petals.find((p) => p.layer === 1 && p.index === 0)?.angle ?? 0
    expect(Math.abs(a1 - a0)).toBeGreaterThan(20) // 36 degrees apart, give or take variation
  })
  it('every species has petals and stamens, and a closed bud has no stamens', () => {
    for (const sp of species) {
      const f = generateFlower(sp, 2)
      expect(f.petals.length).toBeGreaterThan(4)
      expect(f.stamens.length).toBeGreaterThan(0)
      expect(f.extent).toBeGreaterThan(10)
      expect(generateFlower(sp, 2, { closed: true }).stamens).toHaveLength(0)
    }
  })
})

describe('growPlant', () => {
  const vine = makeVinePath({ seed: 2, height: 3000 })
  const spec = (species: Species, seed: number, f = 0.4): PlantSpec => ({ species, seed, anchor: pointAt(vine, f), side: seed % 2 ? 1 : -1, reach: 60, branches: 2, leaves: 3 })
  const all = (['bloom', 'cornflower', 'bell', 'forgetmenot', 'daisy'] as Species[]).flatMap((sp) => [1, 2, 3].map((n) => spec(sp, n)))
  const far = { x: 1e9, y: 1e9 }
  it('is deterministic', () => { for (const s of all) expect(growPlant(s)).toEqual(growPlant(s)) })
  it('starts its stem on the vine and ends the stem exactly at the flower base', () => {
    for (const s of all) {
      const g = growPlant(s)
      const start = g.nodes[0]?.stem.segs[0]?.p0 ?? far
      expect(start).toEqual({ x: s.anchor.x, y: s.anchor.y })
      expect(distanceToPath(vine, start, 400)).toBeLessThan(0.1)
      for (const n of g.nodes) {
        const end = n.stem.segs[n.stem.segs.length - 1]?.p3 ?? far
        expect(Math.hypot(n.at.x - end.x, n.at.y - end.y)).toBeLessThan(0.5)
      }
    }
  })
  it('side branches start on their parent stem', () => {
    for (const s of all) {
      const [main, ...subs] = growPlant(s).nodes
      expect(subs).toHaveLength(2)
      if (!main) throw new Error('no main node')
      for (const b of subs) expect(distanceToPath(main.stem, b.stem.segs[0]?.p0 ?? far, 400)).toBeLessThan(0.1)
    }
  })
  it('flower axis follows the stem end tangent plus the declared tilt', () => {
    for (const s of all) for (const n of growPlant(s).nodes) {
      const end = pointAt(n.stem, 1)
      const d = ((((n.at.rotate - (end.angle + 90 + n.tilt)) % 360) + 540) % 360) - 180
      expect(Math.abs(d)).toBeLessThan(1e-6)
      expect(Math.abs(n.tilt)).toBeLessThanOrEqual(14)
    }
  })
  it('upright species turn skywards at the tip and bells hang down', () => {
    const up = growPlant(spec('bloom', 1)).nodes[0]
    const bell = growPlant(spec('bell', 1)).nodes[0]
    expect(Math.sin(((up?.tip.angle ?? 0) * Math.PI) / 180)).toBeLessThan(-0.5)
    expect(Math.sin(((bell?.tip.angle ?? 0) * Math.PI) / 180)).toBeGreaterThan(0.5)
  })
  it('leaf bases lie on their stem and the vine leaves on the vine', () => {
    for (const s of all) for (const n of growPlant(s).nodes) for (const l of n.leaves) expect(distanceToPath(n.stem, l, 400)).toBeLessThan(0.1)
    const leaves = placeItems(vine, { seed: 2 }).filter((i) => i.kind === 'leaf')
    expect(leaves.length).toBeGreaterThan(10)
    for (const it of leaves) expect(distanceToPath(vine, it.anchor, 400)).toBeLessThan(0.1)
  })
})

describe('placeItems', () => {
  const vine = makeVinePath({ seed: 2, height: 5800 })
  it('is stable for a seed, covers the whole height and mixes species', () => {
    const a = placeItems(vine, { seed: 2 })
    expect(placeItems(vine, { seed: 2 })).toEqual(a)
    expect(Math.max(...a.map((i) => i.anchor.y))).toBeGreaterThan(5000)
    const species = new Set(a.flatMap((i) => (i.plant ? [i.plant.species] : [])))
    expect(species.size).toBeGreaterThanOrEqual(4)
    a.forEach((i, n) => { if (n) expect(i.f).toBeGreaterThanOrEqual(a[n - 1]?.f ?? 0) })
  })
  it('keeps every plant inside the strip, also when compact', () => {
    for (const compact of [false, true]) {
      const width = compact ? 32 : 180
      const v = makeVinePath({ seed: 2, height: 4000, width })
      const items = placeItems(v, { seed: 2, compact })
      expect(items.some((i) => i.plant)).toBe(true)
      for (const it of items) {
        if (!it.plant) continue
        const b = growPlant({ ...it.plant, anchor: it.anchor }).bounds
        expect(b.x0, it.id).toBeGreaterThanOrEqual(-0.01)
        expect(b.x1, it.id).toBeLessThanOrEqual(width + 0.01)
      }
    }
  })
  it('is sparser with a lower density', () => {
    const n = (d: number): number => placeItems(vine, { seed: 2, density: d }).filter((i) => i.plant).length
    expect(n(0.4)).toBeLessThan(n(1))
  })
})

describe('growth timeline', () => {
  const steps = Array.from({ length: 101 }, (_, i) => i / 100)
  it('is monotonic non-decreasing and ends complete', () => {
    let prev = phase(0)
    for (const p of steps) {
      const cur = phase(p)
      for (const k of ['stem', 'leaf', 'calyx', 'bud', 'open', 'stamen', 'pollen'] as const) {
        expect(cur[k], `${k}@${p}`).toBeGreaterThanOrEqual(prev[k])
        expect(cur[k]).toBeGreaterThanOrEqual(0)
        expect(cur[k]).toBeLessThanOrEqual(1)
      }
      prev = cur
    }
    expect(phase(1)).toMatchObject({ stem: 1, leaf: 1, calyx: 1, bud: 1, open: 1, stamen: 1, pollen: 1, idle: true })
    expect(phase(0.99).idle).toBe(false)
    expect(phase(-3).stem).toBe(0)
    expect(phase(9).pollen).toBe(1)
  })
  it('orders the stages: stem, bud, open, then stamens, then pollen', () => {
    for (const p of steps) {
      const ph = phase(p)
      if (ph.bud > 0) expect(ph.stem).toBeGreaterThan(0.9)
      if (ph.open > 0) expect(ph.bud).toBe(1)
      if (ph.stamen > 0) expect(ph.open).toBe(1)
      if (ph.pollen > 0) expect(ph.stamen).toBeGreaterThan(0.85)
      if (p <= PHASES.pollen[0]) expect(ph.pollen).toBe(0)
    }
  })
  it('all petals are fully unfurled before any pollen, outer layer first', () => {
    const f = generateFlower('bloom', 3)
    const per = f.petals.length / f.layers
    const open = phase(PHASES.pollen[0]).open
    for (const p of f.petals) expect(petalPhase(open, p.layer, f.layers, p.index, per)).toBe(1)
    for (let o = 0; o <= 1; o += 0.05) {
      const outer = Math.max(...f.petals.filter((p) => p.layer === 0).map((p) => petalPhase(o, 0, f.layers, p.index, per)))
      const inner = Math.max(...f.petals.filter((p) => p.layer === 1).map((p) => petalPhase(o, 1, f.layers, p.index, per)))
      expect(outer).toBeGreaterThanOrEqual(inner)
    }
  })
  it('useGrowthTimeline tweens once started, and jumps to the end when static or reduced', async () => {
    mockMedia(false)
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    let cb: (() => void) | undefined
    vi.stubGlobal('requestAnimationFrame', (f: () => void) => { cb = f; return 1 })
    vi.stubGlobal('cancelAnimationFrame', () => { cb = undefined })
    const start = ref(false)
    let tl: ReturnType<typeof useGrowthTimeline> | undefined
    let st: ReturnType<typeof useGrowthTimeline> | undefined
    mount(defineComponent({ setup() { tl = useGrowthTimeline(start, { duration: 1000 }); st = useGrowthTimeline(start, { isStatic: true }); return () => h('i') } }))
    expect(tl?.value).toBe(0)
    expect(st?.value).toBe(1)
    start.value = true
    await nextTick()
    now = 500; cb?.()
    expect(tl?.value).toBeCloseTo(0.5)
    now = 5000; cb?.()
    expect(tl?.value).toBe(1)
    vi.restoreAllMocks()
    mockMedia(true)
    mount(defineComponent({ setup() { tl = useGrowthTimeline(ref(false)); return () => h('i') } }))
    expect(tl?.value).toBe(1)
  })
})

describe('flower components', () => {
  const pollenOpacity = (w: ReturnType<typeof mount>): number[] => w.findAll('.pollen, .anther').map((e) => Number(/opacity: ([\d.]+)/.exec(e.attributes('style') ?? '')?.[1]))
  it('render pollen only in the final state: absent early, present when done', () => {
    mockMedia(false); mockIO()
    const early = mount(Bloom, { props: { progress: 0.7, grown: true } })
    expect(pollenOpacity(early).length).toBeGreaterThan(0)
    expect(pollenOpacity(early).every((o) => o === 0)).toBe(true)
    const done = mount(Bloom, { props: { progress: 1, grown: true } })
    expect(pollenOpacity(done).every((o) => o === 1)).toBe(true)
    expect(done.find('.flower-art').classes()).toContain('is-swaying')
  })
  it('isStatic and reduced motion render the final state including pollen', () => {
    mockMedia(true)
    for (const C of [Bloom, Cornflower, Bell, ForgetMeNot, Daisy]) {
      const w = mount(C, { attrs: {} })
      expect(w.classes()).toContain('is-grown')
      expect(pollenOpacity(w).every((o) => o === 1)).toBe(true)
    }
    mockMedia(false); mockIO()
    expect(pollenOpacity(mount(Bloom, { props: { isStatic: true } })).every((o) => o === 1)).toBe(true)
  })
  it('wrappers keep their species class and work inside a Vine', () => {
    mockMedia(true)
    expect(mount(Bell).classes()).toContain('bell')
    expect(mount(Daisy).classes()).toContain('daisy')
    expect(mount(Vine, { props: { path: 'M0 0' }, slots: { default: () => h(ForgetMeNot) } }).find('.forgetmenot').exists()).toBe(true)
  })
  it('Plant and Spray draw their stem from the anchor and finish static', () => {
    mockMedia(true)
    const anchor = { x: 40, y: 100, angle: 90 }
    const w = mount(Plant, { props: { species: 'bell', anchor, branches: 2 } })
    expect(w.findAll('.plant-stem')).toHaveLength(3)
    expect(w.find('.plant-stem').attributes('d')).toMatch(/^M40 100 /)
    expect(w.findAll('.plant-stem').every((p) => p.attributes('stroke-dashoffset') === '0')).toBe(true)
    expect(mount(Spray, { props: { species: 'bloom', anchor } }).findAll('.plant-stem')).toHaveLength(4)
    mockMedia(false); mockIO()
    const manual = mount(Plant, { props: { species: 'bloom', anchor, progress: 0.1, grown: true } })
    const off = Number(manual.find('.plant-stem').attributes('stroke-dashoffset'))
    expect(off).toBeGreaterThan(0)
    expect(off).toBeLessThan(1)
    expect(pollenOpacity(manual).every((o) => o === 0)).toBe(true)
  })
})

describe('PageVine', () => {
  const art = (w: ReturnType<typeof mount>) => w.findAll('g.garden-art')
  const off = (w: ReturnType<typeof mount>): number => {
    const m = /--off: ([\d.]+)/.exec(w.find('svg').attributes('style') ?? '')
    return m ? Number(m[1]) : w.find('svg').classes().includes('is-static') ? 0 : 1 // static: the stylesheet sets --off: 0
  }
  it('renders fully drawn and fully grown with reduced motion', () => {
    mockMedia(true); mockIO()
    const w = mount(PageVine, { props: { height: 3000, seed: 1 } })
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(off(w)).toBe(0)
    expect(art(w).length).toBeGreaterThan(10)
    art(w).forEach((g) => { expect(g.classes()).toContain('is-static') })
    expect(w.findAll('.pollen').every((e) => /opacity: 1/.test(e.attributes('style') ?? ''))).toBe(true)
    expect(w.findAll('.plant-stem').every((p) => p.attributes('stroke-dashoffset') === '0')).toBe(true)
    expect(instances).toHaveLength(0) // no per-flower observers
  })
  it('draws with scroll and starts plants as the tip passes, keeping them grown', async () => {
    mockMedia(false); mockIO()
    let queue: (() => void)[] = []
    vi.stubGlobal('requestAnimationFrame', (cb: () => void) => { queue.push(cb); return 1 })
    const set = (y: number) => {
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true })
      window.dispatchEvent(new Event('scroll'))
      const run = queue
      queue = []
      run.forEach((f) => f())
    }
    set(0)
    const w = mount(PageVine, { props: { height: 6000, seed: 1 } })
    await nextTick()
    const grown = () => w.findAll('g.garden-art.is-grown').length
    const top = grown()
    expect(off(w)).toBeGreaterThan(0.5)
    expect(top).toBeLessThan(art(w).length / 2)
    set(3000); await nextTick()
    const mid = off(w)
    expect(mid).toBeLessThan(0.6)
    const midGrown = grown()
    expect(midGrown).toBeGreaterThan(top)
    set(0); await nextTick()
    expect(off(w)).toBeGreaterThan(mid) // stem follows scroll back up
    expect(grown()).toBe(midGrown) // plants stay grown
    set(6000); await nextTick()
    expect(off(w)).toBe(0)
    expect(grown()).toBe(art(w).length)
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })
  it('places the same art on every render of a seed', () => {
    mockMedia(true)
    const sig = (seed: number): (string | undefined)[] => mount(PageVine, { props: { height: 4000, seed } }).findAll('.plant-stem, .plant-leaf').map((g) => g.attributes('d') ?? g.attributes('transform'))
    expect(sig(7)).toEqual(sig(7))
    expect(sig(7)).not.toEqual(sig(8))
  })
  it('every plant stem that leaves the vine starts exactly on it', () => {
    mockMedia(true)
    const vine = makeVinePath({ seed: 3, height: 3000 })
    const w = mount(PageVine, { props: { height: 3000, seed: 3 } })
    const starts = w.findAll('.plant-stem').map((p) => /^M(\S+) (\S+)/.exec(p.attributes('d') ?? ''))
    expect(starts.length).toBeGreaterThan(5)
    const onVine = starts.filter((m) => m && distanceToPath(vine, { x: Number(m[1]), y: Number(m[2]) }, 400) < 0.1)
    expect(onVine.length).toBeGreaterThanOrEqual(starts.length / 3)
  })
})

describe('garden folder rules', () => {
  const files = readdirSync(here).filter((f) => /\.(vue|ts|css)$/.test(f) && !f.endsWith('.test.ts'))
  it('has no imports from outside src/garden except vue', () => {
    expect(files.length).toBeGreaterThan(0)
    expect(files).toEqual(expect.arrayContaining(['index.ts', 'useGrow.ts', 'types.ts', 'Vine.vue', 'garden.css', 'layout.ts', 'anchor.ts', 'flowers.ts', 'grow.ts', 'timeline.ts', 'PageVine.vue', 'Plant.vue', 'FlowerArt.vue', 'Spray.vue', 'Bell.vue', 'ForgetMeNot.vue']))
    for (const f of files) {
      const src = readFileSync(join(here, f), 'utf8')
      for (const m of src.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
        const spec = m[1]
        expect(spec === 'vue' || (spec.startsWith('./') && !spec.includes('..')), `${f}: ${spec}`).toBe(true)
      }
    }
  })
  it('uses no Tailwind', () => {
    for (const f of files) {
      const src = readFileSync(join(here, f), 'utf8')
      expect(src, f).not.toMatch(/@apply|@tailwind|\btw-[\w-]+|class="[^"]*\b(?:flex|px-\d|py-\d|text-(?:sm|lg|xl)|bg-\w+-\d{3})\b/)
    }
  })
})
