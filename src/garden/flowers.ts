// One seeded flower generator. Species are presets over the same FlowerSpec.
import { mulberry32 } from './rng'
import type { FlowerGeometry, FlowerSpec, Palette, PetalGeom, SepalGeom, Species, StamenGeom } from './types'

const r2 = (n: number): number => Math.round(n * 100) / 100
const wrap = (a: number): number => ((((a + 180) % 360) + 360) % 360) - 180

// Muted: roughly 20% dimmer and less saturated than the first art pass, to sit on a flat near-black page.
export const FLOWER_SPECIES: Record<Species, FlowerSpec> = {
  bloom: {
    petals: 5, layers: 2, length: 70, width: 17, sharp: 0.5, skew: 0.35, vary: 0.12, spread: 360,
    centerR: 0.16, stamens: 7, stamenLen: 0.29, antherR: 2.6, sepals: 5, sepalLen: 0.24,
    palette: {
      outer: ['#1f3270', '#3d62b0', '#7396c4'], inner: ['#2a3f86', '#4b79cc', '#a9bfdc'],
      edge: '#8aaad0', vein: '#d3deee', glow: '#5f8fd0', center: '#14224f',
      filament: '#e0cc98', anther: '#d6b85f', pollen: '#e8d48a', sepal: '#1d6577',
    },
  },
  cornflower: {
    petals: 12, layers: 1, length: 28, width: 4.2, sharp: 0.8, skew: 0.3, vary: 0.18, spread: 360,
    centerR: 0.18, stamens: 5, stamenLen: 0.3, antherR: 1.1, sepals: 0, sepalLen: 0,
    palette: {
      outer: ['#22408c', '#3f6bc4', '#7f9fda'], inner: ['#22408c', '#3f6bc4', '#7f9fda'],
      edge: '#93b3dc', vein: '#c4d4ee', glow: '#5f8fd0', center: '#1c2d63',
      filament: '#d8c88e', anther: '#cfb35c', pollen: '#e8d48a', sepal: '#1d6577',
    },
  },
  bell: {
    petals: 5, layers: 2, length: 46, width: 13, sharp: 0.35, skew: 0.25, vary: 0.1, spread: 76,
    centerR: 0.05, stamens: 3, stamenLen: 0.82, antherR: 2.2, sepals: 3, sepalLen: 0.18,
    palette: {
      outer: ['#2b2c6e', '#4a4fa6', '#7f84c4'], inner: ['#3a3f8c', '#6068b8', '#a4a9de'],
      edge: '#9aa0d6', vein: '#c3c7ea', glow: '#6a70c0', center: '#1d1f4d',
      filament: '#d9cfa0', anther: '#cfb35c', pollen: '#e8d48a', sepal: '#1d6577',
    },
  },
  forgetmenot: {
    petals: 5, layers: 1, length: 20, width: 9.5, sharp: 0, skew: 0.15, vary: 0.1, spread: 360,
    centerR: 0.24, stamens: 3, stamenLen: 0.2, antherR: 1.1, sepals: 5, sepalLen: 0.3,
    palette: {
      outer: ['#3f5c9c', '#6a8ec8', '#b4c8e6'], inner: ['#3f5c9c', '#6a8ec8', '#b4c8e6'],
      edge: '#a9bfe0', vein: '#dbe5f4', glow: '#7a9fd8', center: '#cdb86c',
      filament: '#e6d9a0', anther: '#d6b85f', pollen: '#e8d48a', sepal: '#1d6577',
    },
  },
  daisy: {
    petals: 13, layers: 2, length: 30, width: 5.2, sharp: 0.3, skew: 0.2, vary: 0.14, spread: 360,
    centerR: 0.26, stamens: 6, stamenLen: 0.2, antherR: 1, sepals: 0, sepalLen: 0,
    palette: {
      outer: ['#6f84ae', '#9aaecf', '#cdd7ea'], inner: ['#7d90b8', '#aab9d6', '#dfe6f2'],
      edge: '#c8d3e8', vein: '#eef2f9', glow: '#9aaecf', center: '#b8963f',
      filament: '#e0cc98', anther: '#d6b85f', pollen: '#e8d48a', sepal: '#1d6577',
    },
  },
}

