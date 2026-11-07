import type { Ref } from 'vue'

/** Options for `useGrow`. */
export interface GrowOptions {
  /** Stay grown once visible (default true). */
  once?: boolean
  /** IntersectionObserver threshold (default 0.2). */
  threshold?: number
}

/** Props shared by Bloom, Cornflower, Bud and Leaf (each renders an SVG `<g>`). */
export interface ArtProps {
  /** Override growth; default inherits the parent Vine, else the element's own visibility. */
  grown?: boolean
  /** Scale. */
  size?: number
  /** Animation delay in ms. */
  delay?: number
  x?: number
  y?: number
  /** Degrees. */
  rotate?: number
  /** Fully visible, no animation. */
  isStatic?: boolean
}

/** Props of Vine, the `<svg>` that grows along `path` and drives its children. */
export interface VineProps {
  /** SVG path `d`. */
  path: string
  /** Stem growth in ms (default 2400). */
  duration?: number
  grown?: boolean
  /** Width as a multiple of the parent width (default 1). */
  size?: number
  delay?: number
  /** Default `0 0 400 600`. */
  viewBox?: string
  isStatic?: boolean
}

/** What a Vine provides to the art components inside it. */
export interface GardenContext {
  grown: Readonly<Ref<boolean>>
  isStatic: Readonly<Ref<boolean>>
}

export interface Pt {
  x: number
  y: number
}

/** A point on a path with the tangent angle in degrees (direction of travel, 0 = +x, 90 = down). */
export interface Anchor extends Pt {
  angle: number
}

export interface Cubic {
  p0: Pt
  p1: Pt
  p2: Pt
  p3: Pt
}

/** Cubic segments plus cumulative arc lengths; see `pathModel`, `parsePath`, `pointAt`. */
export interface PathModel {
  segs: Cubic[]
  /** Per-segment arc-length tables (16 steps). */
  tabs: number[][]
  /** Cumulative length at the end of each segment. */
  cum: number[]
  total: number
  /** SVG `d`. */
  d: string
}

export type Species = 'bloom' | 'cornflower' | 'bell' | 'forgetmenot' | 'daisy'

export interface Palette {
  /** Radial gradient stops, base to tip, for the outer petal layer. */
  outer: [string, string, string]
  /** Same for inner layers. */
  inner: [string, string, string]
  edge: string
  vein: string
  glow: string
  center: string
  filament: string
  anther: string
  pollen: string
  sepal: string
}

/** Tunable shape of one flower; `FLOWER_SPECIES` holds a preset per species. */
export interface FlowerSpec {
  petals: number
  /** 1 to 3 layers; outer layers are larger and offset by half a step. */
  layers: number
  length: number
  width: number
  /** Tip sharpness 0 (round) to 1 (pointed). */
  sharp: number
  /** Left/right asymmetry amount per petal. */
  skew: number
  /** Random variation of length, width and angle (0..0.3). */
  vary: number
  /** Degrees covered by the petals: 360 is a rosette, less is a fan (bell). */
  spread: number
  centerR: number
  stamens: number
  /** Filament length as a fraction of petal length. */
  stamenLen: number
  antherR: number
  sepals: number
  sepalLen: number
  palette: Palette
}

export interface PetalGeom {
  layer: number
  index: number
  /** Final angle around the axis in degrees (-180..180). */
  angle: number
  /** Petal outline, base at the origin, tip towards -y. */
  d: string
  veins: string
  length: number
}

export interface StamenGeom {
  filament: string
  ax: number
  ay: number
  r: number
  specks: { x: number; y: number; r: number }[]
}

export interface SepalGeom {
  angle: number
  d: string
}

/**
 * One flower in local coordinates: the receptacle (base) is the origin and the axis points to -y.
 * Place it with `translate(tip) rotate(rotate)` so the base sits exactly on a stem end.
 */
export interface FlowerGeometry {
  species: Species | 'custom'
  seed: number
  palette: Palette
  layers: number
  petals: PetalGeom[]
  sepals: SepalGeom[]
  stamens: StamenGeom[]
  centerR: number
  receptacleR: number
  glowR: number
  /** Largest distance from the origin to a petal tip. */
  extent: number
  /** A bud that never opens. */
  closed: boolean
}

export interface GrowthPhase {
  /** Vine, branch and stem drawing. */
  stem: number
  leaf: number
  calyx: number
  /** Closed bud swelling. */
  bud: number
  /** All petals opening (outer layer first). */
  open: number
  /** Filaments growing out of the centre. */
  stamen: number
  /** Anthers and pollen. */
  pollen: number
  /** Everything finished: gentle sway. */
  idle: boolean
}

export interface TimelineOptions {
  /** Whole vine-to-pollen sequence in ms (default 3200). */
  duration?: number
  /** Wait before playing, ms. */
  delay?: number
  /** Jump straight to the final state. */
  isStatic?: boolean | Readonly<Ref<boolean>>
}

export interface PlantSpec {
  species: Species
  seed: number
  /** Where the stem leaves the vine (use `pointAt`). */
  anchor: Anchor
  /** Which side of the vine the stem leaves on (default 1). */
  side?: 1 | -1
  /** Stem length in px (default 60). */
  reach?: number
  /** Multiplier on the species display size (default 1). */
  size?: number
  /** Leaves along the stem (default 2). */
  leaves?: number
  /** Side branches off the stem, each with its own smaller flower (default 0). */
  branches?: number
  /** A closed bud instead of an open flower. */
  bud?: boolean
  /** Degrees between the vine tangent and the stem start (default 120, use ~45 on a stem). */
  spread?: number
  /** Species of the side branches, cycled. */
  branchSpecies?: Species[]
}

export interface PlantNode {
  stem: PathModel
  tip: Anchor
  flower: FlowerGeometry
  /** Placement of the flower: base at the stem tip, axis along the tip tangent plus `tilt`. */
  at: { x: number; y: number; rotate: number; scale: number }
  /** Declared natural tilt in degrees; `at.rotate === tip.angle + 90 + tilt`. */
  tilt: number
  leaves: { x: number; y: number; rotate: number; size: number }[]
  /** Plant progress at which this node starts growing. */
  start: number
}

export interface PlantGeometry {
  nodes: PlantNode[]
  bounds: { x0: number; x1: number; y0: number; y1: number }
}

export interface PlantProps extends Omit<PlantSpec, 'seed'> {
  seed?: number
  grown?: boolean
  delay?: number
  duration?: number
  isStatic?: boolean
  /** Drive the whole plant manually (0..1) instead of the timeline. */
  progress?: number
  /** Gentle idle sway once fully grown (default false; Sprouts enables it only for a few plants near the viewport). */
  sway?: boolean
}

export interface FlowerProps extends ArtProps {
  species?: Species
  seed?: number
  bud?: boolean
  duration?: number
  /** Drive the flower manually (0..1). */
  progress?: number
}

/** Props of the species wrappers Bloom, Cornflower, Bell, ForgetMeNot, Daisy. */
export interface SpeciesProps extends ArtProps {
  seed?: number
  bud?: boolean
  duration?: number
  progress?: number
}
