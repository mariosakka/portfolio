// Path geometry: exact points and tangents on cubic paths, so art can be attached to a vine.
import type { Anchor, Cubic, PathModel, Pt } from './types'

const STEPS = 16
const r1 = (n: number): number => Math.round(n * 10) / 10

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

function evalCubic(s: Cubic, t: number): Pt {
  const u = 1 - t
  const k0 = u * u * u
  const k1 = 3 * u * u * t
  const k2 = 3 * u * t * t
  const k3 = t * t * t
  return { x: k0 * s.p0.x + k1 * s.p1.x + k2 * s.p2.x + k3 * s.p3.x, y: k0 * s.p0.y + k1 * s.p1.y + k2 * s.p2.y + k3 * s.p3.y }
}

function tangentCubic(s: Cubic, t: number): number {
  const u = 1 - t
  let dx = 3 * u * u * (s.p1.x - s.p0.x) + 6 * u * t * (s.p2.x - s.p1.x) + 3 * t * t * (s.p3.x - s.p2.x)
  let dy = 3 * u * u * (s.p1.y - s.p0.y) + 6 * u * t * (s.p2.y - s.p1.y) + 3 * t * t * (s.p3.y - s.p2.y)
  if (Math.abs(dx) + Math.abs(dy) < 1e-9) {
    // Degenerate control point: fall back to the chord.
    dx = s.p3.x - s.p0.x
    dy = s.p3.y - s.p0.y
  }
  return (Math.atan2(dy, dx) * 180) / Math.PI
}

/** Build a path model (SVG `d`, cumulative arc lengths) from cubic segments. */
export function pathModel(segs: Cubic[]): PathModel {
  const tabs: number[][] = []
  const cum: number[] = []
  let total = 0
  let d = ''
  segs.forEach((s, i) => {
    if (i === 0) d = `M${s.p0.x} ${s.p0.y}`
    d += ` C${s.p1.x} ${s.p1.y} ${s.p2.x} ${s.p2.y} ${s.p3.x} ${s.p3.y}`
    const tab = [0]
    let prev = s.p0
    let len = 0
    for (let k = 1; k <= STEPS; k++) {
      const p = evalCubic(s, k / STEPS)
      len += Math.hypot(p.x - prev.x, p.y - prev.y)
      tab.push(len)
      prev = p
    }
    tabs.push(tab)
    total += len
    cum.push(total)
  })
  return { segs, tabs, cum, total, d }
}

/**
 * Parse an absolute `M x y` followed by `C`, `S`, `Q` or `L` commands (implicit repeats allowed).
 * Anything else throws, so a bad path fails loudly instead of attaching art to nothing.
 */
export function parsePath(d: string): PathModel {
  const tokens = d.match(/[MCSQL]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []
  const segs: Cubic[] = []
  let i = 0
  let cmd = ''
  let cur: Pt | undefined
  const num = (): number => {
    const v = Number(tokens[i++])
    if (!Number.isFinite(v)) throw new Error(`parsePath: bad number in "${d}"`)
    return v
  }
  const pt = (): Pt => ({ x: num(), y: num() })
  if (/[^MCSQLmcsql\d\s,.eE+-]/.test(d)) throw new Error(`parsePath: unsupported command in "${d}"`)
  while (i < tokens.length) {
    const t = tokens[i] ?? ''
    if (/^[A-Za-z]$/.test(t)) { cmd = t.toUpperCase(); i++ }
    if (cmd === 'M') { cur = pt(); cmd = 'L'; continue }
    if (!cur) throw new Error('parsePath: path must start with M')
    if (cmd === 'C') {
      const p1 = pt(); const p2 = pt(); const p3 = pt()
      segs.push({ p0: cur, p1, p2, p3 }); cur = p3
    } else if (cmd === 'S') {
      const p2 = pt(); const p3 = pt()
      const prev = segs[segs.length - 1]
      const p1 = prev ? { x: 2 * cur.x - prev.p2.x, y: 2 * cur.y - prev.p2.y } : cur
      segs.push({ p0: cur, p1, p2, p3 }); cur = p3
    } else if (cmd === 'Q') {
      const q = pt(); const p3 = pt()
      segs.push({ p0: cur, p1: { x: lerp(cur.x, q.x, 2 / 3), y: lerp(cur.y, q.y, 2 / 3) }, p2: { x: lerp(p3.x, q.x, 2 / 3), y: lerp(p3.y, q.y, 2 / 3) }, p3 })
      cur = p3
    } else if (cmd === 'L') {
      const p3 = pt()
      segs.push({ p0: cur, p1: { x: lerp(cur.x, p3.x, 1 / 3), y: lerp(cur.y, p3.y, 1 / 3) }, p2: { x: lerp(cur.x, p3.x, 2 / 3), y: lerp(cur.y, p3.y, 2 / 3) }, p3 })
      cur = p3
    } else throw new Error(`parsePath: unsupported command "${cmd}"`)
  }
  if (!segs.length) throw new Error('parsePath: no segments')
  return pathModel(segs)
}

/**
 * Point and tangent angle (degrees, direction of travel) at arc fraction `f` (0..1). The point is
 * evaluated on the curve itself, so it lies exactly on the stroke centre line.
 */
export function pointAt(model: PathModel, f: number): Anchor {
  const target = Math.min(1, Math.max(0, f)) * model.total
  let i = model.cum.findIndex((c) => c >= target)
  if (i < 0) i = model.segs.length - 1
  const seg = model.segs[i]
  const tab = model.tabs[i]
  if (!seg || !tab) throw new Error('pointAt: empty path')
  const start = i ? (model.cum[i - 1] ?? 0) : 0
  const local = target - start
  let k = tab.findIndex((l) => l >= local)
  if (k < 0) k = STEPS
  const l0 = tab[Math.max(0, k - 1)] ?? 0
  const l1 = tab[k] ?? l0
  const t = (Math.max(0, k - 1) + (l1 > l0 ? (local - l0) / (l1 - l0) : 0)) / STEPS
  const p = evalCubic(seg, Math.min(1, Math.max(0, t)))
  return { x: p.x, y: p.y, angle: tangentCubic(seg, Math.min(1, Math.max(0, t))) }
}

/** Distance from `p` to the path, measured against a dense polyline (used by tests and bounds checks). */
export function distanceToPath(model: PathModel, p: Pt, samples = 40): number {
  let best = Infinity
  for (const s of model.segs) {
    let a = s.p0
    for (let k = 1; k <= samples; k++) {
      const b = evalCubic(s, k / samples)
      const vx = b.x - a.x
      const vy = b.y - a.y
      const l2 = vx * vx + vy * vy
      const t = l2 ? Math.min(1, Math.max(0, ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2)) : 0
      best = Math.min(best, Math.hypot(a.x + vx * t - p.x, a.y + vy * t - p.y))
      a = b
    }
  }
  return best
}

export { evalCubic as cubicPoint, r1 as round1 }