const STAMEN = { filament: '#e0cc98', anther: '#d6b85f', pollen: '#e8d48a', sepal: '#1d6577' } as const

/** Extra muted hues in the blue, violet and pale family, applied over any species (`PlantSpec.palette`). */
export const EXTRA_PALETTES: Palette[] = [
  { outer: ['#2e3a7a', '#5865b4', '#959fd6'], inner: ['#38458a', '#6774c2', '#b0b8e4'], edge: '#a3acdc', vein: '#d0d5f0', glow: '#6c78c8', center: '#1e2550', ...STAMEN },
  { outer: ['#3d3570', '#6a5ea8', '#a99fd2'], inner: ['#4a4084', '#7a6fbc', '#c2bbe2'], edge: '#b4abd8', vein: '#dcd7ef', glow: '#7d71bf', center: '#251f4a', ...STAMEN },
  { outer: ['#4b6488', '#7f98bb', '#c3d1e4'], inner: ['#5a7398', '#93abca', '#d8e2ef'], edge: '#c0cee2', vein: '#e8eef6', glow: '#8aa3c6', center: '#c9b26a', ...STAMEN },
  { outer: ['#24245e', '#43449a', '#7a7cc0'], inner: ['#2e2f72', '#5355ae', '#9799d4'], edge: '#8f92cc', vein: '#bfc1e6', glow: '#5d60b4', center: '#171842', ...STAMEN },
  { outer: ['#1f4766', '#3f7699', '#86aec6'], inner: ['#275576', '#4f88aa', '#a3c4d6'], edge: '#93b6cc', vein: '#cfe0ea', glow: '#5a92b4', center: '#132c42', ...STAMEN },
]

/** Display scale of each species when it is placed on a plant (1 = natural size on the page). */
export const SPECIES_SCALE: Record<Species, number> = { bloom: 0.5, cornflower: 1, bell: 0.85, forgetmenot: 1.4, daisy: 1 }

/** Leaf outline, base at the origin pointing +x. */
export const LEAF = {
  d: 'M0 0 C18 -22 52 -26 78 -4 C52 16 18 14 0 0Z',
  midrib: 'M2 -1 C25 -6 50 -6 74 -4',
  veins: 'M18 -4 L30 -15 M18 -4 L30 7 M36 -5 L48 -15 M36 -5 L48 5 M54 -5 L63 -12 M54 -5 L63 2',
} as const

function petalPath(L: number, w: number, sharp: number, skew: number): { d: string; veins: string } {
  const wl = w * (1 - skew * 0.25)
  const wr = w * (1 + skew * 0.25)
  const tx = skew * w * 0.5
  const y1 = -L * 0.26
  const y2 = -L * (0.95 - 0.4 * sharp)
  const d = `M0 0 C${r2(-wl * 0.95)} ${r2(y1)} ${r2(-wl * 1.05 + tx * 0.5)} ${r2(y2)} ${r2(tx)} ${r2(-L)} C${r2(wr * 1.05 + tx * 0.5)} ${r2(y2)} ${r2(wr * 0.95)} ${r2(y1)} 0 0Z`
  let veins = `M0 ${r2(-L * 0.06)} L${r2(tx * 0.9)} ${r2(-L * 0.88)}`
  if (L >= 30) {
    veins += ` M0 ${r2(-L * 0.28)} L${r2(-wl * 0.45)} ${r2(-L * 0.5)} M0 ${r2(-L * 0.28)} L${r2(wr * 0.45)} ${r2(-L * 0.5)}`
    veins += ` M0 ${r2(-L * 0.5)} L${r2(-wl * 0.35)} ${r2(-L * 0.72)} M0 ${r2(-L * 0.5)} L${r2(wr * 0.35)} ${r2(-L * 0.72)}`
  }
  return { d, veins }
}

