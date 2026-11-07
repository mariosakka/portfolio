/* eslint-disable vue/one-component-per-file -- test helpers define throwaway components */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref, nextTick } from 'vue'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import SectionBlock from '../components/SectionBlock.vue'
import { useGrow, Vine, Bloom, Cornflower, Leaf, Bud, Bell, ForgetMeNot, Daisy, Spray, Plant, pointAt, parsePath, distanceToPath, generateFlower, growPlant, phase, petalPhase, PHASES, useGrowthTimeline, FLOWER_SPECIES } from './index'
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

// A long downward S-curve standing in for any vine path.
const VINE = parsePath('M90 0 C90 150 40 250 60 400 S130 700 90 1000 S40 1300 80 1600')

describe('path anchoring', () => {
  const vine = VINE
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
    expect(pointAt(vine, 1).y).toBeCloseTo(1600, 0)
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
  const vine = VINE
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
  it('leaf bases lie on their stem', () => {
    for (const s of all) for (const n of growPlant(s).nodes) for (const l of n.leaves) expect(distanceToPath(n.stem, l, 400)).toBeLessThan(0.1)
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
  it('Plant renders each flower at its stem end, axis along the end tangent plus an integer tilt', () => {
    mockMedia(true); mockIO()
    const roots = [
      mount(Plant, { props: { species: 'bell', anchor: { x: 40, y: 100, angle: 90 }, branches: 2, seed: 4 } }),
      mount(Plant, { props: { species: 'bloom', anchor: { x: 40, y: 100, angle: 0 }, branches: 3, seed: 7 } }),
      mount(Plant, { props: { species: 'daisy', anchor: { x: 0, y: 0, angle: 180 }, branches: 2, seed: 2, side: -1 } }),
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

describe('Plant sway', () => {
  it('is opt-in', () => {
    mockMedia(false); mockIO()
    const w = mount(Plant, { props: { species: 'bloom', anchor: { x: 20, y: 20, angle: 90 }, progress: 1, grown: true } })
    expect(w.findAll('.g-is-swaying')).toHaveLength(0)
    const s = mount(Plant, { props: { species: 'bloom', anchor: { x: 20, y: 20, angle: 90 }, progress: 1, grown: true, sway: true } })
    expect(s.findAll('.g-is-swaying')).toHaveLength(1)
  })
})

describe('heading vine (SectionBlock)', () => {
  it('keeps the heading text identical with garden art', () => {
    mockMedia(true)
    const s = mount(SectionBlock, { props: { id: 'x', title: 'Hello' } })
    expect(s.text()).toBe('Hello')
    expect(s.find('svg.g-vine').attributes('aria-hidden')).toBe('true')
  })
})

describe('garden folder rules', () => {
  const files = readdirSync(here).filter((f) => /\.(vue|ts|css)$/.test(f) && !f.endsWith('.test.ts'))
  it('has no imports from outside src/garden except vue', () => {
    expect(files.length).toBeGreaterThan(0)
    expect(files).toEqual(expect.arrayContaining(['index.ts', 'useGrow.ts', 'types.ts', 'Vine.vue', 'garden.css', 'rng.ts', 'anchor.ts', 'flowers.ts', 'grow.ts', 'timeline.ts', 'Plant.vue', 'FlowerArt.vue', 'Spray.vue', 'Bell.vue', 'ForgetMeNot.vue']))
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
