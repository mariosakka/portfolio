// Page-vine helpers: scroll mapping, procedural winding path, seeded placement of leaves and plants.
import { cubicPoint, pathModel, pointAt, round1 } from './anchor'
import { growPlant } from './grow'
import { mulberry32 } from './rng'
import type { Cubic, PathSample, PlaceOptions, PlantSpec, Pt, Species, VineItem, VinePath, VinePathOptions } from './types'

export { mulberry32 }

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/**
 * Fraction of the vine to draw. The tip sits at 60% of the viewport (a little below centre) and the
 * range is scaled so the vine is complete exactly when the page bottom is reached. `scrollY` is
 * relative to the top of the page (or of the vine's container).
 */
export function scrollProgress(scrollY: number, pageHeight: number, viewportHeight: number): number {
  const span = pageHeight - viewportHeight * 0.4
  if (span <= 0) return 1
  return clamp01((scrollY + viewportHeight * 0.6) / span)
}

/** Winding vine top to bottom: cubic S-curves with vertical tangents, x kept inside the strip. */
export function makeVinePath({ seed, height, width = 180, pad = width * 0.28, step = 220 }: VinePathOptions): VinePath {
  const rnd = mulberry32(seed)
  const lo = pad
  const hi = width - pad
  let cur: Pt = { x: round1(lo + rnd() * (hi - lo)), y: 0 }
  let dir = rnd() < 0.5 ? -1 : 1
  const segs: Cubic[] = []
  while (cur.y < height - 1) {
    const dy = Math.min(step * (0.8 + rnd() * 0.5), height - cur.y)
    const nx = dir > 0 ? hi - rnd() * (hi - lo) * 0.35 : lo + rnd() * (hi - lo) * 0.35
    dir = -dir
    const p3 = { x: round1(nx), y: round1(cur.y + dy) }
    segs.push({ p0: cur, p1: { x: cur.x, y: round1(cur.y + dy * 0.5) }, p2: { x: p3.x, y: round1(p3.y - dy * 0.5) }, p3 })
    cur = p3
  }
  const model = pathModel(segs)
  const samples: PathSample[] = []
  model.segs.forEach((seg, si) => {
    const before = si ? (model.cum[si - 1] ?? 0) : 0
    for (let k = si ? 1 : 0; k <= 8; k++) {
      const p = cubicPoint(seg, k / 8)
      const f = (before + (model.tabs[si]?.[k * 2] ?? 0)) / model.total
      samples.push({ x: p.x, y: p.y, f, angle: pointAt(model, f).angle })
    }
  })
  const end = samples[samples.length - 1]
  if (end) end.f = 1
  return { ...model, samples, width, height }
}

// Focal flowers in rotation; `branches` makes a spray with several blooms on one branch.
const FOCAL: { species: Species; branches: number; size: number }[] = [
  { species: 'bloom', branches: 0, size: 1.1 },
  { species: 'bloom', branches: 3, size: 0.9 },
  { species: 'bell', branches: 0, size: 1 },
  { species: 'forgetmenot', branches: 2, size: 1 },
  { species: 'cornflower', branches: 0, size: 1.05 },
  { species: 'daisy', branches: 2, size: 1 },
  { species: 'bell', branches: 2, size: 0.9 },
  { species: 'forgetmenot', branches: 0, size: 1.1 },
]
const COMPACT_SIZE = 0.2

/**
 * Seeded leaves and plants anchored along a vine, ordered by arc fraction. Every plant stem starts exactly
 * on the vine centre line and is shrunk until the whole plant fits inside the strip.
 */
export function placeItems(vine: VinePath, { seed, density = 1, compact = false }: PlaceOptions): VineItem[] {
  const rnd = mulberry32(seed * 7919 + 13)
  const out: VineItem[] = []
  let yy = 50
  let n = 0
  let focal = Math.floor(rnd() * FOCAL.length)
  let nextFocal = compact ? 240 : 150
  while (yy < vine.height - 20) {
    const s = vine.samples.find((p) => p.y >= yy)
    if (!s) break
    const anchor = pointAt(vine, s.f)
    const side: 1 | -1 = n % 2 ? 1 : -1
    out.push({
      id: `l${n}`, kind: 'leaf', f: s.f, anchor, size: round1((0.5 + rnd() * 0.25) * (compact ? 0.35 : 1)),
      // Along the local tangent plus an outward rotation, so leaves droop away from the vine.
      rotate: Math.round(anchor.angle - side * (50 + rnd() * 20)),
    })
    if (yy >= nextFocal) {
      const f = FOCAL[focal % FOCAL.length] ?? FOCAL[0]
      focal++
      nextFocal = yy + (yy < 700 ? 190 : 320) / density
      if (f) {
        const pside: 1 | -1 = s.x < vine.width / 2 ? -1 : 1 // grow towards the roomier side
        const hero = yy < 700 ? 1.2 : 1
        const base: Omit<PlantSpec, 'anchor'> = {
          species: f.species, seed: seed * 101 + n, side: pside, reach: compact ? 9 : 52 + rnd() * 24,
          size: round1((compact ? COMPACT_SIZE : f.size * hero) * (0.9 + rnd() * 0.2)),
          leaves: compact ? 0 : 2, branches: compact ? 0 : f.branches, bud: !compact && rnd() < 0.15,
        }
        // Shrink until the plant fits inside the strip.
        let fit = base
        for (let i = 0; i < 6; i++) {
          const g = growPlant({ ...fit, anchor })
          const m = compact ? 2 : 6
          if (g.bounds.x0 >= m && g.bounds.x1 <= vine.width - m) break
          fit = { ...fit, reach: (fit.reach ?? 50) * 0.85, size: (fit.size ?? 1) * (i > 2 ? 0.88 : 1) }
        }
        out.push({ id: `p${n}`, kind: 'plant', f: s.f, anchor, rotate: 0, size: fit.size ?? 1, plant: fit })
      }
    }
    yy += (70 + rnd() * 50) / Math.sqrt(density)
    n++
  }
  return out.map((it, i) => ({ it, i })).sort((a, b) => a.it.f - b.it.f || a.i - b.i).map((e) => e.it)
}
