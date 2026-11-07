// Sprout layouts: seeded vines and plants growing out of and around a parent box (a card, a photo, a heading).
// Coordinates: the parent's padding box is (0,0)-(width,height); art lives in the ring of `reach` px around it and
// may overlap the box by at most SPROUT_OVERLAP px along its border, never over the inner content.
import { cubicPoint, parsePath, pathModel, pointAt, round1 } from './anchor'
import { EXTRA_PALETTES, FLOWER_SPECIES, LEAF, SPECIES_SCALE } from './flowers'
import { growPlant } from './grow'
import { mulberry32 } from './rng'
import { clamp01 } from './timeline'
import type { Anchor, Cubic, PathModel, PlantSpec, Pt, Species, SproutDensity, SproutLayout, SproutLayoutOptions, SproutLeaf, SproutPlant, SproutVariant, SproutVine } from './types'

export const SPROUT_VARIANTS: readonly SproutVariant[] = ['corners', 'edge', 'wrap', 'hang', 'climb', 'burst']
/** Open flowers per parent for each density (inclusive range). */
export const SPROUT_FLOWERS: Record<SproutDensity, readonly [number, number]> = { 1: [3, 4], 2: [6, 9], 3: [10, 14] }
/** Max px any art may reach inside the parent box (along its border only). */
export const SPROUT_OVERLAP = 8
// Generator margin below SPROUT_OVERLAP so sampled checks between our sample points stay inside the limit.
const LIMIT = SPROUT_OVERLAP - 1

/** Numeric seed for a string or number seed (FNV-1a for strings). */
export function seedNumber(seed: string | number): number {
  if (typeof seed === 'number') return Math.floor(Math.abs(seed)) >>> 0
  let h = 2166136261
  for (const ch of seed) { h ^= ch.codePointAt(0) ?? 0; h = Math.imul(h, 16777619) }
  return h >>> 0
}

/** The variant `auto` resolves to. Consecutive numeric seeds always differ, so neighbouring cards differ. */
export function pickVariant(seed: string | number): SproutVariant {
  const n = typeof seed === 'number' ? Math.floor(seed) : seedNumber(seed)
  return SPROUT_VARIANTS[((n % SPROUT_VARIANTS.length) + SPROUT_VARIANTS.length) % SPROUT_VARIANTS.length] ?? 'corners'
}

/** Drawn fraction of a vine at `t` ms after the trigger (ease-out). */
export const vineDrawn = (v: SproutVine, t: number): number => 1 - (1 - clamp01((t - v.delay) / v.duration)) ** v.ease
/** Progress 0..1 of a plant or leaf at `t` ms after the trigger. */
export const itemProgress = (i: { delay: number; duration: number }, t: number): number => clamp01((t - i.delay) / i.duration)

// ---- geometry helpers ----

interface Box { w: number; h: number; r: number }
/** How deep `p` lies inside the parent (negative = outside). */
const depth = (b: Box, p: Pt): number => Math.min(p.x, b.w - p.x, p.y, b.h - p.y)
const outside = (b: Box, p: Pt): number => Math.hypot(Math.max(-p.x, 0, p.x - b.w), Math.max(-p.y, 0, p.y - b.h))
/** Upper bound of the deepest point of a disc inside the parent. */
const discDepth = (b: Box, c: Pt, r: number): number => { const o = outside(b, c); return o > 0 ? Math.min(depth(b, c) + r, r - o) : depth(b, c) + r }
const inRing = (b: Box, p: Pt, pad: number): boolean => p.x >= -b.r + pad && p.x <= b.w + b.r - pad && p.y >= -b.r + pad && p.y <= b.h + b.r - pad
const okPoint = (b: Box, p: Pt, half: number): boolean => depth(b, p) + half <= LIMIT && inRing(b, p, half + 0.5)
const okDisc = (b: Box, c: Pt, r: number): boolean => discDepth(b, c, r) <= LIMIT && inRing(b, c, r + 0.5)

const LEAF_PTS: Pt[] = (() => { const m = parsePath(LEAF.d.replace(/Z$/, '')); return Array.from({ length: 49 }, (_, i) => pointAt(m, i / 48)) })()
function okLeaf(b: Box, x: number, y: number, rot: number, size: number): boolean {
  const c = Math.cos((rot * Math.PI) / 180)
  const s = Math.sin((rot * Math.PI) / 180)
  return LEAF_PTS.every((q) => okPoint(b, { x: x + (q.x * c - q.y * s) * size, y: y + (q.x * s + q.y * c) * size }, 0.6))
}

