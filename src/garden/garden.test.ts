/* eslint-disable vue/one-component-per-file -- test helpers define throwaway components */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { useGrow, Vine, Bloom, Cornflower, Leaf, Bud, Bell, ForgetMeNot, Daisy, Spray, Plant, PageVine, scrollProgress, makeVinePath, placeItems, pointAt, parsePath, distanceToPath, generateFlower, growPlant, phase, petalPhase, PHASES, useGrowthTimeline, FLOWER_SPECIES } from './index'
import type { Cubic, GrowOptions, PlantSpec, Species } from './index'

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
    expect(w.find('path.g-vine-stem').attributes('d')).toBe('M0 0 L10 10')
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(w.classes()).not.toContain('g-is-grown')
    io().fire(true); await nextTick()
    expect(w.classes()).toContain('g-is-grown')
    expect(w.find('.g-leaf').classes()).toContain('g-is-grown')
  })
  it('is-static shows everything and reduced motion renders grown', () => {
    mockMedia(false); mockIO()
    expect(mount(Vine, { props: { path: 'M0 0', isStatic: true } }).classes()).toContain('g-is-static')
    mockMedia(true)
    expect(mount(Bloom, { attrs: {} }).classes()).toContain('g-is-grown')
  })
  it('static Vine makes Leaf/Bud children static without an observer firing', () => {
    mockMedia(false); mockIO()
    const w = mount(Vine, { props: { path: 'M0 0', isStatic: true }, slots: { default: () => [h(Leaf), h(Bud)] } })
    expect(w.find('.g-leaf').classes()).toContain('g-is-static')
    expect(w.find('.g-bud').classes()).toContain('g-is-static')
  })
  it('static Bloom inside a grown Vine has no sway class', () => {
    mockMedia(false); mockIO()
    const w = mount(Vine, { props: { path: 'M0 0', grown: true }, slots: { default: () => h(Bloom, { isStatic: true }) } })
    expect(w.find('.g-bloom').classes()).toContain('g-is-static')
    expect(w.find('.g-bloom').classes()).not.toContain('g-is-swaying')
    expect(w.find('.g-vine').classes()).not.toContain('g-is-swaying')
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
  it('starts its stem on the vine and places the flower base on the stem end', () => {
    for (const s of all) {
      const g = growPlant(s)
      const start = g.nodes[0]?.stem.segs[0]?.p0 ?? far
      expect(start).toEqual({ x: s.anchor.x, y: s.anchor.y })
      expect(distanceToPath(vine, start, 400)).toBeLessThan(0.1)
      for (const n of g.nodes) {
        const end = n.stem.segs[n.stem.segs.length - 1]?.p3 ?? far
        expect(Math.hypot(n.at.x - end.x, n.at.y - end.y)).toBeLessThan(1e-6)
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
  it('flower axis points along the stem end tangent (finite difference of the cubic) plus the declared tilt', () => {
    const bez = (c: Cubic, t: number): { x: number; y: number } => {
      const u = 1 - t
      return {
        x: u * u * u * c.p0.x + 3 * u * u * t * c.p1.x + 3 * u * t * t * c.p2.x + t * t * t * c.p3.x,
        y: u * u * u * c.p0.y + 3 * u * u * t * c.p1.y + 3 * u * t * t * c.p2.y + t * t * t * c.p3.y,
      }
    }
    for (const s of all) for (const n of growPlant(s).nodes) {
      const c = n.stem.segs[n.stem.segs.length - 1]
      if (!c) throw new Error('no stem')
      const e = bez(c, 1)
      const near = bez(c, 1 - 1e-7)
      const phi = Math.atan2(e.y - near.y, e.x - near.x) + (n.tilt * Math.PI) / 180
      const th = (n.at.rotate * Math.PI) / 180
      // rotate(th) applied to the flower axis (0, -1)
      expect(Math.sin(th)).toBeCloseTo(Math.cos(phi), 6)
      expect(-Math.cos(th)).toBeCloseTo(Math.sin(phi), 6)
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
  const pollenOpacity = (w: ReturnType<typeof mount>): number[] => w.findAll('.g-pollen, .g-anther').map((e) => Number(/opacity: ([\d.]+)/.exec(e.attributes('style') ?? '')?.[1]))
  it('render pollen only in the final state: absent early, present when done', () => {
    mockMedia(false); mockIO()
    const early = mount(Bloom, { props: { progress: 0.7, grown: true } })
    expect(pollenOpacity(early).length).toBeGreaterThan(0)
    expect(pollenOpacity(early).every((o) => o === 0)).toBe(true)
    const done = mount(Bloom, { props: { progress: 1, grown: true } })
    expect(pollenOpacity(done).every((o) => o === 1)).toBe(true)
    expect(done.find('.g-flower-art').classes()).toContain('g-is-swaying')
  })
  it('isStatic and reduced motion render the final state including pollen', () => {
    mockMedia(true)
    for (const C of [Bloom, Cornflower, Bell, ForgetMeNot, Daisy]) {
      const w = mount(C, { attrs: {} })
      expect(w.classes()).toContain('g-is-grown')
      expect(pollenOpacity(w).every((o) => o === 1)).toBe(true)
    }
    mockMedia(false); mockIO()
    expect(pollenOpacity(mount(Bloom, { props: { isStatic: true } })).every((o) => o === 1)).toBe(true)
  })
  it('wrappers keep their species class and work inside a Vine', () => {
    mockMedia(true)
    expect(mount(Bell).classes()).toContain('g-bell')
    expect(mount(Daisy).classes()).toContain('g-daisy')
    expect(mount(Vine, { props: { path: 'M0 0' }, slots: { default: () => h(ForgetMeNot) } }).find('.g-forgetmenot').exists()).toBe(true)
  })
  it('Plant and Spray draw their stem from the anchor and finish static', () => {
    mockMedia(true)
    const anchor = { x: 40, y: 100, angle: 90 }
    const w = mount(Plant, { props: { species: 'bell', anchor, branches: 2 } })
    expect(w.findAll('.g-plant-stem')).toHaveLength(3)
    expect(w.find('.g-plant-stem').attributes('d')).toMatch(/^M40 100 /)
    expect(w.findAll('.g-plant-stem').every((p) => p.attributes('stroke-dashoffset') === '0')).toBe(true)
    expect(mount(Spray, { props: { species: 'bloom', anchor } }).findAll('.g-plant-stem')).toHaveLength(4)
    mockMedia(false); mockIO()
    const manual = mount(Plant, { props: { species: 'bloom', anchor, progress: 0.1, grown: true } })
    const off = Number(manual.find('.g-plant-stem').attributes('stroke-dashoffset'))
    expect(off).toBeGreaterThan(0)
    expect(off).toBeLessThan(1)
    expect(pollenOpacity(manual).every((o) => o === 0)).toBe(true)
  })
})

/** Parse the rendered stem path and the flower group transform of a plant node (DOM level). */
function nodeGeometry(node: Element): { p0: number[]; p2: number[]; p3: number[]; t: number[] } {
  const d = node.querySelector('.g-plant-stem')?.getAttribute('d') ?? ''
  const n = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]))
  const flower = node.lastElementChild
  const tr = /translate\((\S+) (\S+)\) rotate\((\S+)\) scale\((\S+)\)/.exec(flower?.getAttribute('transform') ?? '')
  if (n.length !== 8 || !tr) throw new Error(`bad node markup: ${d}`)
  return { p0: n.slice(0, 2), p2: n.slice(4, 6), p3: n.slice(6, 8), t: tr.slice(1).map(Number) }
}
const wrap180 = (a: number): number => ((((a + 180) % 360) + 360) % 360) - 180

describe('rendered anchoring (DOM)', () => {
  it('Plant and PageVine render each flower at its stem end, axis along the end tangent plus an integer tilt', () => {
    mockMedia(true); mockIO()
    const roots = [
      mount(Plant, { props: { species: 'bell', anchor: { x: 40, y: 100, angle: 90 }, branches: 2, seed: 4 } }),
      mount(PageVine, { props: { height: 3000, seed: 3 } }),
    ]
    let checked = 0
    for (const w of roots) {
      for (const node of w.element.querySelectorAll('.g-plant-node')) {
        const g = nodeGeometry(node)
        expect(g.t[0]).toBeCloseTo(g.p3[0] ?? NaN, 6)
        expect(g.t[1]).toBeCloseTo(g.p3[1] ?? NaN, 6)
        const tangent = (Math.atan2((g.p3[1] ?? 0) - (g.p2[1] ?? 0), (g.p3[0] ?? 0) - (g.p2[0] ?? 0)) * 180) / Math.PI
        const tilt = wrap180((g.t[2] ?? 0) - (tangent + 90))
        expect(Math.abs(tilt - Math.round(tilt))).toBeLessThan(1e-3) // tilt is a declared integer
        expect(Math.abs(tilt)).toBeLessThanOrEqual(14)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(8)
  })
})

describe('PageVine', () => {
  const art = (w: ReturnType<typeof mount>) => w.findAll('g.g-art')
  const off = (w: ReturnType<typeof mount>): number => {
    const m = /--off: ([\d.]+)/.exec(w.find('svg').attributes('style') ?? '')
    return m ? Number(m[1]) : w.find('svg').classes().includes('g-is-static') ? 0 : 1 // static: the stylesheet sets --off: 0
  }
  it('renders fully drawn and fully grown with reduced motion', () => {
    mockMedia(true); mockIO()
    const w = mount(PageVine, { props: { height: 3000, seed: 1 } })
    expect(w.find('svg').attributes('aria-hidden')).toBe('true')
    expect(off(w)).toBe(0)
    expect(art(w).length).toBeGreaterThan(10)
    art(w).forEach((g) => { expect(g.classes()).toContain('g-is-static') })
    expect(w.findAll('.g-pollen').every((e) => /opacity: 1/.test(e.attributes('style') ?? ''))).toBe(true)
    expect(w.findAll('.g-plant-stem').every((p) => p.attributes('stroke-dashoffset') === '0')).toBe(true)
    expect(w.findAll('.g-is-swaying')).toHaveLength(0) // reduced motion: no sway
    expect(instances).toHaveLength(0) // no per-flower observers
  })
  it('draws with scroll but never retracts, and never grows art beyond the drawn vine (also after a jump)', async () => {
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
    const items = placeItems(makeVinePath({ seed: 1, height: 6000 }), { seed: 1 })
    const drawn = (): number => 1 - off(w)
    const grownCount = (): number => w.findAll('g.g-art.g-leaf.g-is-grown, g.g-art.g-plant.g-is-grown').length
    // Every grown item's anchor lies within the drawn length, and every reached item is grown.
    const consistent = (): void => { expect(grownCount()).toBe(items.filter((i) => i.f <= drawn() + 1e-9).length) }
    expect(drawn()).toBeLessThan(0.5)
    consistent()
    set(4200) // about 70% of the page
    await nextTick()
    const mid = drawn()
    expect(mid).toBeGreaterThan(0.6)
    consistent()
    const midGrown = grownCount()
    expect(midGrown).toBeGreaterThan(5)
    set(0) // back to the top: nothing retracts
    await nextTick()
    expect(drawn()).toBe(mid)
    expect(grownCount()).toBe(midGrown)
    consistent()
    set(6000) // nav jump to the bottom: the vine catches up in the same frame
    await nextTick()
    expect(drawn()).toBe(1)
    expect(grownCount()).toBe(items.length)
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
  })
  it('caps simultaneously swaying plants', async () => {
    mockMedia(false); mockIO()
    const w = mount(Plant, { props: { species: 'bloom', anchor: { x: 20, y: 20, angle: 90 }, progress: 1, grown: true } })
    expect(w.findAll('.g-is-swaying')).toHaveLength(0) // sway is opt-in
    const s = mount(Plant, { props: { species: 'bloom', anchor: { x: 20, y: 20, angle: 90 }, progress: 1, grown: true, sway: true } })
    expect(s.findAll('.g-is-swaying')).toHaveLength(1)
  })
  it('places the same art on every render of a seed', () => {
    mockMedia(true)
    const sig = (seed: number): (string | undefined)[] => mount(PageVine, { props: { height: 4000, seed } }).findAll('.g-plant-stem, .g-plant-leaf').map((g) => g.attributes('d') ?? g.attributes('transform'))
    expect(sig(7)).toEqual(sig(7))
    expect(sig(7)).not.toEqual(sig(8))
  })
  it('every main plant stem starts exactly on the vine', () => {
    mockMedia(true)
    const vine = makeVinePath({ seed: 3, height: 3000 })
    const w = mount(PageVine, { props: { height: 3000, seed: 3 } })
    const mains = w.findAll('.g-plant').map((p) => /^M(\S+) (\S+)/.exec(p.find('.g-plant-stem').attributes('d') ?? ''))
    expect(mains.length).toBeGreaterThan(5)
    for (const m of mains) expect(distanceToPath(vine, { x: Number(m?.[1]), y: Number(m?.[2]) }, 400)).toBeLessThan(0.1)
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
  it('uses no Tailwind: every class token is g- prefixed and no utility pattern appears in class bindings', () => {
    const utility = /^(?:-?z-\d+|absolute|relative|fixed|sticky|hidden|block|inline(?:-block)?|flex|grid|(?:inset|top|left|right|bottom)-.+|[wh]-(?:\[.+\]|\d.*|full|screen)|(?:min|max|sm|md|lg|xl)(?:-\[.+\])?:.+|[mp][trblxy]?-(?:\d.*|auto)|text-.+|bg-.+|font-.+|rounded.*|border.*|opacity-\d+|overflow-.+|pointer-events-none|items-.+|justify-.+|gap-.+|!.+|\[.+\])$/
    let tokens = 0
    for (const f of files) {
      const src = readFileSync(join(here, f), 'utf8')
      expect(src, f).not.toMatch(/@apply|@tailwind|\btw-[\w-]+/)
      if (!f.endsWith('.vue')) continue
      for (const m of src.matchAll(/(:?)class="([^"]*)"/g)) {
        const raw = m[1] ? [...(m[2] ?? '').matchAll(/'([^']*)'|`([^`]*)`/g)].map((x) => x[1] ?? x[2] ?? '').join(' ') : (m[2] ?? '')
        for (const t of raw.split(/\s+/).filter(Boolean)) {
          tokens++
          expect(t, `${f}: ${t}`).not.toMatch(utility)
          expect(t.startsWith('g-'), `${f}: unprefixed class ${t}`).toBe(true)
        }
      }
    }
    expect(tokens).toBeGreaterThan(30)
  })
})