/**
 * Geometry of one flower, deterministic for (spec, seed). The base (receptacle) is the origin and the
 * axis points to -y; rotate and translate it onto a stem tip. `closed` makes a bud that never opens.
 */
export function generateFlower(spec: FlowerSpec | Species, seed: number, { closed = false }: { closed?: boolean } = {}): FlowerGeometry {
  const species = typeof spec === 'string' ? spec : 'custom'
  const s = typeof spec === 'string' ? FLOWER_SPECIES[spec] : spec
  const rnd = mulberry32(seed * 2654435 + 11)
  const layers = Math.min(3, Math.max(1, Math.round(s.layers)))
  const full = s.spread >= 360
  const petals: PetalGeom[] = []
  let extent = 0
  for (let l = 0; l < layers; l++) {
    const k = 0.78 ** l // outer layers are larger
    const step = full ? 360 / s.petals : s.spread / s.petals
    for (let i = 0; i < s.petals; i++) {
      const v = (): number => 1 + (rnd() - 0.5) * 2 * s.vary
      const L = s.length * k * v()
      const w = s.width * k * v()
      const skew = s.skew * (rnd() - 0.5) * 2
      const base = full ? i * step + (l % 2) * step * 0.5 : -s.spread / 2 + (i + 0.5) * step + (l % 2) * step * 0.5 * (i % 2 ? -1 : 1)
      const angle = wrap(base + (rnd() - 0.5) * s.vary * 30)
      const p = petalPath(L, w, s.sharp, skew)
      petals.push({ layer: l, index: i, angle: r2(angle), d: p.d, veins: p.veins, length: L })
      extent = Math.max(extent, L)
    }
  }
  const sepals: SepalGeom[] = []
  for (let i = 0; i < s.sepals; i++) {
    const sl = s.length * s.sepalLen
    const sw = sl * 0.28
    const a = full ? (i + 0.5) * (360 / s.sepals) : -s.spread / 2 - 8 + (s.sepals > 1 ? (i * (s.spread + 16)) / (s.sepals - 1) : 0)
    sepals.push({ angle: r2(wrap(a)), d: `M0 0 C${r2(-sw)} ${r2(-sl * 0.3)} ${r2(-sw * 0.6)} ${r2(-sl * 0.8)} 0 ${r2(-sl)} C${r2(sw * 0.6)} ${r2(-sl * 0.8)} ${r2(sw)} ${r2(-sl * 0.3)} 0 0Z` })
  }
  const stamens: StamenGeom[] = []
  if (!closed) {
    for (let i = 0; i < s.stamens; i++) {
      const a = (full ? (i / s.stamens) * 360 + (rnd() - 0.5) * 20 : (-s.spread / 3) + (s.stamens > 1 ? (i * (2 * s.spread)) / (3 * (s.stamens - 1)) : 0)) * (Math.PI / 180)
      const len = s.length * s.stamenLen * (0.85 + rnd() * 0.3)
      const ax = Math.sin(a) * len
      const ay = -Math.cos(a) * len
      const bow = (rnd() - 0.5) * len * 0.25
      const specks = [0, 1, 2].map(() => ({ x: r2(ax + (rnd() - 0.5) * s.antherR * 4), y: r2(ay + (rnd() - 0.5) * s.antherR * 4), r: r2(s.antherR * (0.25 + rnd() * 0.2)) }))
      stamens.push({ filament: `M0 0 Q${r2(ax * 0.5 + bow)} ${r2(ay * 0.5 - bow)} ${r2(ax)} ${r2(ay)}`, ax: r2(ax), ay: r2(ay), r: s.antherR, specks })
    }
  }
  return {
    species, seed, palette: s.palette, layers, petals, sepals, stamens,
    centerR: r2(s.length * s.centerR), receptacleR: r2(Math.max(1.5, s.length * 0.06)), glowR: r2(extent * 1.35), extent: r2(extent), closed,
  }
}