/**
 * Perimeter frame: a rounded rectangle slightly inside the parent's corners. `at(u, h)` is the point at arc
 * position `u` (clockwise from the top-left, wrapping) pushed `h` px along the outward normal.
 */
interface Piece { u0: number; len: number; arc: boolean; x: number; y: number; dx: number; dy: number; nx: number; ny: number; a0: number }
function perimeter(w: number, h: number): { P: number; arc: number; edge: (e: number) => [number, number]; corner: (c: number) => number; at: (u: number, hh: number) => Pt; normal: (u: number) => Pt } {
  const rho = Math.max(0.5, Math.min(14, w / 3, h / 3))
  const arc = (Math.PI * rho) / 2
  const lw = w - 2 * rho
  const lh = h - 2 * rho
  const pieces: Piece[] = []
  let u = 0
  const line = (x: number, y: number, dx: number, dy: number, len: number, nx: number, ny: number): void => { pieces.push({ u0: u, len, arc: false, x, y, dx, dy, nx, ny, a0: 0 }); u += len }
  const turn = (x: number, y: number, a0: number): void => { pieces.push({ u0: u, len: arc, arc: true, x, y, dx: 0, dy: 0, nx: 0, ny: 0, a0 }); u += arc }
  line(rho, 0, 1, 0, lw, 0, -1); turn(w - rho, rho, -Math.PI / 2)
  line(w, rho, 0, 1, lh, 1, 0); turn(w - rho, h - rho, 0)
  line(w - rho, h, -1, 0, lw, 0, 1); turn(rho, h - rho, Math.PI / 2)
  line(0, h - rho, 0, -1, lh, -1, 0); turn(rho, rho, Math.PI)
  const P = u
  const find = (uu: number): { p: Piece; s: number } => {
    const v = ((uu % P) + P) % P
    const p = pieces.find((q) => v < q.u0 + q.len) ?? pieces[pieces.length - 1] ?? pieces[0]
    if (!p) throw new Error('perimeter: no pieces')
    return { p, s: v - p.u0 }
  }
  const normal = (uu: number): Pt => {
    const { p, s } = find(uu)
    if (!p.arc) return { x: p.nx, y: p.ny }
    const a = p.a0 + s / rho
    return { x: Math.cos(a), y: Math.sin(a) }
  }
  const at = (uu: number, hh: number): Pt => {
    const { p, s } = find(uu)
    const n = normal(uu)
    const base = p.arc ? { x: p.x + rho * n.x, y: p.y + rho * n.y } : { x: p.x + p.dx * s, y: p.y + p.dy * s }
    return { x: base.x + hh * n.x, y: base.y + hh * n.y }
  }
  // edge e: 0 top, 1 right, 2 bottom, 3 left (straight part [u0, u0 + len]); corner c: 0 TR, 1 BR, 2 BL, 3 TL (arc middle).
  const edge = (e: number): [number, number] => { const p = pieces[(e % 4) * 2]; return p ? [p.u0, p.len] : [0, 0] }
  const corner = (c: number): number => { const p = pieces[(c % 4) * 2 + 1]; return p ? p.u0 + p.len / 2 : 0 }
  return { P, arc, edge, corner, at, normal }
}

/** Catmull-Rom through `pts`, as cubic segments. */
function smooth(pts: Pt[]): Cubic[] {
  const segs: Cubic[] = []
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)] as Pt
    const p0 = pts[i] as Pt
    const p3 = pts[i + 1] as Pt
    const d = pts[Math.min(pts.length - 1, i + 2)] as Pt
    const r = (q: Pt): Pt => ({ x: round1(q.x), y: round1(q.y) })
    segs.push({ p0: r(p0), p1: r({ x: p0.x + (p3.x - a.x) / 6, y: p0.y + (p3.y - a.y) / 6 }), p2: r({ x: p3.x - (d.x - p0.x) / 6, y: p3.y - (d.y - p0.y) / 6 }), p3: r(p3) })
  }
  return segs
}

// ---- layout ----

interface Program {
  /** Points of the vine in perimeter space. */
  u: (t: number) => number
  h: (t: number) => number
  curl: boolean
  /** Index of the parent vine and the arc fraction it leaves from. */
  parent?: { vine: number; f: number }
  branch?: boolean
}

