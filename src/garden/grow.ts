// Grows a plant from an anchor on a vine: curved stem, leaves on the stem, flower exactly on the stem tip.
import { pathModel, pointAt, round1 } from './anchor'
import { SPECIES_SCALE, generateFlower } from './flowers'
import { mulberry32 } from './rng'
import type { Anchor, PlantGeometry, PlantNode, PlantSpec, Pt, Species } from './types'

const rad = (deg: number): number => (deg * Math.PI) / 180
const unit = (deg: number): Pt => ({ x: Math.cos(rad(deg)), y: Math.sin(rad(deg)) })
const wrap = (a: number): number => ((((a + 180) % 360) + 360) % 360) - 180

/** Final stem direction: upright flowers turn towards the sky, bells towards the ground. */
function endAngleFor(dir0: number, species: Species): number {
  const target = species === 'bell' ? 90 : -90
  const gap = wrap(target - dir0)
  return wrap(dir0 + gap * (species === 'bell' ? 0.85 : 0.55))
}

/**
 * Grow a stem from `a`: starts at `dir0`, bows with a slight S-bend and ends tangent to `endAngle`
 * exactly (the last control point lies on that line), so a flower can be aligned to it.
 */
export function growStem(a: Anchor, reach: number, dir0: number, endAngle: number, bend: number): { stem: ReturnType<typeof pathModel>; tip: Anchor } {
  const u0 = unit(dir0)
  const u1 = unit(endAngle)
  const p3 = { x: round1(a.x + (u0.x + u1.x) * reach * 0.5), y: round1(a.y + (u0.y + u1.y) * reach * 0.5) }
  const p1 = { x: round1(a.x + u0.x * reach * 0.4 - u0.y * bend), y: round1(a.y + u0.y * reach * 0.4 + u0.x * bend) }
  const p2 = { x: round1(p3.x - u1.x * reach * 0.35), y: round1(p3.y - u1.y * reach * 0.35) }
  const stem = pathModel([{ p0: { x: a.x, y: a.y }, p1, p2, p3 }])
  const end = pointAt(stem, 1)
  return { stem, tip: end }
}

function growNode(spec: PlantSpec, anchor: Anchor, reach: number, size: number, spread: number, start: number, leaves: number, bud: boolean, seed: number, side: 1 | -1): PlantNode {
  const rnd = mulberry32(seed * 40503 + 5)
  const dir0 = anchor.angle - side * spread + (rnd() - 0.5) * 20
  const endAngle = endAngleFor(dir0, spec.species)
  const bend = reach * 0.1 * (rnd() < 0.5 ? -1 : 1)
  const { stem, tip } = growStem(anchor, reach, dir0, endAngle, bend)
  const tilt = Math.round((rnd() - 0.5) * (spec.species === 'bell' ? 16 : 28))
  const generated = generateFlower(spec.species, seed, { closed: bud })
  const flower = spec.palette ? { ...generated, palette: spec.palette } : generated
  const scale = SPECIES_SCALE[spec.species] * size
  const out: PlantNode['leaves'] = []
  for (let i = 0; i < leaves; i++) {
    const p = pointAt(stem, leaves === 1 ? 0.4 : 0.28 + i * (0.4 / (leaves - 1)))
    const s = (i % 2 ? 1 : -1) * side
    out.push({ x: round1(p.x), y: round1(p.y), rotate: Math.round(p.angle - s * (45 + rnd() * 15)), size: round1((0.34 + rnd() * 0.12) * Math.max(0.6, size)) })
  }
  // The flower base IS the stem tip; its axis follows the tip tangent plus the declared tilt.
  return { stem, tip, flower, at: { x: tip.x, y: tip.y, rotate: tip.angle + 90 + tilt, scale }, tilt, leaves: out, start }
}

/** Pure and deterministic: the same spec always yields the same plant. */
export function growPlant(spec: PlantSpec): PlantGeometry {
  const side = spec.side ?? 1
  const size = spec.size ?? 1
  const main = growNode(spec, spec.anchor, spec.reach ?? 60, size, spec.spread ?? 120, 0, spec.leaves ?? 2, Boolean(spec.bud), spec.seed, side)
  const nodes = [main]
  const n = spec.branches ?? 0
  const cycle = spec.branchSpecies ?? ['forgetmenot', 'cornflower', 'daisy']
  for (let k = 0; k < n; k++) {
    const f = 0.42 + (k / Math.max(1, n)) * 0.45
    const a = pointAt(main.stem, f)
    const sp = cycle[k % cycle.length] ?? 'forgetmenot'
    const sub = { ...spec, species: sp }
    nodes.push(growNode(sub, a, (spec.reach ?? 60) * 0.55, size * 0.65, 50, 0.22 + k * 0.14, 0, n > 1 && k === n - 1, spec.seed * 31 + k + 1, (k % 2 ? 1 : -1) * side as 1 | -1))
  }
  let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity
  for (const nd of nodes) {
    const r = nd.flower.extent * nd.at.scale
    x0 = Math.min(x0, nd.tip.x - r, spec.anchor.x); x1 = Math.max(x1, nd.tip.x + r, spec.anchor.x)
    y0 = Math.min(y0, nd.tip.y - r); y1 = Math.max(y1, nd.tip.y + r)
  }
  return { nodes, bounds: { x0, x1, y0, y1 } }
}