interface Built { path: PathModel; tipF: number; branch: boolean; parent?: { vine: number; f: number } }

const SPECIES_ALL: Species[] = ['bloom', 'cornflower', 'daisy', 'forgetmenot', 'bell']

/** Pure and deterministic: the same options always give the same layout. */
export function layoutSprouts(opts: SproutLayoutOptions): SproutLayout {
  const w = Math.max(0, Math.round(opts.width))
  const hgt = Math.max(0, Math.round(opts.height))
  const R = Math.max(12, opts.reach ?? 40)
  const density = opts.density ?? 2
  const seed = seedNumber(opts.seed)
  const variant = !opts.variant || opts.variant === 'auto' ? pickVariant(opts.seed) : opts.variant
  const empty: SproutLayout = { variant, width: w, height: hgt, reach: R, vines: [], plants: [], leaves: [], flowers: 0, buds: 0, total: 0 }
  if (w < 1 || hgt < 1) return empty
  const rnd = mulberry32((Math.imul(seed, 2246822519) ^ (SPROUT_VARIANTS.indexOf(variant) * 97 + density * 13 + 7)) >>> 0)
  const box: Box = { w, h: hgt, r: R }
  const k = Math.min(2, Math.max(0.5, R / 40))
  const hMax = R - 9 * k
  const per = perimeter(w, hgt)
  const between = (a: number, b: number): number => a + rnd() * (b - a)
  const sign = (): 1 | -1 => (rnd() < 0.5 ? -1 : 1)
  const cap = (n: number): number => Math.min(hMax, n)

  // Short sprout leaving the border at `u0` and curling outward.
  const sprout = (u0: number, len: number, drift: number): Program => ({ u: (t) => u0 + drift * t, h: (t) => 0.8 + cap(len) * t ** 0.9, curl: true })

  const programs: Program[] = []
  // Side branches start on a knot of their parent vine (resolved once the parent is built).
  const lens = new Map<Program, number>()
  const addBranches = (vine: number, n: number, short = false): void => {
    for (let i = 0; i < n; i++) {
      const pg: Program = { u: () => 0, h: () => 0, curl: true, branch: true, parent: { vine, f: ((i + 0.3 + rnd() * 0.5) / n) * 0.8 + 0.1 } }
      lens.set(pg, short ? between(10, 18) * k : between(13, 26) * k)
      programs.push(pg)
    }
  }

  if (variant === 'corners') {
    const nc = density === 1 ? 1 : density === 2 ? (rnd() < 0.5 ? 1 : 2) : 2
    const c0 = Math.floor(rnd() * 4)
    const cs = nc === 1 ? [c0] : [c0, (c0 + (rnd() < 0.5 ? 2 : 1)) % 4]
    for (const c of cs) {
      const cu = per.corner(c)
      const nv = density === 3 || nc === 1 ? 3 : 2
      for (let j = 0; j < nv; j++) {
        if (j === 2) {
          const drift = (rnd() - 0.5) * per.arc * 0.8
          const len = between(20, 32) * k
          programs.push({ u: (t) => cu + drift * t, h: (t) => 1 + cap(len) * t ** 1.1, curl: true })
          continue
        }
        const s = j ? 1 : -1
        const [, elen] = per.edge(s > 0 ? c + 1 : c)
        const along = Math.min(elen * 0.45 + 6, between(35, 90) * k)
        const lift = between(14, 30) * k
        const start = cu + s * (per.arc / 2 + between(2, 10))
        programs.push({ u: (t) => start + s * along * t, h: (t) => 1.2 + cap(lift) * t ** 1.6, curl: true })
      }
    }
  } else if (variant === 'edge' || variant === 'climb') {
    let u0: number
    let u1: number
    if (variant === 'edge') {
      let e = Math.floor(rnd() * 4)
      if (per.edge(e)[1] < 0.6 * Math.max(per.edge(e + 1)[1], per.edge(e)[1])) e = (e + 1) % 4 // prefer a long edge
      const [us, len] = per.edge(e)
      const span = len * Math.min(0.95, 0.45 + 0.15 * density + rnd() * 0.15)
      const off = rnd() * (len - span)
      ;[u0, u1] = rnd() < 0.5 ? [us + off, us + off + span] : [us + off + span, us + off]
    } else {
      const right = rnd() < 0.5
      const reachF = Math.min(0.95, 0.55 + 0.12 * density + rnd() * 0.1)
      const [bs, bl] = per.edge(2)
      const d = Math.min(bl * 0.5, between(20, 60) * k)
      if (right) {
        const [rs, rl] = per.edge(1)
        u0 = bs + d
        u1 = rs + rl * (1 - reachF)
      } else {
        const [ls, ll] = per.edge(3)
        u0 = bs + bl - d
        u1 = ls + ll * reachF
      }
    }
    const span = Math.abs(u1 - u0)
    const waves = 1 + Math.floor(span / (170 * k))
    const ph = rnd() * Math.PI * 2
    const amp = between(2.5, 4.5)
    programs.push({ u: (t) => u0 + (u1 - u0) * t, h: (t) => k * (1.2 + Math.min(1, 5 * t) * (amp + 0.5 + amp * Math.sin(2 * Math.PI * waves * t + ph))), curl: variant === 'climb' || rnd() < 0.5 })
    addBranches(0, density + 1)
  } else if (variant === 'wrap') {
    const c0 = Math.floor(rnd() * 4)
    const cs = density === 3 ? [c0, (c0 + 2) % 4] : [c0]
    for (const c of cs) {
      const cu = per.corner(c)
      const pre = per.edge(c)[1] * Math.min(0.85, between(0.3, 0.55) + 0.08 * density)
      const post = per.edge(c + 1)[1] * Math.min(0.85, between(0.3, 0.55) + 0.08 * density)
      const ph = rnd() * Math.PI * 2
      const start = cu - per.arc / 2 - pre
      const total = pre + per.arc + post
      programs.push({ u: (t) => start + total * t, h: (t) => k * (1.6 + 1.6 * (1 + Math.sin(2 * Math.PI * 2 * t + ph))), curl: rnd() < 0.6 })
      addBranches(programs.length - 1, density, true)
    }
  } else if (variant === 'hang') {
    const [, lw] = per.edge(0)
    const n = Math.max(1, Math.round(lw / (between(120, 190) * k)))
    const top = cap(between(13, 19) * k)
    const dip = top - between(3.5, 6) * k
    const start = per.corner(3) - per.P - between(0, per.arc / 2)
    const len = per.corner(0) + between(0, per.arc / 2) - start
    programs.push({ u: (t) => start + len * t, h: (t) => top - dip * Math.abs(Math.sin(Math.PI * n * t)), curl: false })
    const drops = density === 1 ? [rnd() < 0.5 ? 0 : 3] : [0, 3]
    for (const c of drops) {
      const cu = per.corner(c)
      const s = c === 0 ? 1 : -1
      const side = per.edge(c === 0 ? 1 : 3)[1]
      const down = per.arc / 2 + side * Math.min(0.9, 0.25 + 0.15 * density + rnd() * 0.15)
      const ph = rnd() * Math.PI * 2
      programs.push({ u: (t) => cu + s * down * t, h: (t) => k * (4.5 + 1.5 * Math.sin(2 * Math.PI * t + ph)) + (top - 4.5 * k - 1.5 * k * Math.sin(ph)) * (1 - t) ** 2, curl: true })
    }
  } else {
    const n = 2 + density * 2
    const off = rnd()
    for (let i = 0; i < n; i++) {
      const u0 = (per.P * (i + off + (rnd() - 0.5) * 0.6)) / n
      programs.push(sprout(u0, between(14, 30) * k, (rnd() - 0.5) * 40 * k))
    }
  }

  // ---- build paths ----
  const built: Built[] = []
  const uhKnots: { u: number; h: number }[][] = [] // perimeter (u, h) of each kept knot, by program index
  const builtIndex = new Map<number, number>() // program index -> built index
  const buildProgram = (pg: Program): void => {
    let uf = pg.u
    let hf = pg.h
    if (pg.parent) {
      const knots = uhKnots[pg.parent.vine]
      if (!knots?.length) return
      const kn = knots[Math.min(knots.length - 1, Math.max(0, Math.round(pg.parent.f * (knots.length - 1))))] ?? knots[0]
      if (!kn) return
      const len = lens.get(pg) ?? 16 * k
      const drift = sign() * between(10, 26) * k
      uf = (t) => kn.u + drift * t
      hf = (t) => kn.h + Math.max(0, Math.min(len, hMax - kn.h)) * t ** 1.2
    }
    const dense: { p: Pt; u: number; h: number }[] = []
    for (let i = 0; i <= 240; i++) {
      const t = i / 240
      const u = uf(t)
      const hh = hf(t)
      dense.push({ p: per.at(u, hh), u, h: hh })
    }
    const keep = [dense[0]]
    for (const d of dense.slice(1, -1)) {
      const last = keep[keep.length - 1]
      if (last && Math.hypot(d.p.x - last.p.x, d.p.y - last.p.y) >= 11) keep.push(d)
    }
    const end = dense[dense.length - 1]
    const lastKept = keep[keep.length - 1]
    if (end && lastKept && Math.hypot(end.p.x - lastKept.p.x, end.p.y - lastKept.p.y) > 3) keep.push(end)
    const ks = keep.filter((x): x is { p: Pt; u: number; h: number } => Boolean(x))
    if (ks.length < 2) return
    const pts = ks.map((x) => x.p)
    const tipCount = pts.length
    if (pg.curl) {
      const a = pts[pts.length - 2] as Pt
      const b = pts[pts.length - 1] as Pt
      const heading = Math.atan2(b.y - a.y, b.x - a.x)
      let best: Pt[] | null = null
      let bestD = Infinity
      for (const dir of [sign(), 0]) {
        const dd = dir === 0 ? -1 : dir
        const curl: Pt[] = []
        let p = b
        let th = heading
        let step = 6 * k
        for (let i = 0; i < 7; i++) {
          th += dd * 0.6
          p = { x: p.x + Math.cos(th) * step, y: p.y + Math.sin(th) * step }
          step *= 0.8
          curl.push(p)
        }
        const worst = Math.max(...curl.map((q) => depth(box, q)))
        if (curl.every((q) => okPoint(box, q, 2)) && worst < bestD) { best = curl; bestD = worst }
        if (dir === 0) break
      }
      if (best) pts.push(...best)
    }
    const path = pathModel(smooth(pts))
    const tipF = pg.curl && pts.length > tipCount ? (path.cum[tipCount - 2] ?? path.total) / path.total : 1
    // Reject any vine that would dip into the parent (it never should by construction).
    for (const seg of path.segs) for (let i = 0; i <= 16; i++) if (!okPoint(box, cubicPoint(seg, i / 16), 1.8 * Math.min(1.4, Math.max(0.8, k)))) return
    built.push({ path, tipF, branch: Boolean(pg.branch), ...(pg.parent ? { parent: { vine: builtIndex.get(pg.parent.vine) ?? 0, f: pg.parent.f } } : {}) })
    builtIndex.set(programs.indexOf(pg), built.length - 1)
    uhKnots[programs.indexOf(pg)] = ks.map((x) => ({ u: x.u, h: x.h }))
  }
  for (const pg of programs) buildProgram(pg)

  // ---- plants ----
  const [lo, hi] = SPROUT_FLOWERS[density]
  const target = lo + Math.floor(rnd() * (hi - lo + 1))
  const plants: { spec: PlantSpec; vine: number; f: number; flowers: number }[] = []
  const discs: { c: Pt; r: number }[] = []
  let flowers = 0
  let buds = 0

  const outwardAt = (p: Pt): Pt => {
    const cx = Math.min(w, Math.max(0, p.x))
    const cy = Math.min(hgt, Math.max(0, p.y))
    const dx = p.x - cx
    const dy = p.y - cy
    const l = Math.hypot(dx, dy)
    if (l > 0.5) return { x: dx / l, y: dy / l }
    const d = [p.y, w - p.x, hgt - p.y, p.x]
    const i = d.indexOf(Math.min(...d))
    return [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }][i] ?? { x: 0, y: -1 }
  }
  const pickSpecies = (out: Pt): Species => {
    const r = rnd()
    if (variant === 'hang') return r < 0.42 ? 'bell' : r < 0.74 ? 'forgetmenot' : (SPECIES_ALL[Math.floor(rnd() * 4)] ?? 'daisy')
    if (out.y > 0.6 && r < 0.45) return 'bell'
    return SPECIES_ALL[Math.floor(rnd() * SPECIES_ALL.length)] ?? 'bloom'
  }
  const radiusFor = (bud: boolean): number => {
    if (bud) return between(4.5, 7) * k
    const r = rnd()
    return (r < 0.3 ? between(6, 9) : r < 0.7 ? between(9.5, 14) : between(14.5, 20)) * k
  }
  /** Validate a plant against the parent box and other flowers; returns its discs and open flower count, or null. */
  const check = (spec: PlantSpec): { d: { c: Pt; r: number }[]; open: number } | null => {
    const g = growPlant(spec)
    const d: { c: Pt; r: number }[] = []
    let open = 0
    for (const n of g.nodes) {
      for (let i = 0; i <= 16; i++) if (!okPoint(box, pointAt(n.stem, i / 16), 1.6)) return null
      for (const l of n.leaves) if (!okLeaf(box, l.x, l.y, l.rotate, l.size)) return null
      const r = n.flower.extent * n.at.scale
      if (!okDisc(box, n.at, r)) return null
      d.push({ c: { x: n.at.x, y: n.at.y }, r })
      if (!n.flower.closed) open++
    }
    for (const a of d) for (const o of discs) if (Math.hypot(a.c.x - o.c.x, a.c.y - o.c.y) < 0.8 * (a.r + o.r)) return null
    return { d, open }
  }
  const tryPlant = (vine: number, f: number, tip: boolean, bud: boolean): boolean => {
    const v = built[vine]
    if (!v) return false
    const anchor: Anchor = pointAt(v.path, f)
    const out = outwardAt(anchor)
    const species = bud ? SPECIES_ALL[Math.floor(rnd() * SPECIES_ALL.length)] ?? 'bloom' : pickSpecies(out)
    const r = radiusFor(bud)
    const ext = FLOWER_SPECIES[species].length * SPECIES_SCALE[species]
    const spread = tip ? between(15, 40) : between(55, 100)
    const rad = (deg: number): number => (deg * Math.PI) / 180
    const sideOut = (s: 1 | -1): number => { const a = rad(anchor.angle - s * spread); return Math.cos(a) * out.x + Math.sin(a) * out.y }
    const side: 1 | -1 = sideOut(1) >= sideOut(-1) ? 1 : -1
    const room = hi - flowers
    const nb = !bud && density >= 2 && room >= 3 && rnd() < 0.22 ? (rnd() < 0.5 ? 1 : 2) : 0
    const base: PlantSpec = {
      species, seed: (seed % 100003) * 37 + plants.length * 7 + vine * 101 + 3, anchor, side, spread: Math.round(spread),
      reach: round1(r * 1.15 + between(4, 12) * k), size: round1(Math.max(0.08, r / ext) * 100) / 100,
      leaves: bud ? 1 : r > 10 * k ? 1 + Math.floor(rnd() * 2) : Math.floor(rnd() * 2), branches: nb, bud,
      ...(rnd() < 0.45 ? { palette: EXTRA_PALETTES[Math.floor(rnd() * EXTRA_PALETTES.length)] } : {}),
    }
    const tries: PlantSpec[] = [
      base,
      { ...base, branches: 0 },
      { ...base, branches: 0, side: side === 1 ? -1 : 1 },
      { ...base, branches: 0, size: round1((base.size ?? 1) * 70) / 100, leaves: Math.min(1, base.leaves ?? 0) },
      { ...base, branches: 0, size: round1((base.size ?? 1) * 70) / 100, reach: round1((base.reach ?? 20) * 0.7), leaves: 0, spread: tip ? 10 : 70 },
      { ...base, species: 'forgetmenot', branches: 0, size: round1(Math.max(0.08, (6 * k) / (FLOWER_SPECIES.forgetmenot.length * SPECIES_SCALE.forgetmenot)) * 100) / 100, reach: round1(9 * k), leaves: 0, spread: tip ? 10 : 80 },
    ]
    for (const spec of tries) {
      const res = check(spec)
      if (!res) continue
      if (!bud && flowers + res.open > hi) continue
      discs.push(...res.d)
      plants.push({ spec, vine, f, flowers: bud ? 0 : res.open })
      if (bud) buds++
      else flowers += res.open
      buds += spec.branches && spec.branches > 1 ? 1 : 0
      return true
    }
    return false
  }
  const candidates = (from: number): { vine: number; f: number; tip: boolean }[] => {
    const tips: { vine: number; f: number; tip: boolean }[] = []
    const sides: { vine: number; f: number; tip: boolean }[] = []
    built.slice(from).forEach((v, j) => {
      const i = from + j
      tips.push({ vine: i, f: v.tipF, tip: true })
      const n = Math.max(1, Math.floor((v.path.total * v.tipF) / (24 * k)))
      for (let s = 1; s < n; s++) sides.push({ vine: i, f: (v.tipF * (s + (rnd() - 0.5) * 0.5)) / n, tip: false })
    })
    const shuffle = <T>(a: T[]): T[] => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i] as T; a[i] = a[j] as T; a[j] = t } return a }
    return [...shuffle(tips), ...shuffle(sides)]
  }
  let pool = candidates(0)
  const fill = (): void => { while (flowers < target && pool.length) { const c = pool.shift(); if (c) tryPlant(c.vine, c.f, c.tip, false) } }
  fill()
  // Not enough room on the variant's vines (small parents): add short sprouts elsewhere on the border.
  for (let extra = 0; extra < 14 && flowers < lo; extra++) {
    const before = built.length
    const pg = sprout(rnd() * per.P, between(14, 28) * k, (rnd() - 0.5) * 30 * k)
    programs.push(pg)
    buildProgram(pg)
    pool = candidates(before)
    fill()
  }
  const budTarget = density
  // Bare sprout tips look unfinished: give each a bud when it has room.
  for (const [vine, v] of built.entries()) if (!plants.some((p) => p.vine === vine && Math.abs(p.f - v.tipF) < 1e-9)) tryPlant(vine, v.tipF, true, true)
  const budPool = [...pool, ...built.flatMap((v, vine) => Array.from({ length: 6 }, () => ({ vine, f: v.tipF * between(0.15, 1) })))]
  for (let i = 0; i < budPool.length && buds < budTarget; i++) { const c = budPool[i]; if (c) tryPlant(c.vine, c.f, false, true) }

  // ---- leaves on the vines ----
  const leafRaw: { vine: number; f: number; x: number; y: number; rotate: number; size: number }[] = []
  built.forEach((v, i) => {
    const step = Math.min(between(18, 30) * k, Math.max(9, v.path.total / 3))
    let s = between(0.4, 1) * step
    let side: number = sign()
    while (s < v.path.total * v.tipF - 6) {
      const f = s / v.path.total
      const a = pointAt(v.path, f)
      const size = round1(between(0.18, 0.32) * k * 100) / 100
      const turn = between(40, 75)
      found: for (const sc of [1, 0.7]) {
        for (const sd of [side, -side]) {
          const rotate = Math.round(a.angle - sd * turn)
          const sz = round1(size * sc * 100) / 100
          if (okLeaf(box, a.x, a.y, rotate, sz)) { leafRaw.push({ vine: i, f, x: round1(a.x), y: round1(a.y), rotate, size: sz }); break found }
        }
      }
      side = -side
      s += step * between(0.8, 1.3)
    }
  })

  // ---- timing: every vine starts on its own, a moment after the parent appears ----
  const startAt = 120 + rnd() * 380
  const vines: SproutVine[] = []
  const timeAt = (i: number, f: number): number => {
    const v = vines[i]
    return v ? v.delay + v.duration * (1 - (1 - clamp01(f)) ** (1 / v.ease)) : 0
  }
  built.forEach((b, i) => {
    const delay = b.parent ? timeAt(b.parent.vine, b.parent.f) + rnd() * 200 : startAt + rnd() * 1400
    const duration = Math.min(1800, Math.max(600, 400 + b.path.total * 4)) * between(0.8, 1.2)
    vines.push({ id: `v${i}`, path: b.path, width: round1((b.branch ? 1.6 : 2.4) * Math.min(1.4, Math.max(0.8, k))), delay: round1(delay), duration: Math.round(duration), ease: Math.round(between(1.3, 2.7) * 100) / 100 })
  })
  const outPlants: SproutPlant[] = plants.map((p, i) => ({ id: `p${i}`, spec: p.spec, delay: round1(timeAt(p.vine, p.f) + 60 + rnd() * 500), duration: Math.round(between(1700, 2700)), flowers: p.flowers }))
  const leaves: SproutLeaf[] = leafRaw.map((l, i) => ({ id: `l${i}`, x: l.x, y: l.y, rotate: l.rotate, size: l.size, delay: round1(timeAt(l.vine, l.f) + rnd() * 120), duration: Math.round(between(700, 1000)) }))
  const total = Math.ceil(Math.max(0, ...vines.map((v) => v.delay + v.duration), ...outPlants.map((p) => p.delay + p.duration), ...leaves.map((l) => l.delay + l.duration)))
  return { variant, width: w, height: hgt, reach: R, vines, plants: outPlants, leaves, flowers, buds, total }
}
